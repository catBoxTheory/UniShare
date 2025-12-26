/**
 * Local R2 Upload Test Script
 * Run: npx ts-node scripts/test-r2-upload.ts
 */

import { S3Client, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config();

const endpoint = process.env.STORAGE_ENDPOINT?.trim() || "";
const accessKeyId = process.env.STORAGE_ACCESS_KEY?.trim() || "";
const secretAccessKey = process.env.STORAGE_SECRET_KEY?.trim() || "";
const bucketName = process.env.STORAGE_BUCKET_NAME?.trim() || "unishare";

console.log("=== R2 Connection Test ===");
console.log(`Endpoint: ${endpoint}`);
console.log(`Bucket: ${bucketName}`);
console.log(`Access Key: ${accessKeyId.substring(0, 8)}...`);

const s3Client = new S3Client({
  region: "auto",
  endpoint: endpoint,
  forcePathStyle: true, // REQUIRED for R2
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function testConnection() {
  console.log("\n1. Testing bucket access (ListObjects)...");
  try {
    const listResult = await s3Client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 5,
    }));
    console.log(`   ✅ Success! Found ${listResult.KeyCount || 0} objects.`);
    if (listResult.Contents) {
      listResult.Contents.forEach(obj => console.log(`      - ${obj.Key}`));
    }
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    if (error.cause) console.log(`   Cause: ${error.cause}`);
    return false;
  }

  console.log("\n2. Testing file upload (PutObject)...");
  const testKey = `test-${Date.now()}.txt`;
  const testContent = "Hello from UniShare R2 test!";
  
  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: "text/plain",
    }));
    console.log(`   ✅ Success! Uploaded: ${testKey}`);
    console.log(`   File URL: ${endpoint}/${bucketName}/${testKey}`);
    return true;
  } catch (error: any) {
    console.log(`   ❌ Failed: ${error.message}`);
    if (error.cause) console.log(`   Cause: ${error.cause}`);
    return false;
  }
}

testConnection()
  .then(success => {
    console.log("\n=== Test Complete ===");
    if (success) {
      console.log("✅ R2 is working correctly from your local machine!");
      console.log("   If Vercel still fails, the issue is Vercel-specific.");
    } else {
      console.log("❌ R2 connection failed locally.");
      console.log("   Please check your R2 API Token and bucket configuration.");
    }
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });

