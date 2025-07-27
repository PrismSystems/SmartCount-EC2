import express from 'express';
import AWS from 'aws-sdk';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Configure AWS
AWS.config.update({ region: process.env.AWS_REGION });
const s3 = new AWS.S3();

router.use(authenticateToken);

router.post('/upload', upload.single('pdf'), async (req, res) => {
    try {
        const { projectId, name, level } = req.body;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileId = uuidv4();
        const key = `${req.user.userId}/${projectId}/${fileId}.pdf`;
        
        // Upload to S3
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Body: file.buffer,
            ContentType: 'application/pdf'
        };
        
        const s3Result = await s3.upload(uploadParams).promise();
        
        // Save to database
        const dbResult = await pool.query(
            'INSERT INTO pdfs (id, project_id, name, level, file_url, file_size) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [fileId, projectId, name, level, s3Result.Location, file.size]
        );
        
        res.json(dbResult.rows[0]);
    } catch (error) {
        console.error('PDF upload error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT p.*, pr.user_id FROM pdfs p JOIN projects pr ON p.project_id = pr.id WHERE p.id = $1 AND pr.user_id = $2',
            [req.params.id, req.user.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'PDF not found' });
        }
        
        const pdf = result.rows[0];
        const key = `${req.user.userId}/${pdf.project_id}/${pdf.id}.pdf`;
        
        // Get signed URL from S3
        const signedUrl = s3.getSignedUrl('getObject', {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            Expires: 3600 // 1 hour
        });
        
        res.json({ ...pdf, signedUrl });
    } catch (error) {
        console.error('Get PDF error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;