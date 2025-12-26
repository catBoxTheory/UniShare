import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";

// Storage Configuration
const rawEndpoint = (process.env.STORAGE_ENDPOINT || process.env.MINIO_ENDPOINT || "http://localhost:9000").trim();
const endpoint = rawEndpoint.replace(/\/$/, "");

const accessKeyId = (process.env.STORAGE_ACCESS_KEY || process.env.MINIO_ACCESS_KEY || "minioadmin").trim();
const secretAccessKey = (process.env.STORAGE_SECRET_KEY || process.env.MINIO_SECRET_KEY || "minioadmin").trim();
const bucketName = (process.env.STORAGE_BUCKET_NAME || process.env.MINIO_BUCKET_NAME || "unishare-bucket").trim();
const publicUrl = process.env.STORAGE_PUBLIC_URL?.trim();

const s3Client = new S3Client({
  region: "auto",
  endpoint: endpoint,
  // MANDATORY for Cloudflare R2 to avoid SSL SNI errors
  forcePathStyle: true,
  requestHandler: new NodeHttpHandler({
    connectionTimeout: 10000,
    socketTimeout: 10000,
  }),
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function uploadFileToMinio(
  file: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
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
    if (error.code === 'EPROTO' || error.name === 'Error' || error.message?.includes('handshake')) {
       console.error("SSL/TLS Handshake failure detected. Using NodeHttpHandler to stabilize connection.");
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
