import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/unistream"

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Starting user reset...")
  try {
    // Delete all users - cascading deletes will handle related records
    const deletedUsers = await prisma.user.deleteMany()
    console.log(`Successfully deleted ${deletedUsers.count} users and their related data.`)
  } catch (error) {
    console.error("Error deleting users:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
