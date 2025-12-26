import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import https from "https";

// Storage Configuration
const rawEndpoint = (process.env.STORAGE_ENDPOINT || process.env.MINIO_ENDPOINT || "http://localhost:9000").trim();
const endpoint = rawEndpoint.replace(/\/$/, "");

const accessKeyId = (process.env.STORAGE_ACCESS_KEY || process.env.MINIO_ACCESS_KEY || "minioadmin").trim();
const secretAccessKey = (process.env.STORAGE_SECRET_KEY || process.env.MINIO_SECRET_KEY || "minioadmin").trim();
const bucketName = (process.env.STORAGE_BUCKET_NAME || process.env.MINIO_BUCKET_NAME || "unishare-bucket").trim();
const publicUrl = process.env.STORAGE_PUBLIC_URL?.trim();

// 核心修复：强制使用 TLS 1.2 以解决 Vercel 与 R2 之间的 SSL 握手失败 (SSL alert 40)
// #region agent log
fetch('http://127.0.0.1:7242/ingest/0c41b2f4-650b-4020-850e-d85b52635ad8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/storage.ts:Init',message:'S3 Client Init Params',data:{rawEndpoint:process.env.STORAGE_ENDPOINT,bucketName:process.env.STORAGE_BUCKET_NAME},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
// #endregion

const s3Client = new S3Client({
  region: "auto", 
  endpoint: endpoint,
  forcePathStyle: true, 
  requestHandler: new NodeHttpHandler({
    httpsAgent: new https.Agent({
      minVersion: 'TLSv1.2',
      maxVersion: 'TLSv1.2', 
      servername: new URL(endpoint).hostname,
    }),
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

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/0c41b2f4-650b-4020-850e-d85b52635ad8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/storage.ts:uploadFileToMinio',message:'Pre-upload check',data:{key,contentType,bucketName,endpoint,hostname:new URL(endpoint).hostname},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
  // #endregion

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  try {
    console.log(`Uploading to R2 (Forced TLS 1.2): Bucket=${bucketName}, Key=${key}, Endpoint=${endpoint}`);
    await s3Client.send(command);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0c41b2f4-650b-4020-850e-d85b52635ad8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/storage.ts:uploadFileToMinio',message:'Upload success',data:{key},timestamp:Date.now(),sessionId:'debug-session'})}).catch(()=>{});
    // #endregion

    // Generate the access URL
    if (publicUrl) {
        return `${publicUrl.replace(/\/$/, '')}/${key}`;
    }
    
    // Fallback to S3 endpoint structure (standard for MinIO)
    return `${endpoint.replace(/\/$/, '')}/${bucketName}/${key}`;
  } catch (error: any) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/0c41b2f4-650b-4020-850e-d85b52635ad8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/storage.ts:uploadFileToMinio',message:'Upload error caught',data:{error:error.message,stack:error.stack,code:error.code},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
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
