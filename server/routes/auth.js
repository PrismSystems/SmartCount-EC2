import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if user exists
        const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Create user (not approved by default)
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, is_approved) VALUES ($1, $2, $3) RETURNING id, email',
            [email, passwordHash, false]
        );

        res.json({ success: true, message: 'Registration successful. Please wait for admin approval.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Get user with approval status
        const result = await pool.query(
            'SELECT id, email, password_hash, is_admin, is_approved, is_suspended FROM users WHERE email = $1', 
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        
        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if user is suspended
        if (user.is_suspended) {
            return res.status(403).json({ success: false, message: 'Account suspended. Contact administrator.' });
        }

        // Check if user is approved (admins bypass this check)
        if (!user.is_admin && !user.is_approved) {
            return res.status(403).json({ success: false, message: 'Account pending approval. Contact administrator.' });
        }

        // Generate JWT
        const token = jwt.sign({ 
            userId: user.id, 
            email: user.email, 
            isAdmin: user.is_admin 
        }, process.env.JWT_SECRET);
        
        res.json({ 
            success: true, 
            token, 
            user: { 
                id: user.id, 
                email: user.email, 
                isAdmin: user.is_admin 
            } 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
