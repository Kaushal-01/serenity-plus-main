const jwt = require('jsonwebtoken');

const JWT_SECRET = 'bb3fb0b6516cfae7e33884e5c7203bb44b9610f246ed1f398a5576c2b75ce89e040b835b9df17e7f9b5b95ac39228d1ca57b3592a291212c0aefc623f8cccf8a';

// Get token from command line argument
const token = process.argv[2];

if (!token) {
  console.log('Usage: node check-token.js <YOUR_TOKEN>');
  console.log('\nTo get your token:');
  console.log('1. Open browser console (F12)');
  console.log('2. Run: localStorage.getItem("token")');
  console.log('3. Copy the token and run: node check-token.js YOUR_TOKEN');
  process.exit(1);
}

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token is valid\n');
  console.log('📋 Decoded token data:');
  console.log(JSON.stringify(decoded, null, 2));
  console.log('\n🔑 User ID:', decoded.id);
  console.log('🔢 User ID Type:', typeof decoded.id);
} catch (error) {
  console.error('❌ Error decoding token:', error.message);
}
