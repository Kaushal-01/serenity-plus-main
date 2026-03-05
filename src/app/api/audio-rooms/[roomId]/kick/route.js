import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import AudioRoom from "@/models/audioRoom";

export async function POST(request, { params }) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { roomId } = await params;
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    const room = await AudioRoom.findById(roomId);
    
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
    
    // Check if user is the room creator (only creator can kick users)
    if (room.creator.toString() !== authResult.user.id) {
      return NextResponse.json(
        { error: "Only the room creator can kick users" },
        { status: 403 }
      );
    }
    
    // Prevent creator from kicking themselves
    if (userId === authResult.user.id) {
      return NextResponse.json(
        { error: "You cannot kick yourself" },
        { status: 400 }
      );
    }
    
    // Retry logic for version conflicts
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Re-fetch room on retry
        if (attempt > 0) {
          const retryRoom = await AudioRoom.findById(roomId);
          if (!retryRoom) break;
          room.participants = retryRoom.participants;
          room.messages = retryRoom.messages;
        }
        
        // Remove user from participants
        room.participants = room.participants.filter(
          p => p._id.toString() !== userId
        );
        
        // Update participant count
        room.participantCount = room.participants.length;
        
        // Add a system message to chat
        room.messages.push({
          messageType: 'system',
          content: `A user was kicked from the room`,
          timestamp: new Date()
        });
        
        await room.save();
        break; // Success, exit loop
      } catch (saveError) {
        if (saveError.name === 'VersionError' && attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
          continue;
        }
        throw saveError;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "User kicked successfully",
      participants: room.participants,
      participantCount: room.participantCount
    });
    
  } catch (error) {
    console.error("Kick user error:", error);
    return NextResponse.json(
      { error: "Failed to kick user" },
      { status: 500 }
    );
  }
}
