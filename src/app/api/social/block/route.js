import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/user";
import { verifyAuth } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    await connectDB();

    const currentUser = await User.findById(user.userId);
    const userToBlock = await User.findById(userId);

    if (!userToBlock) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Check if already blocked
    if (currentUser.blockedUsers.includes(userId)) {
      return NextResponse.json({ success: false, message: "User is already blocked" }, { status: 400 });
    }

    // Add to blocked users
    currentUser.blockedUsers.push(userId);

    // Remove from friends if they are friends
    currentUser.friends = currentUser.friends.filter(id => id.toString() !== userId);
    userToBlock.friends = userToBlock.friends.filter(id => id.toString() !== currentUser._id.toString());

    // Remove any pending friend requests between them
    currentUser.friendRequests = currentUser.friendRequests.filter(
      req => req.from.toString() !== userId
    );
    currentUser.sentFriendRequests = currentUser.sentFriendRequests.filter(
      req => req.to.toString() !== userId
    );
    userToBlock.friendRequests = userToBlock.friendRequests.filter(
      req => req.from.toString() !== currentUser._id.toString()
    );
    userToBlock.sentFriendRequests = userToBlock.sentFriendRequests.filter(
      req => req.to.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await userToBlock.save();

    return NextResponse.json({ 
      success: true, 
      message: "User blocked successfully" 
    });
  } catch (error) {
    console.error("Block user error:", error);
    return NextResponse.json({ success: false, message: "Failed to block user" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    await connectDB();

    const currentUser = await User.findById(user.userId);

    if (!currentUser.blockedUsers.includes(userId)) {
      return NextResponse.json({ success: false, message: "User is not blocked" }, { status: 400 });
    }

    // Remove from blocked users
    currentUser.blockedUsers = currentUser.blockedUsers.filter(id => id.toString() !== userId);
    await currentUser.save();

    return NextResponse.json({ 
      success: true, 
      message: "User unblocked successfully" 
    });
  } catch (error) {
    console.error("Unblock user error:", error);
    return NextResponse.json({ success: false, message: "Failed to unblock user" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const currentUser = await User.findById(user.userId)
      .populate("blockedUsers", "name userId profilePicture");

    return NextResponse.json({ 
      success: true, 
      blockedUsers: currentUser.blockedUsers || []
    });
  } catch (error) {
    console.error("Get blocked users error:", error);
    return NextResponse.json({ success: false, message: "Failed to get blocked users" }, { status: 500 });
  }
}
