import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/user";

// GET - Search users by userId or name
export async function GET(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    await connectDB();
    
    const currentUser = await User.findById(auth.user.id);
    
    // Search by userId or name, ensuring unique results
    const users = await User.find({
      $and: [
        { _id: { $ne: currentUser._id } }, // Exclude current user
        {
          $or: [
            { userId: { $regex: query, $options: "i" } },
            { name: { $regex: query, $options: "i" } }
          ]
        }
      ]
    })
    .select("name userId email profilePicture accountType bio favoriteArtists favoriteGenres")
    .limit(20)
    .lean(); // Use lean() for better performance and to ensure plain objects

    // Remove duplicates based on _id (MongoDB unique identifier)
    const seenIds = new Set();
    const uniqueUsers = users.filter(user => {
      const userId = user._id.toString();
      if (seenIds.has(userId)) {
        return false;
      }
      seenIds.add(userId);
      return true;
    });

    // Add friendship status
    const usersWithStatus = uniqueUsers.map(user => {
      const isFriend = currentUser.friends.some(f => f.toString() === user._id.toString());
      const requestSent = currentUser.sentFriendRequests.some(r => r.to.toString() === user._id.toString());
      const requestReceived = currentUser.friendRequests.some(r => r.from.toString() === user._id.toString());

      return {
        ...user,
        isFriend,
        requestSent,
        requestReceived
      };
    });

    return NextResponse.json({ success: true, users: usersWithStatus });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json({ error: "Failed to search users" }, { status: 500 });
  }
}
