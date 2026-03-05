import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/user";

// POST - Accept or decline friend request
export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const { requestId, action } = await request.json(); // action: "accept" or "decline"

    const currentUser = await User.findById(auth.user.id);
    const requestIndex = currentUser.friendRequests.findIndex(
      req => req.from.toString() === requestId
    );

    if (requestIndex === -1) {
      return NextResponse.json({ error: "Friend request not found" }, { status: 404 });
    }

    const requester = await User.findById(requestId);

    if (action === "accept") {
      // Add to friends list
      currentUser.friends.push(requester._id);
      requester.friends.push(currentUser._id);
    }

    // Remove friend request
    currentUser.friendRequests.splice(requestIndex, 1);
    
    // Remove from sent requests
    const sentIndex = requester.sentFriendRequests.findIndex(
      req => req.to.toString() === currentUser._id.toString()
    );
    if (sentIndex > -1) {
      requester.sentFriendRequests.splice(sentIndex, 1);
    }

    await currentUser.save();
    await requester.save();

    return NextResponse.json({ 
      success: true, 
      message: action === "accept" ? "Friend request accepted" : "Friend request declined" 
    });
  } catch (error) {
    console.error("Friend response error:", error);
    return NextResponse.json({ error: "Failed to process friend request" }, { status: 500 });
  }
}
