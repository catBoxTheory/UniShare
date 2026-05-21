# Set environment variables
$env:DATABASE_URL = "postgresql://postgres:password@localhost:5432/unistream"
$env:AUTH_SECRET = "your-super-secret-key-change-this-in-production-123456"
$env:NEXTAUTH_URL = "http://localhost:3000"

# Start the dev server
npm run dev
