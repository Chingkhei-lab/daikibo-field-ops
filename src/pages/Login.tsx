import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

interface LoginProps {
  onLogin?: (user: { id: string; name: string; token: string }) => void;
}

export function Login({ onLogin }: LoginProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'field_officer' | 'admin'>('field_officer');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password,
        role
      });

      if (response.data.success && response.data.user) {
        const { user, token } = response.data;

        // Store token
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // Update global store
        login({ ...user, token });

        if (onLogin) {
          onLogin({ ...user, token });
        }
        toast.success('Login successful!');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error(error.response?.data?.message || t('auth.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-4xl font-bold text-teal-600">O</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {t('app.name')}
          </h1>
          <p className="text-teal-100">{t('app.tagline')}</p>
        </div>

        {/* Role Toggle */}
        <div className="bg-teal-800/30 p-1 rounded-lg mb-6 flex">
          <button
            type="button"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${role === 'field_officer'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-teal-100 hover:bg-teal-700/50'
              }`}
            onClick={() => setRole('field_officer')}
          >
            Field Officer
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${role === 'admin'
              ? 'bg-white text-teal-700 shadow-sm'
              : 'text-teal-100 hover:bg-teal-700/50'
              }`}
            onClick={() => setRole('admin')}
          >
            Manager
          </button>
        </div>

        {/* Login Form */}
        <Card className="p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-mobile-base">
                {t('auth.email')}
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@occamy.com"
                  className="pl-12 h-14"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-mobile-base">
                {t('auth.password')}
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-12 pr-12 h-14"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-mobile-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  {t('auth.loggingIn')}
                </>
              ) : (
                t('auth.login')
              )}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Don't have an account?{' '}
              <Link to="/signup" className="text-teal-600 font-semibold hover:underline">
                Sign up as Manager
              </Link>
            </p>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-center">
                New Field Officer?{' '}
                <Link to="/register-officer" className="text-teal-700 font-bold hover:underline">
                  Register Here
                </Link>
              </p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-teal-100 text-sm mt-8">
          © 2024 Occamy Field Ops. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;
