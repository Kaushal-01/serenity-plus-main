import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/user";

// POST - Send friend request
export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const { targetUserId } = await request.json();

    const currentUser = await User.findById(auth.user.id);
    const targetUser = await User.findOne({ userId: targetUserId });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser._id.toString() === currentUser._id.toString()) {
      return NextResponse.json({ error: "Cannot send friend request to yourself" }, { status: 400 });
    }

    // Check if already friends
    const isFriend = currentUser.friends.some(f => f.toString() === targetUser._id.toString());
    if (isFriend) {
      console.log("Already friends check failed:", currentUser._id, targetUser._id);
      return NextResponse.json({ error: "Already friends" }, { status: 400 });
    }

    // Check if request already sent
    const alreadySent = currentUser.sentFriendRequests.some(
      req => req.to.toString() === targetUser._id.toString()
    );
    if (alreadySent) {
      console.log("Request already sent check failed:", currentUser._id, targetUser._id);
      return NextResponse.json({ error: "Friend request already sent" }, { status: 400 });
    }

    // Check if request already received from target user
    const requestExists = currentUser.friendRequests.some(
      req => req.from.toString() === targetUser._id.toString()
    );
    if (requestExists) {
      console.log("Request already received check failed:", currentUser._id, targetUser._id);
      return NextResponse.json({ error: "This user has already sent you a request" }, { status: 400 });
    }

    // Add friend request
    currentUser.sentFriendRequests.push({ to: targetUser._id });
    targetUser.friendRequests.push({ from: currentUser._id });

    await currentUser.save();
    await targetUser.save();

    return NextResponse.json({ 
      success: true, 
      message: "Friend request sent successfully" 
    });
  } catch (error) {
    console.error("Friend request error:", error);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }
}
