const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');
const { promisify } = require('util');

const lookup = promisify(dns.lookup);

// Load environment variables
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

const uri = process.env.MONGODB_URI;

console.log('=== COMPREHENSIVE MongoDB DIAGNOSTICS ===\n');

async function runDiagnostics() {
  // Test 1: Check environment variables
  console.log('TEST 1: Environment Variables');
  console.log('  MONGODB_URI:', uri ? '✅ Found' : '❌ Missing');

  if (!uri) {
    console.log('\n❌ CRITICAL: MONGODB_URI not found in .env file');
    process.exit(1);
  }

  // Parse connection string
  const uriMatch = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/);
  if (uriMatch) {
    console.log('  Username:', uriMatch[1]);
    console.log('  Password:', '***' + uriMatch[2].slice(-3));
    console.log('  Cluster:', uriMatch[3]);
    console.log('  Database:', uriMatch[4]);
  }
  console.log('');

  // Test 2: DNS Resolution
  console.log('TEST 2: DNS Resolution');
  try {
    const hostname = uriMatch ? uriMatch[3] : 'agrilearn.c2m9dou.mongodb.net';
    const result = await lookup(hostname);
    console.log('  ✅ DNS resolves to:', result.address);
    console.log('  IP Family:', result.family === 4 ? 'IPv4' : 'IPv6');
  } catch (error) {
    console.log('  ❌ DNS lookup failed:', error.message);
    console.log('  This could indicate network/firewall issues');
  }
  console.log('');

  // Test 3: MongoDB Connection
  console.log('TEST 3: MongoDB Connection');
  console.log('  Attempting connection (30 second timeout)...');

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });

    console.log('  ✅ SUCCESS! Connected to MongoDB Atlas');
    console.log('  Database:', mongoose.connection.name);
    console.log('  Host:', mongoose.connection.host);
    console.log('\n✅✅✅ ALL TESTS PASSED! ✅✅✅');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.log('  ❌ Connection FAILED');
    console.log('  Error:', error.name);
    console.log('  Message:', error.message);
    console.log('');

    // Diagnose the error
    console.log('=== DIAGNOSIS ===\n');

    if (error.message.includes('ETIMEDOUT') || error.message.includes('ENETUNREACH')) {
      console.log('⚠️  NETWORK TIMEOUT ERROR');
      console.log('  This means your computer cannot reach MongoDB servers.\n');
      console.log('Possible causes:');
      console.log('  1. ❌ MongoDB cluster is PAUSED');
      console.log('     → Go to MongoDB Atlas and check cluster status');
      console.log('     → Click on your cluster - it should say "Active"');
      console.log('     → If paused, click "Resume"');
      console.log('');
      console.log('  2. ❌ Your ISP or network is blocking MongoDB');
      console.log('     → Try using mobile hotspot');
      console.log('     → Try different network/WiFi');
      console.log('     → Contact IT/network admin');
      console.log('');
      console.log('  3. ❌ VPN is interfering');
      console.log('     → Disconnect VPN and try again');
      console.log('');
      console.log('  4. ❌ Windows Firewall blocking port 27017');
      console.log('     → Temporarily disable firewall to test');
      console.log('');
      console.log('  5. ❌ Corporate/School network restrictions');
      console.log('     → MongoDB uses port 27017');
      console.log('     → Network admin may be blocking it');

    } else if (error.message.includes('Authentication failed') || error.message.includes('auth')) {
      console.log('⚠️  AUTHENTICATION ERROR');
      console.log('  Your credentials are incorrect.\n');
      console.log('Steps to fix:');
      console.log('  1. Go to MongoDB Atlas → Database Access');
      console.log('  2. Verify username "Agrilearn" exists');
      console.log('  3. Reset password or create new user');
      console.log('  4. Update .env file with correct password');

    } else {
      console.log('⚠️  UNKNOWN ERROR');
      console.log('  Full error:', error);
    }

    console.log('\n=== NEXT STEPS ===\n');
    console.log('1. Go to MongoDB Atlas: https://cloud.mongodb.com/');
    console.log('2. Check cluster status - is it "Active" or "Paused"?');
    console.log('3. If paused, click "Resume"');
    console.log('4. Try connecting from mobile hotspot');
    console.log('5. If nothing works, the network may be blocking MongoDB');

    process.exit(1);
  }
}

runDiagnostics();
