import express from 'express';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const s3 = new AWS.S3({ region: process.env.AWS_REGION });

router.use(authenticateToken);

router.post('/upload', async (req, res) => {
  try {
    const { fileName, fileData, contentType } = req.body;
    const fileId = uuidv4();
    const key = `${req.user.userId}/${fileId}/${fileName}`;

    const buffer = Buffer.from(fileData, 'base64');
    
    await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType
    }).promise();

    res.json({ fileId, key });
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const key = `${req.user.userId}/${fileId}`;

    const objects = await s3.listObjectsV2({
      Bucket: process.env.AWS_S3_BUCKET,
      Prefix: key
    }).promise();

    if (objects.Contents.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const fileKey = objects.Contents[0].Key;
    const signedUrl = s3.getSignedUrl('getObject', {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileKey,
      Expires: 3600
    });

    res.json({ url: signedUrl });
  } catch (error) {
    console.error('PDF get error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;