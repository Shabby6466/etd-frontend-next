#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up environment configuration...\n');

// Check if .env.local already exists
const envLocalPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (fs.existsSync(envLocalPath)) {
  console.log('⚠️  .env.local already exists. Skipping creation.');
  console.log('   If you want to update it, please delete .env.local and run this script again.\n');
} else {
  if (fs.existsSync(envExamplePath)) {
    // Copy env.example to .env.local
    const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
    fs.writeFileSync(envLocalPath, envExampleContent);
    console.log('✅ Created .env.local from env.example');
  } else {
    console.log('❌ env.example not found. Please create it first.');
    process.exit(1);
  }
}

console.log('\n📝 Next steps:');
console.log('1. Edit .env.local with your actual configuration values');
console.log('2. Update the following important variables:');
console.log('   - NEXT_PUBLIC_API_URL: Your backend API URL');
console.log('   - BACKEND_URL: Your backend server URL');
console.log('   - JWT_SECRET: A secure random string');
console.log('   - DATABASE_URL: Your database connection string');
console.log('   - NADRA_API_URL: NADRA API endpoint');
console.log('   - PASSPORT_API_URL: Passport API endpoint');
console.log('\n🔒 Security reminder:');
console.log('   - Never commit .env.local to version control');
console.log('   - Use strong, unique values for production');
console.log('   - Keep your JWT_SECRET secure and random');
console.log('\n✨ Environment setup complete!');
