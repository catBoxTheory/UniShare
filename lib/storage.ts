import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";

// Storage Configuration
const cleanEnvVar = (val: string | undefined) => {
    if (!val) return "";
    let res = val.trim();
    // Remove wrapping quotes if they exist (common Vercel issue)
    if (res.startsWith('"') && res.endsWith('"')) res = res.slice(1, -1);
    if (res.startsWith("'") && res.endsWith("'")) res = res.slice(1, -1);
    return res.trim();
};

const endpoint = cleanEnvVar(process.env.STORAGE_ENDPOINT || process.env.MINIO_ENDPOINT || "http://localhost:9000").replace(/\/$/, "");
const accessKeyId = cleanEnvVar(process.env.STORAGE_ACCESS_KEY || process.env.MINIO_ACCESS_KEY || "minioadmin");
const secretAccessKey = cleanEnvVar(process.env.STORAGE_SECRET_KEY || process.env.MINIO_SECRET_KEY || "minioadmin");
const bucketName = cleanEnvVar(process.env.STORAGE_BUCKET_NAME || process.env.MINIO_BUCKET_NAME || "unishare-bucket");
const publicUrl = cleanEnvVar(process.env.STORAGE_PUBLIC_URL);

// 核心修复：构造存储桶级域名 (Virtual-Hosted Style) 以彻底解决 SSL 握手问题
// 只有在 Cloudflare R2 环境下才启用，本地 MinIO 继续使用 Path-Style
const isR2 = endpoint.includes("r2.cloudflarestorage.com");
let finalEndpoint = endpoint;

if (isR2) {
    const accountIdMatch = endpoint.match(/https?:\/\/([^.]+)/);
    const accountId = accountIdMatch ? accountIdMatch[1] : "";
    finalEndpoint = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`;
}

// Using FetchHttpHandler for Edge compatibility and better SSL handling
const s3Client = new S3Client({
  region: "auto", 
  endpoint: finalEndpoint,
  // R2 必须关闭 forcePathStyle 以匹配存储桶级子域名证书
  forcePathStyle: !isR2, 
  requestHandler: new FetchHttpHandler(),
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function uploadFileToMinio(
  file: Uint8Array, // Using Uint8Array for better compatibility
  filename: string,
  contentType: string
): Promise<string> {
  const key = `${Date.now()}-${filename}`;

  console.log(`[DEBUG] Final Config: Endpoint=${finalEndpoint}, Bucket=${bucketName}, Key=${key}, Style=${isR2 ? 'Virtual-Host' : 'Path'}`);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);
    
    if (publicUrl) {
        return `${publicUrl.replace(/\/$/, '')}/${key}`;
    }
    
    // 返回访问链接：R2 使用桶级域名，其他使用默认拼接
    return isR2 
      ? `${finalEndpoint}/${key}`
      : `${endpoint.replace(/\/$/, '')}/${bucketName}/${key}`;
  } catch (error: any) {
    console.error("Storage upload error details:", error);
    // Log more specific info if available
    if (error.cause) console.error("Error cause:", error.cause);
    throw new Error(`Failed to upload file: ${error.message}`);
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
