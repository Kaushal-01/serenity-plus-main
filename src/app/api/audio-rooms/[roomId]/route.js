import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import AudioRoom from "@/models/audioRoom";

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
    
    // Use aggregation to limit messages at DB level - CRITICAL for performance
    const mongoose = await import("mongoose");
    const roomData = await AudioRoom.aggregate([
      { $match: { _id: new mongoose.default.Types.ObjectId(roomId) } },
      {
        $project: {
          name: 1,
          description: 1,
          roomCode: 1,
          isPrivate: 1,
          creator: 1,
          participants: 1,
          maxParticipants: 1,
          nowPlaying: 1,
          queue: 1,
          isActive: 1,
          createdAt: 1,
          lastActivity: 1,
          // Only get last 50 messages from DB
          messages: { $slice: ["$messages", -50] }
        }
      }
    ]);
    
    if (!roomData || roomData.length === 0) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }
    
    const room = roomData[0];
    
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
    
    // Get user data in one batch query
    const User = (await import("@/models/user")).default;
    const userIds = [...new Set([room.creator.toString(), ...room.participants.map(p => p.toString())])];
    const users = await User.find({ _id: { $in: userIds } })
      .select('name userId profilePicture')
      .lean();
    
    const userMap = new Map(users.map(u => [u._id.toString(), u]));
    
    return NextResponse.json({
      success: true,
      userId: authResult.user.id,
      room: {
        id: room._id.toString(),
        name: room.name,
        description: room.description,
        roomCode: room.roomCode,
        isPrivate: room.isPrivate,
        creator: userMap.get(room.creator.toString()),
        participants: room.participants.map(p => userMap.get(p.toString())).filter(Boolean),
        participantCount: room.participants.length,
        maxParticipants: room.maxParticipants,
        nowPlaying: room.nowPlaying,
        queue: room.queue,
        messages: room.messages,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity
      }
    });
    
  } catch (error) {
    console.error("Get room details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch room details" },
      { status: 500 }
    );
  }
}
