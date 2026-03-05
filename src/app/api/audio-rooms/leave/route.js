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
    
    const { roomId } = await request.json();
    
    if (!roomId) {
      return NextResponse.json(
        { error: "Room ID is required" },
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
    
    // Get user info for system message
    const user = await User.findById(authResult.user.id).select('name');
    
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
        room.removeParticipant(authResult.user.id);
        
        // Add system message
        room.addMessage({
          sender: authResult.user.id,
          senderName: user.name,
          content: `${user.name} left the room`,
          messageType: 'text'
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
      message: "Left room successfully"
    });
    
  } catch (error) {
    console.error("Leave room error:", error);
    return NextResponse.json(
      { error: "Failed to leave room" },
      { status: 500 }
    );
  }
}
