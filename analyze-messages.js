const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function analyzeMessages() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas\n');

    const Chat = mongoose.model('Chat', new mongoose.Schema({ 
      messages: Array 
    }));

    const chatId = '699b4cfd68d4a5907b484fad';
    const chat = await Chat.findById(chatId).select('messages');
    
    if (!chat || !chat.messages) {
      console.log('No messages found');
      process.exit(0);
    }

    console.log(`Total messages: ${chat.messages.length}\n`);
    
    chat.messages.forEach((msg, i) => {
      const msgSize = JSON.stringify(msg).length;
      console.log(`Message ${i + 1}:`);
      console.log(`  Size: ${msgSize} bytes (${(msgSize / 1024).toFixed(1)}KB)`);
      console.log(`  Type: ${msg.messageType || 'text'}`);
      console.log(`  Content length: ${msg.content?.length || 0}`);
      if (msg.sharedContent) {
        const dataSize = JSON.stringify(msg.sharedContent.data || {}).length;
        console.log(`  Shared content: ${msg.sharedContent.type}`);
        console.log(`  Shared data size: ${dataSize} bytes (${(dataSize / 1024).toFixed(1)}KB)`);
      }
      console.log('');
    });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

analyzeMessages();
