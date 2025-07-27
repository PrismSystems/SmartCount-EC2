import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT p.*, array_agg(json_build_object(\'id\', pdf.id, \'name\', pdf.name, \'level\', pdf.level, \'fileUrl\', pdf.file_url, \'fileSize\', pdf.file_size)) as pdfs FROM projects p LEFT JOIN pdfs pdf ON p.id = pdf.project_id WHERE p.user_id = $1 GROUP BY p.id ORDER BY p.created_at DESC',
            [req.user.userId]
        );
        
        const projects = result.rows.map(row => ({
            ...row,
            pdfs: row.pdfs[0].id ? row.pdfs : []
        }));
        
        res.json(projects);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name, data } = req.body;
        
        const result = await pool.query(
            'INSERT INTO projects (user_id, name, data) VALUES ($1, $2, $3) RETURNING *',
            [req.user.userId, name, JSON.stringify(data)]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { data } = req.body;
        
        const result = await pool.query(
            'UPDATE projects SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
            [JSON.stringify(data), req.params.id, req.user.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;