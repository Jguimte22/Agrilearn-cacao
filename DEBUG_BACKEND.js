// Debug script to test Render backend connection
// Run this in browser console to see what's happening

const API_URL = 'https://agrilearn-cacao-cl25.onrender.com/api';

console.log('🔍 Testing backend connection...');
console.log('Backend URL:', API_URL);

// Test 1: Check if backend is responding
fetch(`${API_URL}/users/me`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('✅ Backend responded!');
  console.log('Status:', response.status);
  console.log('Headers:', response.headers);
  return response.text();
})
.then(data => {
  console.log('Response data:', data);
})
.catch(error => {
  console.error('❌ Connection failed!');
  console.error('Error:', error);
  console.error('Message:', error.message);
  
  // Additional diagnostics
  if (error.message.includes('Failed to fetch')) {
    console.log('💡 Possible causes:');
    console.log('1. Backend service is not running');
    console.log('2. Backend service is sleeping (Render free tier)');
    console.log('3. CORS error (check browser Network tab)');
    console.log('4. Backend URL is incorrect');
    console.log('5. Network connectivity issue');
  }
});
