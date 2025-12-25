/**
 * Force update MinIO bucket policy to public read
 * Run with: npx tsx scripts/update-bucket-policy.ts
 */

import { S3Client, PutBucketPolicyCommand, HeadBucketCommand, CreateBucketCommand, PutBucketCorsCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.MINIO_ENDPOINT || "http://localhost:9000",
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.MINIO_SECRET_KEY || "minioadmin",
  },
});

const bucketName = process.env.MINIO_BUCKET_NAME || "unistream-bucket";

async function updateBucketPolicy() {
  try {
    console.log(`Checking bucket: ${bucketName}...`);
    
    // Check if bucket exists
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        console.log(`Bucket not found. Creating ${bucketName}...`);
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
      } else {
        throw error;
      }
    }

    console.log("Setting public read policy...");
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

    console.log("Setting CORS policy...");
    const corsParams = {
      Bucket: bucketName,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "HEAD"],
            AllowedOrigins: ["*"],
          }
        ]
      }
    };
    await s3Client.send(new PutBucketCorsCommand(corsParams));

    console.log("✓ Success! Bucket is now public and CORS enabled.");
  } catch (error) {
    console.error("Error updating policy:", error);
  }
}

updateBucketPolicy();

