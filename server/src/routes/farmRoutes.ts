import { Router } from 'express';
import { pool } from '../db/config';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// GET /api/farms/today/:officerId
router.get('/today/:officerId', async (req, res) => {
    const { officerId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    try {
        // 1. Check if assignment exists for today
        const assignmentQuery = await pool.query(
            `SELECT * FROM daily_assignments WHERE officer_id = $1 AND date = $2`,
            [officerId, today]
        );

        let farmIds: string[] = [];
        let completedIds: string[] = [];

        if (assignmentQuery.rows.length === 0) {
            // 2. If no assignment, auto-assign all seed farms for DEMO purposes
            const allFarms = await pool.query('SELECT id FROM farms LIMIT 5');
            farmIds = allFarms.rows.map(f => f.id);

            if (farmIds.length > 0) {
                await pool.query(
                    `INSERT INTO daily_assignments (officer_id, date, farm_ids, status) 
           VALUES ($1, $2, $3, 'assigned')`,
                    [officerId, today, farmIds]
                );
            }
        } else {
            farmIds = assignmentQuery.rows[0].farm_ids || [];
            completedIds = assignmentQuery.rows[0].completed_ids || [];
        }

        // 3. Fetch full farm details
        if (farmIds.length === 0) {
            return res.json([]);
        }

        const farmsQuery = await pool.query(
            `SELECT id, name, village, ST_AsGeoJSON(location) as location, 
              contact_name, contact_phone, priority, status 
       FROM farms WHERE id = ANY($1::uuid[])`,
            [farmIds]
        );

        const farms = farmsQuery.rows.map(farm => ({
            ...farm,
            location: JSON.parse(farm.location),
            status: completedIds.includes(farm.id) ? 'visited' : 'pending' // Overlay status
        }));

        // Sort by priority (High > Medium > Low)
        const priorityOrder: { [key: string]: number } = { 'High': 1, 'Medium': 2, 'Low': 3 };
        farms.sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));

        res.json(farms);
    } catch (error) {
        console.error('Error fetching todays farms:', error);
        res.status(500).json({ error: 'Failed to fetch assignments' });
    }
});

// POST /api/farms/:farmId/complete
router.post('/:farmId/complete', async (req, res) => {
    const { farmId } = req.params;
    const { officerId } = req.body; // Expect officerId in body
    const today = new Date().toISOString().split('T')[0];

    try {
        // Add to completed_ids
        await pool.query(
            `UPDATE daily_assignments 
       SET completed_ids = array_append(completed_ids, $1), 
           updated_at = NOW()
       WHERE officer_id = $2 AND date = $3 AND NOT ($1 = ANY(completed_ids))`,
            [farmId, officerId, today]
        );

        res.json({ success: true, message: 'Farm marked as completed' });
    } catch (error) {
        console.error('Error completing farm:', error);
        res.status(500).json({ error: 'Failed to complete assignment' });
    }
});

// GET /api/farms/navigation-route
// Returns ordered waypoints for the assigned farms
router.get('/navigation-route', async (req, res) => {
    // For now, allow client to calculate route or return mocked route points
    // This could integrate with OSRM or Google Routes API in future
    res.json({ message: "Not implemented yet, use client-side routing" });
});

export default router;
