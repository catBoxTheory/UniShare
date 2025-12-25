const { PrismaClient } = require('./node_modules/.prisma/client');

console.log('Testing PrismaClient with log option...');
try {
  const prisma = new PrismaClient({
    log: ['query']
  });
  console.log('Success with log option');
  // Try to connect
  prisma.$connect().then(() => {
    console.log('Connected!');
    return prisma.$disconnect();
  }).catch(e => {
    console.log('Connection failed:', e.message);
  });
} catch (e) {
  console.log('Error with log option:', e.message);
}
