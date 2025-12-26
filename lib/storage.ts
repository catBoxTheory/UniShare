import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Storage Configuration
const rawEndpoint = (process.env.STORAGE_ENDPOINT || process.env.MINIO_ENDPOINT || "http://localhost:9000").trim();
// Ensure endpoint has no trailing slash
const endpoint = rawEndpoint.endsWith('/') ? rawEndpoint.slice(0, -1) : rawEndpoint;

const accessKeyId = (process.env.STORAGE_ACCESS_KEY || process.env.MINIO_ACCESS_KEY || "minioadmin").trim();
const secretAccessKey = (process.env.STORAGE_SECRET_KEY || process.env.MINIO_SECRET_KEY || "minioadmin").trim();
const bucketName = (process.env.STORAGE_BUCKET_NAME || process.env.MINIO_BUCKET_NAME || "unishare-bucket").trim();
const publicUrl = process.env.STORAGE_PUBLIC_URL?.trim();

const s3Client = new S3Client({
  region: "us-east-1", // Using us-east-1 for better compatibility on Vercel/Node.js with R2
  endpoint: endpoint,
  // MANDATORY for Cloudflare R2 to avoid SSL SNI errors
  forcePathStyle: true, 
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function ensureBucketExists(name: string) {
  try {
    // Some R2 tokens don't allow HeadBucket, so we catch errors
    await s3Client.send(new HeadBucketCommand({ Bucket: name }));
  } catch (error: any) {
    console.warn(`Bucket ${name} check skipped or failed:`, error.name);
  }
}

export async function uploadFileToMinio(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  // We skip ensureBucketExists because it often causes SSL/Permission errors
  // but doesn't prevent PutObject from working.
  
  const key = `${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  try {
    console.log(`Uploading to R2: Bucket=${bucketName}, Key=${key}, Endpoint=${endpoint}`);
    await s3Client.send(command);
    
    // Generate the access URL
    if (publicUrl) {
        // If a public R2 URL is provided (e.g., https://pub-xxx.r2.dev or custom domain)
        return `${publicUrl.replace(/\/$/, '')}/${key}`;
    }
    
    // Fallback to S3 endpoint structure (standard for MinIO)
    return `${endpoint.replace(/\/$/, '')}/${bucketName}/${key}`;
  } catch (error: any) {
    console.error("Storage upload error details:", error);
    // Explicitly check for SSL errors to provide better guidance
    if (error.code === 'EPROTO' || error.name === 'Error') {
       console.error("SSL/TLS Handshake failure detected. Possible SNI/Endpoint mismatch.");
    }
    throw new Error("Failed to upload file to storage");
  }
}

export async function deleteFileFromMinio(fileIdentifier: string): Promise<void> {
  try {
    let key = fileIdentifier;

    if (fileIdentifier.startsWith("http")) {
        try {
            const url = new URL(fileIdentifier);
            const pathParts = url.pathname.split('/').filter(Boolean);
            
            if (publicUrl && fileIdentifier.includes(publicUrl)) {
                // If using R2 public URL, the key is the whole path
                key = pathParts.join('/');
            } else if (pathParts.length >= 2) {
                // For MinIO: /bucket/key
                key = pathParts.slice(1).join('/');
            } else {
                key = pathParts[pathParts.length - 1];
            }
        } catch (e) {
            key = fileIdentifier;
        }
    }

    if (!key) return;

    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    }));
    console.log(`Successfully deleted ${key} from storage`);
  } catch (error) {
    console.error("Storage deletion error:", error);
  }
}
