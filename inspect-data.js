const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function inspectBloatedData() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log('Connected\n');

    const Chat = mongoose.model('Chat', new mongoose.Schema({ messages: Array }));

    const chatId = '699b4cfd68d4a5907b484fad';
    const chat = await Chat.findById(chatId).select('messages');
    
    const msg5 = chat.messages[4]; // Message 5 (index 4)
    
    console.log('Message 5 sharedContent structure:');
    console.log('Type:', msg5.sharedContent?.type);
    console.log('ID:', msg5.sharedContent?.id);
    console.log('Name:', msg5.sharedContent?.name);
    console.log('\nData keys:', Object.keys(msg5.sharedContent?.data || {}));
    console.log('\nFirst 500 chars of data:');
    console.log(JSON.stringify(msg5.sharedContent?.data, null, 2).substring(0, 500));
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

inspectBloatedData();
