import express from 'express';
import AWS from 'aws-sdk';
import multer from 'multer';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

router.post('/upload', authenticateToken, upload.single('pdf'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const key = `pdfs/${req.userId}/${Date.now()}-${req.file.originalname}`;
    
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype
    };

    const result = await s3.upload(uploadParams).promise();
    res.json({ url: result.Location, key: result.Key });
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload PDF' });
  }
});

router.get('/:key', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { key } = req.params;
    
    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: decodeURIComponent(key)
    };

    const signedUrl = s3.getSignedUrl('getObject', { ...params, Expires: 3600 });
    res.json({ url: signedUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get PDF' });
  }
});

export default router;