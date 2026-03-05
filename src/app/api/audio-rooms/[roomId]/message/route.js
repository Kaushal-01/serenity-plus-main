import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import AudioRoom from "@/models/audioRoom";
import User from "@/models/user";

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
    const { content, messageType, sharedSong, emoji } = await request.json();
    
    // Validate message type
    if (!['text', 'song', 'emoji'].includes(messageType)) {
      return NextResponse.json(
        { error: "Invalid message type" },
        { status: 400 }
      );
    }
    
    // Validate content
    if (messageType === 'text' && (!content || content.trim().length === 0)) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }
    
    if (content && content.length > 500) {
      return NextResponse.json(
        { error: "Message is too long (max 500 characters)" },
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
    
    // Check if user is a participant
    const isParticipant = room.participants.some(
      p => p.toString() === authResult.user.id
    );
    
    if (!isParticipant) {
      return NextResponse.json(
        { error: "You must join the room to send messages" },
        { status: 403 }
      );
    }
    
    // Get user info
    const user = await User.findById(authResult.user.id).select('name userId profilePicture');
    
    // Create message object
    const messageData = {
      sender: authResult.user.id,
      senderName: user.name,
      senderProfilePicture: user.profilePicture,
      messageType
    };
    
    if (messageType === 'text') {
      messageData.content = content.trim();
    } else if (messageType === 'song' && sharedSong) {
      messageData.sharedSong = sharedSong;
      messageData.content = `Shared: ${sharedSong.name}`;
    } else if (messageType === 'emoji' && emoji) {
      messageData.emoji = emoji;
      messageData.content = emoji;
    }
    
    // Retry logic for version conflicts
    const maxRetries = 3;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Re-fetch room on retry
        if (attempt > 0) {
          const retryRoom = await AudioRoom.findById(roomId);
          if (!retryRoom) break;
          room.messages = retryRoom.messages;
        }
        
        room.addMessage(messageData);
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
      message: "Message sent successfully"
    });
    
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
