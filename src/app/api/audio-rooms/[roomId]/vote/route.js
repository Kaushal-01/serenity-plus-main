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
    const songData = await request.json();
    
    // Validate song data
    if (!songData.songId || !songData.songName) {
      return NextResponse.json(
        { error: "Invalid song data" },
        { status: 400 }
      );
    }
    
    // Retry logic for version conflicts (optimistic locking)
    const maxRetries = 5;
    let retryCount = 0;
    let lastError = null;
    
    while (retryCount < maxRetries) {
      try {
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
            { error: "You must join the room to vote for songs" },
            { status: 403 }
          );
        }
        
        // Vote for the song
        room.voteSong(authResult.user.id, songData);
        await room.save();
        
        return NextResponse.json({
          success: true,
          message: "Vote recorded successfully",
          queue: room.queue
        });
        
      } catch (saveError) {
        // Check if it's a version error (optimistic locking conflict)
        if (saveError.name === 'VersionError') {
          lastError = saveError;
          retryCount++;
          // Exponential backoff: wait before retrying
          await new Promise(resolve => setTimeout(resolve, Math.min(100 * Math.pow(2, retryCount), 1000)));
          continue;
        }
        // If it's not a version error, throw it
        throw saveError;
      }
    }
    
    // If we exhausted all retries
    console.error(`Vote failed after ${maxRetries} retries:`, lastError);
    return NextResponse.json(
      { error: "Too many concurrent votes. Please try again." },
      { status: 409 }
    );
    
  } catch (error) {
    console.error("Vote song error:", error);
    return NextResponse.json(
      { error: "Failed to vote for song" },
      { status: 500 }
    );
  }
}
