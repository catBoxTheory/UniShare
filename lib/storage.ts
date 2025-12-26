import { S3Client, PutObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

// Storage Configuration
const endpoint = process.env.STORAGE_ENDPOINT || process.env.MINIO_ENDPOINT || "http://localhost:9000";
const accessKeyId = process.env.STORAGE_ACCESS_KEY || process.env.MINIO_ACCESS_KEY || "minioadmin";
const secretAccessKey = process.env.STORAGE_SECRET_KEY || process.env.MINIO_SECRET_KEY || "minioadmin";
const bucketName = process.env.STORAGE_BUCKET_NAME || process.env.MINIO_BUCKET_NAME || "unishare-bucket";
const publicUrl = process.env.STORAGE_PUBLIC_URL; // Optional: for R2 public domain or custom domain

const s3Client = new S3Client({
  region: "auto",
  endpoint: endpoint,
  forcePathStyle: false, // R2 generally prefers virtual-hosted style for SSL/TLS
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function ensureBucketExists(name: string) {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: name }));
  } catch (error: any) {
    console.warn(`Bucket ${name} check failed or not found. Ensure it exists in R2/MinIO dashboard. Error:`, error.name);
    // We continue anyway as some tokens don't allow HeadBucket but allow PutObject
  }
}

export async function uploadFileToMinio(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  await ensureBucketExists(bucketName);

  const key = `${Date.now()}-${filename}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);
    
    // Generate the access URL
    if (publicUrl) {
        // If a public R2 URL is provided (e.g., https://pub-xxx.r2.dev or custom domain)
        return `${publicUrl.replace(/\/$/, '')}/${key}`;
    }
    
    // Fallback to S3 endpoint structure (standard for MinIO)
    return `${endpoint.replace(/\/$/, '')}/${bucketName}/${key}`;
  } catch (error) {
    console.error("Storage upload error:", error);
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
