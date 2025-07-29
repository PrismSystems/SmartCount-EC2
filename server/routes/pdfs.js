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

// Apply authentication to all routes
router.use(authenticateToken);

// POST /api/pdfs/upload
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

// GET /api/pdfs/:id/download
router.get('/:id/download', async (req, res) => {
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
        
        // Stream PDF directly from S3 through server
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key
        };
        
        const stream = s3.getObject(params).createReadStream();
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${pdf.name}.pdf"`);
        
        stream.pipe(res);
    } catch (error) {
        console.error('Download PDF error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// DELETE /api/pdfs/:id
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log('DELETE /api/pdfs/:id called with ID:', id);
        console.log('User:', req.user);
        
        // Get PDF info first to check ownership and get S3 key
        const result = await pool.query(
            'SELECT p.*, pr.user_id FROM pdfs p JOIN projects pr ON p.project_id = pr.id WHERE p.id = $1 AND pr.user_id = $2',
            [id, req.user.userId]
        );
        
        console.log('Database query result:', result.rows);
        
        if (result.rows.length === 0) {
            console.log('PDF not found or user does not have access');
            return res.status(404).json({ message: 'PDF not found' });
        }
        
        const pdf = result.rows[0];
        const key = `${req.user.userId}/${pdf.project_id}/${pdf.id}.pdf`;
        
        console.log('Deleting PDF with key:', key);
        
        // Delete from S3
        try {
            await s3.deleteObject({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key
            }).promise();
            console.log('PDF deleted from S3:', key);
        } catch (s3Error) {
            console.error('Error deleting from S3:', s3Error);
            // Continue with database deletion even if S3 deletion fails
        }
        
        // Delete from database
        await pool.query('DELETE FROM pdfs WHERE id = $1', [id]);
        
        console.log('PDF deleted successfully from database');
        res.json({ message: 'PDF deleted successfully' });
    } catch (error) {
        console.error('Delete PDF error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;


