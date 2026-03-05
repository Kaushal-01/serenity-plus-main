import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/user";

// GET - Get friend's public playlist
export async function GET(request, context) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const { friendId } = await context.params;

    const currentUser = await User.findById(auth.user.id);
    const friend = await User.findById(friendId);

    if (!friend) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if they are friends
    const areFriends = currentUser.friends.some(f => f.toString() === friendId);
    
    // Check account privacy
    if (friend.accountType === "private" && !areFriends) {
      return NextResponse.json({ error: "This user's playlists are private" }, { status: 403 });
    }

    // Return playlists (without exposing sensitive data)
    return NextResponse.json({ 
      success: true, 
      playlists: friend.playlists,
      userInfo: {
        name: friend.name,
        userId: friend.userId,
        profilePicture: friend.profilePicture
      }
    });
  } catch (error) {
    console.error("Get friend playlists error:", error);
    return NextResponse.json({ error: "Failed to get playlists" }, { status: 500 });
  }
}
