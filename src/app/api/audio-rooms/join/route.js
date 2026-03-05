import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import AudioRoom from "@/models/audioRoom";
import User from "@/models/user";

export async function POST(request) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { roomId, roomCode } = await request.json();
    
    // Find room by ID or code - select only needed fields for speed
    let room;
    if (roomId) {
      room = await AudioRoom.findById(roomId)
        .select('name roomCode isActive participants maxParticipants creator');
    } else if (roomCode) {
      room = await AudioRoom.findOne({ 
        roomCode: roomCode.toUpperCase(),
        isActive: true 
      }).select('name roomCode isActive participants maxParticipants creator');
    } else {
      return NextResponse.json(
        { error: "Room ID or code is required" },
        { status: 400 }
      );
    }
    
    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }
    
    if (!room.isActive) {
      return NextResponse.json(
        { error: "This room is no longer active" },
        { status: 403 }
      );
    }
    
    // Check if room is full
    if (room.participants.length >= room.maxParticipants) {
      return NextResponse.json(
        { error: "Room is full" },
        { status: 403 }
      );
    }
    
    // Check if user is already in the room
    if (room.participants.some(p => p.toString() === authResult.user.id)) {
      return NextResponse.json({
        success: true,
        message: "Already in the room",
        roomId: room._id.toString()
      });
    }
    
    // Get user info for system message - only select needed fields
    const user = await User.findById(authResult.user.id)
      .select('name userId profilePicture')
      .lean();
    
    // Use atomic update to add participant and message in one operation
    await AudioRoom.findByIdAndUpdate(room._id, {
      $push: { 
        participants: authResult.user.id,
        messages: {
          sender: authResult.user.id,
          senderName: user.name,
          content: `${user.name} joined the room`,
          messageType: 'text',
          createdAt: new Date()
        }
      },
      $set: { lastActivity: new Date() }
    });
    
    return NextResponse.json({
      success: true,
      message: "Joined room successfully",
      roomId: room._id.toString()
    });
    
  } catch (error) {
    console.error("Join room error:", error);
    return NextResponse.json(
      { error: "Failed to join room" },
      { status: 500 }
    );
  }
}
