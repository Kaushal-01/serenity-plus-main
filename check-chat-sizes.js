const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function checkChatSizes() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI not found in .env file');
      process.exit(1);
    }
    
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas');

    const Chat = mongoose.model('Chat', new mongoose.Schema({ 
      participants: [mongoose.Schema.Types.ObjectId],
      messages: Array 
    }));

    const chats = await Chat.find().select('messages participants');
    console.log(`\nTotal chats: ${chats.length}`);
    
    let totalMessages = 0;
    let maxMessages = 0;
    let chatWithMostMessages = null;
    
    chats.forEach((chat, i) => {
      const msgCount = chat.messages?.length || 0;
      totalMessages += msgCount;
      if (msgCount > maxMessages) {
        maxMessages = msgCount;
        chatWithMostMessages = i + 1;
      }
      if (msgCount > 100) {
        console.log(`Chat ${i + 1}: ${msgCount} messages`);
      }
    });
    
    console.log(`\nTotal messages across all chats: ${totalMessages}`);
    console.log(`Average messages per chat: ${Math.round(totalMessages / chats.length)}`);
    console.log(`Largest chat (#${chatWithMostMessages}): ${maxMessages} messages`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkChatSizes();
