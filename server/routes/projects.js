import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res) => {
  try {
    const result = await query('SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC', [req.user.userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, data } = req.body;
    const result = await query(
      'INSERT INTO projects (user_id, name, data) VALUES ($1, $2, $3) RETURNING *',
      [req.user.userId, name, JSON.stringify(data)]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { data } = req.body;
    const result = await query(
      'UPDATE projects SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING *',
      [JSON.stringify(data), req.params.id, req.user.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;