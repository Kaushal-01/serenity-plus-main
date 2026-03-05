import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import AudioRoom from "@/models/audioRoom";

export async function GET(request) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // 'all', 'public', 'code'
    
    let filter = { isActive: true };
    
    if (type === 'code') {
      // Search by exact room code
      if (query.length === 6) {
        filter.roomCode = query.toUpperCase();
      } else {
        return NextResponse.json({
          success: true,
          rooms: []
        });
      }
    } else {
      // Search by name
      if (query) {
        filter.name = { $regex: query, $options: 'i' };
      }
      
      // Filter by privacy
      if (type === 'public') {
        filter.isPrivate = false;
      }
    }
    
    const rooms = await AudioRoom.find(filter)
      .select('-messages -playHistory')
      .populate('creator', 'name userId profilePicture')
      .sort({ lastActivity: -1 })
      .limit(50)
      .lean(); // Use lean() for faster queries
    
    return NextResponse.json({
      success: true,
      rooms: rooms.map(room => ({
        id: room._id.toString(),
        name: room.name,
        description: room.description,
        roomCode: room.roomCode,
        isPrivate: room.isPrivate,
        creator: {
          id: room.creator._id.toString(),
          name: room.creator.name,
          userId: room.creator.userId,
          profilePicture: room.creator.profilePicture
        },
        participantCount: room.participants.length,
        maxParticipants: room.maxParticipants,
        nowPlaying: room.nowPlaying,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity
      }))
    });
    
  } catch (error) {
    console.error("Search rooms error:", error);
    return NextResponse.json(
      { error: "Failed to search rooms" },
      { status: 500 }
    );
  }
}
