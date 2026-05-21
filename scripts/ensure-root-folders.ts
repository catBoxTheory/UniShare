/**
 * This script ensures all existing courses have root folders
 * Run with: npx tsx scripts/ensure-root-folders.ts
 */

// @ts-ignore
const { PrismaClient } = require('@prisma/client');
// @ts-ignore
const { Pool } = require('pg');
// @ts-ignore
const { PrismaPg } = require('@prisma/adapter-pg');

// Initialize Prisma Client
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/unistream?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function ensureRootFolders() {
  try {
    console.log('Fetching all courses...');
    const courses = await prisma.course.findMany();

    console.log(`Found ${courses.length} course(s)`);

    for (const course of courses) {
      // Check if this course has a root folder (folder with parentId = null)
      const rootFolders = await prisma.folder.findMany({
        where: {
          courseId: course.id,
          parentId: null
        }
      });
      
      if (rootFolders.length === 0) {
        console.log(`Course ${course.code} (${course.title}) is missing root folder, creating...`);
        
        await prisma.folder.create({
          data: {
            name: 'Root',
            courseId: course.id,
            parentId: null
          }
        });
        
        console.log(`✓ Created root folder for course ${course.code}`);
      } else {
        console.log(`✓ Course ${course.code} already has root folder`);
      }
    }

    console.log('\nAll courses checked!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

ensureRootFolders();

