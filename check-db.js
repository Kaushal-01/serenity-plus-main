const mongoose = require('mongoose');

// Get MONGO_URI from environment or use default
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('❌ No MONGO_URI found in environment variables');
  console.log('Please set MONGO_URI environment variable or check your .env file');
  process.exit(1);
}

const songPlaySchema = new mongoose.Schema({}, { strict: false });
const SongPlay = mongoose.model('SongPlay', songPlaySchema);

async function checkDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected successfully\n');

    // Count total song plays
    const count = await SongPlay.countDocuments();
    console.log(`📊 Total song plays in database: ${count}`);

    if (count > 0) {
      // Get recent plays
      const recent = await SongPlay.find()
        .sort({ playedAt: -1 })
        .limit(5)
        .lean();
      
      console.log('\n🎵 Recent plays:');
      recent.forEach((play, i) => {
        console.log(`\n${i + 1}. ${play.songName}`);
        console.log(`   Song ID: ${play.songId}`);
        console.log(`   User ID: ${play.userId}`);
        console.log(`   Played at: ${play.playedAt}`);
        console.log(`   Has downloadUrl: ${!!(play.downloadUrl && play.downloadUrl.length > 0)}`);
        console.log(`   Has image: ${!!(play.image && play.image.length > 0)}`);
      });

      // Check count by userId
      const userCounts = await SongPlay.aggregate([
        { $group: { _id: '$userId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      console.log('\n👥 Plays by user:');
      userCounts.forEach(uc => {
        console.log(`   User ${uc._id}: ${uc.count} plays`);
      });
    } else {
      console.log('\n⚠️  No song plays found in database');
      console.log('This means songs are not being tracked when played.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkDatabase();
