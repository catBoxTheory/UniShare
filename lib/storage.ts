import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
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
const bucketName = cleanEnvVar(process.env.STORAGE_BUCKET_NAME || process.env.MINIO_BUCKET_NAME || "unishare-bucket");
const publicUrl = cleanEnvVar(process.env.STORAGE_PUBLIC_URL);

// R2 REQUIRES path-style addressing. Virtual-hosted style is NOT supported.
const s3Client = new S3Client({
  region: "auto", 
  endpoint: endpoint,
  forcePathStyle: true, // MANDATORY for Cloudflare R2
  requestHandler: new FetchHttpHandler(),
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export const getPresignedUploadUrl = async (fileName: string, contentType: string) => {
  const key = `${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  
  let finalPublicUrl = "";
  if (publicUrl) {
    finalPublicUrl = `${publicUrl.replace(/\/$/, '')}/${key}`;
  } else {
    finalPublicUrl = `${endpoint.replace(/\/$/, '')}/${bucketName}/${key}`;
  }

  return { uploadUrl: url, key, publicUrl: finalPublicUrl };
};

export async function uploadFileToMinio(
  file: Uint8Array,
  filename: string,
  contentType: string
): Promise<string> {
  const key = `${Date.now()}-${filename}`;

  console.log(`[R2 Upload] Endpoint=${endpoint}, Bucket=${bucketName}, Key=${key}`);

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
    
    return `${endpoint.replace(/\/$/, '')}/${bucketName}/${key}`;
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

