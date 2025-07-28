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
        
        const projects = result.rows.map(row => {
            // Parse the stored project data and merge with basic info
            const storedData = row.data ? JSON.parse(row.data) : {};
            
            return {
                id: row.id,
                name: row.name,
                createdAt: new Date(row.created_at).getTime(),
                updatedAt: new Date(row.updated_at).getTime(),
                pdfs: row.pdfs[0].id ? row.pdfs : [],
                // Include all the project data (symbols, areas, measurements, etc.)
                symbols: storedData.symbols || [],
                disciplines: storedData.disciplines || [],
                areas: storedData.areas || [],
                measurements: storedData.measurements || [],
                measurementGroups: storedData.measurementGroups || [],
                daliNetworks: storedData.daliNetworks || [],
                daliDevices: storedData.daliDevices || [],
                ecdTypes: storedData.ecdTypes || [],
                daliNetworkTemplates: storedData.daliNetworkTemplates || []
            };
        });
        
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
        const { id } = req.params;
        const { data } = req.body;
        
        console.log('Updating project:', id);
        
        const result = await pool.query(
            'UPDATE projects SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
            [JSON.stringify(data), id, req.user.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }
        
        console.log('Project updated successfully');
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;

