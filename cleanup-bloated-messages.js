const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function cleanupBloatedMessages() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('MONGODB_URI not found');
      process.exit(1);
    }
    
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas\n');

    // Use raw collection access instead of schema
    const db = mongoose.connection.db;
    const chatsCollection = db.collection('chats');

    console.log('Finding chats with bloated messages...');
    
    const chats = await chatsCollection.find({
      'messages.sharedContent.data': { $exists: true }
    }).toArray();

    console.log(`Found ${chats.length} chats with shared content\n`);
    
    let totalCleaned = 0;
    let totalSizeSaved = 0;
    
    for (const chat of chats) {
      let chatModified = false;
      const beforeSize = JSON.stringify(chat).length;
      
      console.log(`\nProcessing chat ${chat._id}...`);
      console.log(`  Total messages: ${chat.messages?.length || 0}`);
      
      for (let i = 0; i < chat.messages.length; i++) {
        const msg = chat.messages[i];
        console.log(`  Message ${i + 1}: type=${msg.messageType}, hasShared=${!!msg.sharedContent}, hasData=${!!msg.sharedContent?.data}`);
        
        if (msg.sharedContent?.data) {
          const dataBefore = JSON.stringify(msg.sharedContent.data).length;
          console.log(`  Message ${i + 1}: data size = ${(dataBefore / 1024).toFixed(1)}KB`);
          
          // Clean up downloadUrl - remove base64 audio data
          let cleanDownloadUrl = msg.sharedContent.data.downloadUrl;
          if (Array.isArray(cleanDownloadUrl)) {
            const beforeLen = cleanDownloadUrl.length;
            cleanDownloadUrl = cleanDownloadUrl
              .map(item => {
                if (item?.url && item.url.startsWith('data:audio')) {
                  console.log(`    Removing base64 audio from downloadUrl`);
                  return null; // Remove base64 audio
                }
                return item;
              })
              .filter(Boolean);
            
            console.log(`    downloadUrl items: ${beforeLen} -> ${cleanDownloadUrl.length}`);
            
            // If array is now empty, set to empty array
            if (cleanDownloadUrl.length === 0) cleanDownloadUrl = [];
          }
          
          // Keep only essential fields, strip bloat
          const sanitizedData = {
            artist: msg.sharedContent.data.artist,
            url: msg.sharedContent.data.url,
            artists: msg.sharedContent.data.artists,
            downloadUrl: cleanDownloadUrl,
            primaryArtists: msg.sharedContent.data.primaryArtists
          };
          
          const dataAfter = JSON.stringify(sanitizedData).length;
          
          if (dataBefore > dataAfter) {
            chat.messages[i].sharedContent.data = sanitizedData;
            chatModified = true;
            totalCleaned++;
            console.log(`Chat ${chat._id}, Message ${i + 1}:`);
            console.log(`  Reduced data from ${(dataBefore / 1024).toFixed(1)}KB to ${(dataAfter / 1024).toFixed(1)}KB`);
          }
        }
      }
      
      if (chatModified) {
        await chatsCollection.updateOne(
          { _id: chat._id },
          { $set: { messages: chat.messages } }
        );
        const afterSize = JSON.stringify(chat).length;
        const saved = beforeSize - afterSize;
        totalSizeSaved += saved;
        console.log(`  Total chat size reduced by ${(saved / 1024).toFixed(1)}KB\n`);
      }
    }
    
    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Messages cleaned: ${totalCleaned}`);
    console.log(`   Total size saved: ${(totalSizeSaved / 1024).toFixed(1)}KB`);
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cleanupBloatedMessages();
