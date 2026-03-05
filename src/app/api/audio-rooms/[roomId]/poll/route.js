import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import AudioRoom from "@/models/audioRoom";

// Polling endpoint for real-time updates - MUST BE ULTRA FAST (<100ms)
export async function GET(request, { params }) {
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
    const { searchParams } = new URL(request.url);
    const lastMessageId = searchParams.get('lastMessageId');
    
    // CRITICAL: Only select what we need, use lean() for speed
    const room = await AudioRoom.findById(roomId)
      .select('participants nowPlaying queue messages isActive')
      .lean();
    
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
        { error: "You are not a participant in this room" },
        { status: 403 }
      );
    }
    
    // Get only RECENT messages - limit to last 20 for polling
    let newMessages = [];
    const recentMessages = room.messages?.slice(-20) || [];
    
    if (lastMessageId && recentMessages.length > 0) {
      const lastIndex = recentMessages.findIndex(
        msg => msg._id.toString() === lastMessageId
      );
      if (lastIndex !== -1 && lastIndex < recentMessages.length - 1) {
        newMessages = recentMessages.slice(lastIndex + 1);
      }
    } else {
      newMessages = recentMessages;
    }
    
    // Don't populate participants on every poll - just return IDs
    // Frontend should already have user data from initial load
    return NextResponse.json({
      success: true,
      nowPlaying: room.nowPlaying,
      queue: room.queue,
      messages: newMessages,
      participantIds: room.participants,
      participantCount: room.participants.length
    });
    
  } catch (error) {
    console.error("Poll room error:", error);
    return NextResponse.json(
      { error: "Failed to poll room" },
      { status: 500 }
    );
  }
}
