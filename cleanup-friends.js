const mongoose = require('mongoose');
const User = require('./src/models/user.js').default;

async function cleanupFriendData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    const users = await User.find({});
    console.log(`Found ${users.length} users\n`);

    let fixCount = 0;
    let issuesFound = 0;

    // Check and fix bidirectional friend relationships
    console.log('=== Checking Friend Relationships ===\n');
    for (const user of users) {
      for (const friendId of user.friends) {
        const friend = await User.findById(friendId);
        
        if (!friend) {
          console.log(`❌ ${user.name} has non-existent friend ID: ${friendId}`);
          user.friends = user.friends.filter(id => id.toString() !== friendId.toString());
          await user.save();
          fixCount++;
          issuesFound++;
          continue;
        }

        // Check if friendship is bidirectional
        const isBidirectional = friend.friends.some(id => id.toString() === user._id.toString());
        if (!isBidirectional) {
          console.log(`⚠️  One-sided friendship: ${user.name} -> ${friend.name}`);
          console.log(`   Fixing: Adding ${user.name} to ${friend.name}'s friends list`);
          friend.friends.push(user._id);
          await friend.save();
          fixCount++;
          issuesFound++;
        }
      }
    }

    // Check and clean up orphaned friend requests
    console.log('\n=== Checking Friend Requests ===\n');
    for (const user of users) {
      // Check sent requests
      for (const request of [...user.sentFriendRequests]) {
        const targetUser = await User.findById(request.to);
        
        if (!targetUser) {
          console.log(`❌ ${user.name} has sent request to non-existent user: ${request.to}`);
          user.sentFriendRequests = user.sentFriendRequests.filter(
            req => req.to.toString() !== request.to.toString()
          );
          await user.save();
          fixCount++;
          issuesFound++;
          continue;
        }

        // Check if the corresponding received request exists
        const hasReceivedRequest = targetUser.friendRequests.some(
          req => req.from.toString() === user._id.toString()
        );
        
        if (!hasReceivedRequest) {
          console.log(`⚠️  Orphaned sent request: ${user.name} -> ${targetUser.name}`);
          console.log(`   Removing orphaned sent request`);
          user.sentFriendRequests = user.sentFriendRequests.filter(
            req => req.to.toString() !== request.to.toString()
          );
          await user.save();
          fixCount++;
          issuesFound++;
        }

        // Check if they're already friends (request should be removed)
        const alreadyFriends = user.friends.some(id => id.toString() === targetUser._id.toString());
        if (alreadyFriends) {
          console.log(`⚠️  Friend request exists but already friends: ${user.name} <-> ${targetUser.name}`);
          console.log(`   Removing redundant friend request`);
          user.sentFriendRequests = user.sentFriendRequests.filter(
            req => req.to.toString() !== request.to.toString()
          );
          targetUser.friendRequests = targetUser.friendRequests.filter(
            req => req.from.toString() !== user._id.toString()
          );
          await user.save();
          await targetUser.save();
          fixCount++;
          issuesFound++;
        }
      }

      // Check received requests
      for (const request of [...user.friendRequests]) {
        const fromUser = await User.findById(request.from);
        
        if (!fromUser) {
          console.log(`❌ ${user.name} has received request from non-existent user: ${request.from}`);
          user.friendRequests = user.friendRequests.filter(
            req => req.from.toString() !== request.from.toString()
          );
          await user.save();
          fixCount++;
          issuesFound++;
          continue;
        }

        // Check if they're already friends (request should be removed)
        const alreadyFriends = user.friends.some(id => id.toString() === fromUser._id.toString());
        if (alreadyFriends) {
          console.log(`⚠️  Friend request exists but already friends: ${user.name} <-> ${fromUser.name}`);
          console.log(`   Removing redundant friend request`);
          user.friendRequests = user.friendRequests.filter(
            req => req.from.toString() !== request.from.toString()
          );
          fromUser.sentFriendRequests = fromUser.sentFriendRequests.filter(
            req => req.to.toString() !== user._id.toString()
          );
          await user.save();
          await fromUser.save();
          fixCount++;
          issuesFound++;
        }
      }
    }

    // Remove duplicate friends
    console.log('\n=== Checking for Duplicate Friends ===\n');
    for (const user of users) {
      const uniqueFriends = [...new Set(user.friends.map(id => id.toString()))];
      if (uniqueFriends.length !== user.friends.length) {
        console.log(`⚠️  ${user.name} has ${user.friends.length - uniqueFriends.length} duplicate friend entries`);
        user.friends = uniqueFriends.map(id => mongoose.Types.ObjectId(id));
        await user.save();
        fixCount++;
        issuesFound++;
      }
    }

    console.log('\n=== Cleanup Summary ===');
    console.log(`Issues found: ${issuesFound}`);
    console.log(`Fixes applied: ${fixCount}`);
    
    if (issuesFound === 0) {
      console.log('✅ No issues found! Friend data is clean.');
    } else {
      console.log('✅ Cleanup completed successfully!');
    }

    mongoose.disconnect();
  } catch (error) {
    console.error('Error during cleanup:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

cleanupFriendData();
