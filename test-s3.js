require('dotenv').config({ path: './server/.env' });
const AWS = require('aws-sdk');

// Configure AWS
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

async function testS3Connection() {
    console.log('Testing S3 connection...');
    console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set');
    console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set');
    console.log('AWS_REGION:', process.env.AWS_REGION);
    console.log('AWS_BUCKET_NAME:', process.env.AWS_BUCKET_NAME);
    console.log('---');

    try {
        // Test 1: List buckets (basic connectivity)
        console.log('1. Testing basic AWS connectivity...');
        const buckets = await s3.listBuckets().promise();
        console.log('✅ AWS connection successful');
        console.log('Available buckets:', buckets.Buckets.map(b => b.Name));
        
        // Test 2: Check if our specific bucket exists
        console.log('\n2. Testing bucket access...');
        const bucketName = process.env.AWS_BUCKET_NAME;
        
        if (!bucketName) {
            console.log('❌ AWS_BUCKET_NAME not set in environment');
            return;
        }
        
        await s3.headBucket({ Bucket: bucketName }).promise();
        console.log(`✅ Bucket "${bucketName}" is accessible`);
        
        // Test 3: List objects in bucket
        console.log('\n3. Testing bucket contents...');
        const objects = await s3.listObjectsV2({ 
            Bucket: bucketName,
            MaxKeys: 10 
        }).promise();
        console.log(`✅ Found ${objects.KeyCount} objects in bucket`);
        
        if (objects.Contents && objects.Contents.length > 0) {
            console.log('Sample objects:');
            objects.Contents.slice(0, 5).forEach(obj => {
                console.log(`  - ${obj.Key} (${obj.Size} bytes)`);
            });
        }
        
        // Test 4: Test upload (small test file)
        console.log('\n4. Testing upload capability...');
        const testKey = 'test-connection.txt';
        const testContent = 'This is a test file created at ' + new Date().toISOString();
        
        await s3.upload({
            Bucket: bucketName,
            Key: testKey,
            Body: testContent,
            ContentType: 'text/plain'
        }).promise();
        console.log('✅ Test upload successful');
        
        // Clean up test file
        await s3.deleteObject({
            Bucket: bucketName,
            Key: testKey
        }).promise();
        console.log('✅ Test file cleaned up');
        
        console.log('\n🎉 All S3 tests passed! Your bucket is fully functional.');
        
    } catch (error) {
        console.error('❌ S3 Test failed:', error.message);
        
        if (error.code === 'InvalidAccessKeyId') {
            console.log('💡 Check your AWS_ACCESS_KEY_ID');
        } else if (error.code === 'SignatureDoesNotMatch') {
            console.log('💡 Check your AWS_SECRET_ACCESS_KEY');
        } else if (error.code === 'NoSuchBucket') {
            console.log('💡 Check your AWS_BUCKET_NAME - bucket may not exist');
        } else if (error.code === 'AccessDenied') {
            console.log('💡 Check your IAM permissions for S3 access');
        }
    }
}

testS3Connection();