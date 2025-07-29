import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware to check admin status
const requireAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

router.use(authenticateToken);
router.use(requireAdmin);

// Get pending users
router.get('/pending-users', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, created_at FROM users WHERE is_approved = FALSE AND is_admin = FALSE ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get pending users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all users
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, is_admin, is_approved, is_suspended, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve user
router.post('/approve-user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        await pool.query(
            'UPDATE users SET is_approved = TRUE, approved_by = $1, approved_at = CURRENT_TIMESTAMP WHERE id = $2',
            [req.user.userId, id]
        );

        // Log action
        await pool.query(
            'INSERT INTO admin_logs (admin_id, action, target_user_id) VALUES ($1, $2, $3)',
            [req.user.userId, 'APPROVE_USER', id]
        );

        res.json({ success: true, message: 'User approved' });
    } catch (error) {
        console.error('Approve user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Suspend/unsuspend user
router.post('/suspend-user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { suspend } = req.body;
        
        await pool.query(
            'UPDATE users SET is_suspended = $1 WHERE id = $2',
            [suspend, id]
        );

        // Log action
        await pool.query(
            'INSERT INTO admin_logs (admin_id, action, target_user_id) VALUES ($1, $2, $3)',
            [req.user.userId, suspend ? 'SUSPEND_USER' : 'UNSUSPEND_USER', id]
        );

        res.json({ success: true, message: suspend ? 'User suspended' : 'User unsuspended' });
    } catch (error) {
        console.error('Suspend user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Archive/unarchive project
router.post('/archive-project/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { archive } = req.body;
        
        await pool.query(
            'UPDATE projects SET is_archived = $1, archived_by = $2, archived_at = $3 WHERE id = $4',
            [archive, req.user.userId, archive ? new Date() : null, id]
        );

        // Log action
        await pool.query(
            'INSERT INTO admin_logs (admin_id, action, target_project_id) VALUES ($1, $2, $3)',
            [req.user.userId, archive ? 'ARCHIVE_PROJECT' : 'UNARCHIVE_PROJECT', id]
        );

        res.json({ success: true, message: archive ? 'Project archived' : 'Project unarchived' });
    } catch (error) {
        console.error('Archive project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all projects (for admin view)
router.get('/projects', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.id, p.name, p.is_archived, p.created_at, u.email as user_email,
                   COUNT(pdf.id) as pdf_count
            FROM projects p 
            JOIN users u ON p.user_id = u.id 
            LEFT JOIN pdfs pdf ON p.id = pdf.project_id 
            GROUP BY p.id, p.name, p.is_archived, p.created_at, u.email 
            ORDER BY p.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Get admin projects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;