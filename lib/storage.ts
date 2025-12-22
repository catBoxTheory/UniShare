import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "us-east-1", // MinIO doesn't care, but SDK needs it
  endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
  forcePathStyle: true, // Required for MinIO
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
});

// #region agent log
try {
  fetch('http://127.0.0.1:7242/ingest/0c41b2f4-650b-4020-850e-d85b52635ad8', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      location: 'lib/storage.ts:global',
      message: 'S3 Client initialized',
      data: { endpoint: process.env.MINIO_ENDPOINT },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'minio-connection'
    })
  }).catch(() => {});
} catch (e) {}
// #endregion

async function ensureBucketExists(bucketName: string) {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      console.log(`Bucket ${bucketName} not found, creating...`);
      // #region agent log
      try {
        fetch('http://127.0.0.1:7242/ingest/0c41b2f4-650b-4020-850e-d85b52635ad8', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            location: 'lib/storage.ts:ensureBucketExists',
            message: 'Creating bucket',
            data: { bucketName },
            timestamp: Date.now(),
            sessionId: 'debug-session',
            runId: 'run1',
            hypothesisId: 'minio-bucket-creation'
          })
        }).catch(() => {});
      } catch (e) {}
      // #endregion
      try {
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`Bucket ${bucketName} created.`);
        
        // Set public read policy
        const policy = {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: { AWS: ["*"] },
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        };

        await s3Client.send(new PutBucketPolicyCommand({
          Bucket: bucketName,
          Policy: JSON.stringify(policy)
        }));
        console.log(`Public read policy set for bucket ${bucketName}`);

      } catch (createError) {
        console.error(`Error creating bucket ${bucketName}:`, createError);
        throw createError;
      }
    } else {
      throw error;
    }
  }
}

export async function uploadFileToMinio(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const bucketName = process.env.MINIO_BUCKET_NAME || "unistream-bucket";

  // Ensure bucket exists before uploading
  await ensureBucketExists(bucketName);

  // Ensure unique filename
  const key = `${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);
    // Return the URL to access the file
    // Note: In production, you might want to use a public URL or a signed URL
    return `${process.env.MINIO_ENDPOINT || "http://localhost:9000"}/${bucketName}/${key}`;
  } catch (error) {
    console.error("Error uploading to MinIO:", error);
    throw new Error("Failed to upload file");
  }
}

/**
 * Deletes a file from MinIO storage
 * @param fileUrl - The full URL of the file to delete (e.g., http://localhost:9000/bucket/key)
 */
export async function deleteFileFromMinio(fileUrl: string): Promise<void> {
  const bucketName = process.env.MINIO_BUCKET_NAME || "unistream-bucket";

  try {
    // Extract the key from the URL
    // URL format: http://localhost:9000/bucket-name/filename
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // First part is bucket name, rest is the key
    if (pathParts.length < 2) {
      throw new Error("Invalid file URL format");
    }
    
    const key = pathParts.slice(1).join('/'); // Everything after bucket name

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    await s3Client.send(command);
    console.log(`Successfully deleted ${key} from MinIO`);
  } catch (error) {
    console.error("Error deleting from MinIO:", error);
    throw new Error("Failed to delete file from storage");
  }
}

