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
    
    // Check if user is the room creator (only creator can control playback)
    if (room.creator.toString() !== authResult.user.id) {
      return NextResponse.json(
        { error: "Only the room creator can control playback" },
        { status: 403 }
      );
    }
    
    // Retry logic for version conflicts
    const maxRetries = 3;
    let nowPlaying = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Re-fetch room on retry
        if (attempt > 0) {
          const retryRoom = await AudioRoom.findById(roomId);
          if (!retryRoom) break;
          Object.assign(room, retryRoom);
        }
        
        nowPlaying = room.playNextSong(authResult.user.id);
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
    
    if (!nowPlaying) {
      return NextResponse.json({
        success: true,
        message: "Queue is empty",
        nowPlaying: null
      });
    }
    
    return NextResponse.json({
      success: true,
      message: "Playing next song",
      nowPlaying: room.nowPlaying,
      queue: room.queue
    });
    
  } catch (error) {
    console.error("Play next song error:", error);
    return NextResponse.json(
      { error: "Failed to play next song" },
      { status: 500 }
    );
  }
}
