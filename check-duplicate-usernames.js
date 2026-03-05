import mongoose from "mongoose";
import User from "./src/models/user.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://abhishekvashishtha401_db_user:7p0sHbFmv2P2bZQY@cluster0.zaldpsp.mongodb.net/?appName=Cluster0";

async function checkDuplicateUsernames() {
  try {
    console.log("🔍 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find all users with userId
    const users = await User.find({ userId: { $exists: true, $ne: null } })
      .select('name userId email createdAt')
      .lean();

    console.log(`📊 Total users with username: ${users.length}\n`);

    // Group by lowercase userId to find duplicates
    const userIdMap = new Map();
    
    users.forEach(user => {
      const lowerUserId = user.userId.toLowerCase();
      if (!userIdMap.has(lowerUserId)) {
        userIdMap.set(lowerUserId, []);
      }
      userIdMap.get(lowerUserId).push(user);
    });

    // Find duplicates
    const duplicates = [];
    userIdMap.forEach((userList, userId) => {
      if (userList.length > 1) {
        duplicates.push({ userId, users: userList });
      }
    });

    if (duplicates.length === 0) {
      console.log("✅ No duplicate usernames found!");
    } else {
      console.log(`⚠️  Found ${duplicates.length} duplicate username(s):\n`);
      
      duplicates.forEach(({ userId, users }) => {
        console.log(`\n📌 Username: "${userId}" (${users.length} accounts)`);
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. Name: ${user.name}`);
          console.log(`      Email: ${user.email}`);
          console.log(`      Actual userId: "${user.userId}"`);
          console.log(`      Created: ${user.createdAt}`);
          console.log(`      ID: ${user._id}`);
        });
      });

      console.log("\n⚠️  Action Required:");
      console.log("These duplicate usernames should be resolved by:");
      console.log("1. Manually changing one of the usernames in the database");
      console.log("2. Or deleting test/duplicate accounts\n");
    }

    // Check for case-sensitive variations
    const exactDuplicates = new Map();
    users.forEach(user => {
      if (!exactDuplicates.has(user.userId)) {
        exactDuplicates.set(user.userId, []);
      }
      exactDuplicates.get(user.userId).push(user);
    });

    const exactDups = [];
    exactDuplicates.forEach((userList, userId) => {
      if (userList.length > 1) {
        exactDups.push({ userId, users: userList });
      }
    });

    if (exactDups.length > 0) {
      console.log(`\n🔴 Found ${exactDups.length} exact duplicate userId(s) (same case):`);
      exactDups.forEach(({ userId, users }) => {
        console.log(`\n   Username: "${userId}" appears ${users.length} times`);
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.name} (${user.email})`);
        });
      });
    }

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\n🔌 Database connection closed");
  }
}

checkDuplicateUsernames();
