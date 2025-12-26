import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";

// Storage Configuration
const rawEndpoint = (process.env.STORAGE_ENDPOINT || process.env.MINIO_ENDPOINT || "http://localhost:9000").trim();
const endpoint = rawEndpoint.replace(/\/$/, "");

const accessKeyId = (process.env.STORAGE_ACCESS_KEY || process.env.MINIO_ACCESS_KEY || "minioadmin").trim();
const secretAccessKey = (process.env.STORAGE_SECRET_KEY || process.env.MINIO_SECRET_KEY || "minioadmin").trim();
const bucketName = (process.env.STORAGE_BUCKET_NAME || process.env.MINIO_BUCKET_NAME || "unishare-bucket").trim();
const publicUrl = process.env.STORAGE_PUBLIC_URL?.trim();

// Use FetchHttpHandler which is more compatible with Vercel's Edge/Serverless environments
const s3Client = new S3Client({
  region: "auto", 
  endpoint: endpoint,
  // R2 account-level endpoints REQUIRE path-style access
  forcePathStyle: true, 
  requestHandler: new FetchHttpHandler(),
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
    console.log(`Uploading to R2 via Fetch: Bucket=${bucketName}, Key=${key}`);
    await s3Client.send(command);
    
    // Generate the access URL
    if (publicUrl) {
        return `${publicUrl.replace(/\/$/, '')}/${key}`;
    }
    
    return `${endpoint.replace(/\/$/, '')}/${bucketName}/${key}`;
  } catch (error: any) {
    console.error("Storage upload error details:", error);
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
                key = pathParts.join('/');
            } else if (pathParts.length >= 2) {
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
