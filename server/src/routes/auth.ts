import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { pool } from '../db/config';
import { generateTokens, verifyRefreshToken, authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;
    console.log('[Login Attempt] Email:', email);

    try {
      const result = await pool.query(
        'SELECT id, email, password_hash, name, role FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        console.log('[Login Failed] User not found');
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const user = result.rows[0];
      console.log('[Login] User found, verifying password...');

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      console.log('[Login] Password valid:', isValidPassword);

      if (!isValidPassword) {
        console.log('[Login Failed] Invalid password');
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const { accessToken, refreshToken } = generateTokens(
        user.id,
        user.email,
        user.role
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token: accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
);

// Verify Admin Code
router.post('/verify-code', async (req: Request, res: Response) => {
  const { code } = req.body;
  try {
    const result = await pool.query(
      'SELECT region, manager_name, is_one_time FROM admin_codes WHERE code = $1 AND is_active = TRUE AND is_used = FALSE AND (expires_at IS NULL OR expires_at > NOW())',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid Admin Code' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(), // Email required
    body('password').isLength({ min: 6 }),
    body('name').notEmpty().trim(),
    body('phone').optional().isMobilePhone('any'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { email, password, name, role, phone, territory, language, adminCode, organization, website } = req.body;

    try {
      // Check if user exists (by email OR phone)
      if (email) {
        const existingEmail = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingEmail.rows.length > 0) return res.status(400).json({ success: false, message: 'Email already exists' });
      }

      if (phone) {
        const existingPhone = await pool.query('SELECT id FROM users WHERE phone = $1', [phone]);
        if (existingPhone.rows.length > 0) return res.status(400).json({ success: false, message: 'Phone already exists' });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Validate role & Determine Status
      const validRoles = ['field_officer', 'admin', 'distributor', 'manager'];
      const userRole = validRoles.includes(role) ? role : 'field_officer';

      // Officers joining via self-reg are pending by default
      // UNLESS they used a special One-Time Code, which auto-approves them
      // Admins are always active
      let status = userRole === 'admin' ? 'active' : (adminCode ? 'pending' : 'active');

      // Check if code was one-time and if so, auto-activate
      if (adminCode) {
        const codeCheck = await pool.query('SELECT is_one_time FROM admin_codes WHERE code = $1', [adminCode]);
        if (codeCheck.rows.length > 0 && codeCheck.rows[0].is_one_time) {
          status = 'active'; // Auto-approve

          // Mark code as used
          await pool.query('UPDATE admin_codes SET is_used = TRUE, is_active = FALSE WHERE code = $1', [adminCode]);
        }
      }

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, name, role, phone, territory, language, status, admin_code, organization, website) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING id, email, name, role, status`,
        [email || null, passwordHash, name, userRole, phone, territory, language, status, adminCode, organization || null, website || null]
      );

      const user = result.rows[0];

      // Only generate tokens if active
      let tokens = { accessToken: '', refreshToken: '' };
      if (status === 'active') {
        tokens = generateTokens(user.id, user.email || user.name, user.role);
      }

      res.status(201).json({
        success: true,
        user,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        message: status === 'pending' ? 'Registration pending approval' : 'Registration successful'
      });
    } catch (error: any) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error: ' + error.message,
      });
    }
  }
);

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required',
    });
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    const result = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    const user = result.rows[0];
    const tokens = generateTokens(user.id, user.email, user.role);

    res.json({
      success: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
});

// Request verification
router.post('/request-verification', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query("UPDATE users SET status = 'pending' WHERE id = $1", [req.user!.id]);
    res.json({ success: true, message: 'Verification requested' });
  } catch (error) {
    console.error('Request verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT users.id, users.email, users.name, users.role, users.phone, users.territory, users.organization, users.website, users.status,
       m.name as manager_name,
       m.email as manager_email
       FROM users 
       LEFT JOIN admin_codes ac ON users.admin_code = ac.code
       LEFT JOIN users m ON ac.created_by = m.id
       WHERE users.id = $1`,
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        ...result.rows[0],
        organization: result.rows[0].organization || null,
        website: result.rows[0].website || null,
        status: result.rows[0].status || 'unverified',
        manager_name: result.rows[0].manager_name || 'Admin',
        manager_email: result.rows[0].manager_email || 'admin@ocammy.com'
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
});

// Update Language Preference
router.post('/update-language', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { language } = req.body;

  if (!language || !['en', 'hi'].includes(language)) {
    return res.status(400).json({ success: false, message: 'Invalid language' });
  }

  try {
    await pool.query('UPDATE users SET language = $1 WHERE id = $2', [language, req.user!.id]);
    res.json({ success: true, message: 'Language updated' });
  } catch (error) {
    console.error('Update language error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
