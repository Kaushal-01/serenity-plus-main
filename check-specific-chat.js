const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function checkSpecificChat() {
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

    const chatId = '699b4cfd68d4a5907b484fad';
    
    const chat = await Chat.findById(chatId).select('messages participants');
    
    if (!chat) {
      console.log('Chat not found');
    } else {
      console.log(`\nChat ${chatId}:`);
      console.log(`  Participants: ${chat.participants.length}`);
      console.log(`  Messages: ${chat.messages?.length || 0}`);
      console.log(`  Document size: ~${JSON.stringify(chat).length} bytes`);
    }
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSpecificChat();
