const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const uri = process.env.MONGODB_URI;

console.log('=== MongoDB Connection Diagnostic ===\n');
console.log('1. Checking environment variables...');
console.log('   MONGODB_URI:', uri ? '✅ Found' : '❌ Not found');
console.log('   Connection string:', uri ? uri.replace(/:[^:]*@/, ':***@') : 'N/A');
console.log('');

console.log('2. Checking your current IP...');
const https = require('https');
https.get('https://api.ipify.org?format=json', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const ipData = JSON.parse(data);
    console.log('   Your public IP:', ipData.ip);
    console.log('   ⚠️  Make sure this IP is whitelisted in MongoDB Atlas!');
    console.log('');

    // Now try to connect
    testConnection();
  });
}).on('error', (err) => {
  console.log('   ❌ Could not fetch IP:', err.message);
  console.log('');
  testConnection();
});

async function testConnection() {
  console.log('3. Testing MongoDB connection...');
  console.log('   Attempting to connect (timeout: 10 seconds)...');

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000,
    });

    console.log('   ✅ SUCCESS! Connected to MongoDB Atlas');
    console.log('   Database:', mongoose.connection.name);
    console.log('   Host:', mongoose.connection.host);
    console.log('');
    console.log('✅ All checks passed! Your MongoDB connection is working.');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.log('   ❌ FAILED! Could not connect to MongoDB');
    console.log('');
    console.log('Error details:');
    console.log('   Error type:', error.name);
    console.log('   Error message:', error.message);
    console.log('');

    console.log('Common solutions:');
    console.log('   1. Whitelist your IP in MongoDB Atlas Network Access');
    console.log('   2. Try adding 0.0.0.0/0 (allow all IPs) temporarily for testing');
    console.log('   3. Wait 2-5 minutes after adding IP (propagation delay)');
    console.log('   4. Check if your cluster is paused in MongoDB Atlas');
    console.log('   5. Verify your MongoDB credentials are correct');
    console.log('   6. Check if you have a VPN/firewall blocking the connection');
    console.log('');

    process.exit(1);
  }
}
