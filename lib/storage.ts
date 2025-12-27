import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";

// Storage Configuration - Clean environment variables
const cleanEnvVar = (val: string | undefined) => {
    if (!val) return "";
    let res = val.trim();
    if (res.startsWith('"') && res.endsWith('"')) res = res.slice(1, -1);
    if (res.startsWith("'") && res.endsWith("'")) res = res.slice(1, -1);
    return res.trim();
};

const endpoint = cleanEnvVar(process.env.STORAGE_ENDPOINT || process.env.MINIO_ENDPOINT || "http://localhost:9000").replace(/\/$/, "");
const accessKeyId = cleanEnvVar(process.env.STORAGE_ACCESS_KEY || process.env.MINIO_ACCESS_KEY || "minioadmin");
const secretAccessKey = cleanEnvVar(process.env.STORAGE_SECRET_KEY || process.env.MINIO_SECRET_KEY || "minioadmin");
export const storageBucketName = cleanEnvVar(process.env.STORAGE_BUCKET_NAME || process.env.MINIO_BUCKET_NAME || "unishare-bucket");
const publicUrl = cleanEnvVar(process.env.STORAGE_PUBLIC_URL);

// R2 REQUIRES path-style addressing. Virtual-hosted style is NOT supported.
export const s3Client = new S3Client({
  region: "auto", 
  endpoint: endpoint,
  forcePathStyle: true, // MANDATORY for Cloudflare R2
  requestHandler: new FetchHttpHandler(),
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

// Re-export GetObjectCommand for use in proxy
export { GetObjectCommand };

export const getPresignedUploadUrl = async (fileName: string, contentType: string, fileSize?: number) => {
  // Sanitize filename for the storage key
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${Date.now()}-${safeFileName}`;
  
  const command = new PutObjectCommand({
    Bucket: storageBucketName,
    Key: key,
    ContentType: contentType,
  });

  // Generate presigned URL - don't sign content-length to allow any file size
  const url = await getSignedUrl(s3Client, command, { 
    expiresIn: 3600,
  });
  
  let finalPublicUrl = "";
  if (publicUrl) {
    finalPublicUrl = `${publicUrl.replace(/\/$/, '')}/${key}`;
  } else {
    finalPublicUrl = `${endpoint.replace(/\/$/, '')}/${storageBucketName}/${key}`;
  }

  return { uploadUrl: url, key, publicUrl: finalPublicUrl };
};

export async function uploadFileToMinio(
  file: Uint8Array,
  filename: string,
  contentType: string
): Promise<string> {
  const key = `${Date.now()}-${filename}`;

  console.log(`[R2 Upload] Endpoint=${endpoint}, Bucket=${storageBucketName}, Key=${key}`);

  const command = new PutObjectCommand({
    Bucket: storageBucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  });

  try {
    await s3Client.send(command);
    
    if (publicUrl) {
        return `${publicUrl.replace(/\/$/, '')}/${key}`;
    }
    
    return `${endpoint.replace(/\/$/, '')}/${storageBucketName}/${key}`;
  } catch (error: any) {
    console.error("[R2 Upload Error]:", error.message);
    if (error.cause) console.error("[R2 Upload Error Cause]:", error.cause);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

export async function deleteFileFromMinio(fileIdentifier: string): Promise<void> {
  try {
    let key = fileIdentifier;

    if (fileIdentifier.startsWith("http")) {
        try {
            const url = new URL(fileIdentifier);
            // Decode URI component to handle spaces and special characters in the key
            const decodedPath = decodeURIComponent(url.pathname);
            const pathParts = decodedPath.split('/').filter(Boolean);
            
            if (publicUrl && fileIdentifier.includes(publicUrl)) {
                // For public URLs, the key is the entire path
                key = pathParts.join('/');
            } else if (pathParts.length >= 1) {
                // For S3 style URLs (endpoint/bucket/key), if the first part is the bucket name, skip it
                if (pathParts[0] === storageBucketName) {
                    key = pathParts.slice(1).join('/');
                } else {
                    // Otherwise, take the last part or join parts after potential bucket
                    key = pathParts.join('/');
                }
            }
        } catch (e) {
            console.warn("[Storage] URL parsing failed for deletion, using raw identifier:", fileIdentifier);
            key = fileIdentifier;
        }
    }

    if (!key) {
        console.warn("[Storage] No key identified for deletion");
        return;
    }

    console.log(`[Storage] Attempting to delete key: "${key}" from bucket: "${storageBucketName}"`);

    await s3Client.send(new DeleteObjectCommand({
      Bucket: storageBucketName,
      Key: key,
    }));
    console.log(`[Storage] Successfully deleted "${key}" from R2`);
  } catch (error: any) {
    console.error("[Storage] Deletion error:", error.message);
  }
}

