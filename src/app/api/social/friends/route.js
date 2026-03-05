import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/user";

// GET - Get list of friends
export async function GET(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    
    // Optimized query: only select and populate what we need
    const user = await User.findById(auth.user.id)
      .select("friends friendRequests sentFriendRequests")
      .populate("friends", "name userId profilePicture accountType bio")
      .populate("friendRequests.from", "name userId profilePicture accountType")
      .populate("sentFriendRequests.to", "name userId profilePicture accountType")
      .lean(); // Much faster than Mongoose documents

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Filter out null/undefined references - happens if referenced user was deleted
    const validFriends = (user.friends || []).filter(friend => friend && friend._id);
    const validFriendRequests = (user.friendRequests || []).filter(req => req && req.from && req.from._id);
    const validSentRequests = (user.sentFriendRequests || []).filter(req => req && req.to && req.to._id);

    // Note: Cleanup of invalid references will be handled by a background job instead
    // to avoid slowing down this critical endpoint
    
    return NextResponse.json({ 
      success: true,
      friends: validFriends,
      friendRequests: validFriendRequests,
      sentRequests: validSentRequests
    });
  } catch (error) {
    console.error("Get friends error:", error);
    return NextResponse.json({ error: "Failed to get friends" }, { status: 500 });
  }
}

// DELETE - Remove friend
export async function DELETE(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const { friendId } = await request.json();

    if (!friendId) {
      return NextResponse.json({ error: "Friend ID is required" }, { status: 400 });
    }

    const currentUser = await User.findById(auth.user.id);
    if (!currentUser) {
      return NextResponse.json({ error: "Current user not found" }, { status: 404 });
    }

    const friend = await User.findById(friendId);
    if (!friend) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove from both users' friend lists
    currentUser.friends = (currentUser.friends || []).filter(
      id => id && id.toString() !== friendId.toString()
    );
    friend.friends = (friend.friends || []).filter(
      id => id && id.toString() !== currentUser._id.toString()
    );

    // Also clean up any pending friend requests between them
    currentUser.sentFriendRequests = (currentUser.sentFriendRequests || []).filter(
      req => req && req.to && req.to.toString() !== friendId.toString()
    );
    currentUser.friendRequests = (currentUser.friendRequests || []).filter(
      req => req && req.from && req.from.toString() !== friendId.toString()
    );
    friend.sentFriendRequests = (friend.sentFriendRequests || []).filter(
      req => req && req.to && req.to.toString() !== currentUser._id.toString()
    );
    friend.friendRequests = (friend.friendRequests || []).filter(
      req => req && req.from && req.from.toString() !== currentUser._id.toString()
    );

    await currentUser.save({ validateBeforeSave: false });
    await friend.save({ validateBeforeSave: false });

    return NextResponse.json({ 
      success: true, 
      message: "Friend removed successfully" 
    });
  } catch (error) {
    console.error("Remove friend error:", error);
    console.error("Error details:", error.message, error.stack);
    return NextResponse.json({ 
      error: "Failed to remove friend",
      details: error.message 
    }, { status: 500 });
  }
}
