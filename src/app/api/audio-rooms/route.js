import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import AudioRoom from "@/models/audioRoom";
import User from "@/models/user";

// Helper function to calculate age
function calculateAge(dateOfBirth) {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

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
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    const { name, description, isPrivate, maxParticipants } = body;
    
    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Room name is required" },
        { status: 400 }
      );
    }
    
    if (name.length > 50) {
      return NextResponse.json(
        { error: "Room name must be 50 characters or less" },
        { status: 400 }
      );
    }
    
    // Validate maxParticipants
    if (maxParticipants && (maxParticipants < 2 || maxParticipants > 25)) {
      return NextResponse.json(
        { error: "Max participants must be between 2 and 25" },
        { status: 400 }
      );
    }
    
    // Check if user exists and get their age
    const user = await User.findById(authResult.user.id);
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if date of birth is set
    if (!user.dateOfBirth) {
      return NextResponse.json(
        { error: "Please set your date of birth in profile settings to create an audio room" },
        { status: 400 }
      );
    }
    
    // Check age requirement (must be 16+)
    const age = calculateAge(user.dateOfBirth);
    if (age < 16) {
      return NextResponse.json(
        { error: "You must be at least 16 years old to create an audio room" },
        { status: 403 }
      );
    }
    
    // Check room limit (max 2 rooms per user)
    const userRoomCount = await AudioRoom.countDocuments({ 
      creator: authResult.user.id,
      isActive: true 
    });
    
    if (userRoomCount >= 2) {
      return NextResponse.json(
        { error: "You can only create up to 2 audio rooms. Please delete an existing room first." },
        { status: 403 }
      );
    }
    
    // Generate unique room code
    let roomCode;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      roomCode = '';
      for (let i = 0; i < 6; i++) {
        roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const existing = await AudioRoom.findOne({ roomCode });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return NextResponse.json(
        { error: "Failed to generate unique room code. Please try again." },
        { status: 500 }
      );
    }
    
    // Create the room
    const audioRoom = new AudioRoom({
      name: name.trim(),
      description: description?.trim() || "",
      roomCode,
      creator: authResult.user.id,
      isPrivate: isPrivate || false,
      maxParticipants: maxParticipants || 25,
      participants: [authResult.user.id], // Creator joins automatically
      isActive: true
    });
    
    try {
      await audioRoom.save();
    } catch (saveError) {
      console.error("Error saving audio room:", saveError);
      
      // Handle mongoose validation errors
      if (saveError.name === 'ValidationError') {
        const messages = Object.values(saveError.errors).map(err => err.message);
        return NextResponse.json(
          { error: messages.join(', ') },
          { status: 400 }
        );
      }
      
      throw saveError; // Re-throw to be caught by outer catch
    }
    
    // Populate creator info
    await audioRoom.populate('creator', 'name userId profilePicture');
    
    return NextResponse.json({
      success: true,
      room: {
        id: audioRoom._id.toString(),
        name: audioRoom.name,
        description: audioRoom.description,
        roomCode: audioRoom.roomCode,
        isPrivate: audioRoom.isPrivate,
        creator: audioRoom.creator,
        participantCount: audioRoom.participants.length,
        maxParticipants: audioRoom.maxParticipants,
        createdAt: audioRoom.createdAt
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error("Create audio room error:", error);
    
    // Return more specific error message for debugging
    const errorMessage = error.message || "Failed to create audio room";
    
    return NextResponse.json(
      { 
        error: "Failed to create audio room", 
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
      },
      { status: 500 }
    );
  }
}

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
    
    // Optimized query with lean() for speed
    const rooms = await AudioRoom.find({ 
      creator: authResult.user.id,
      isActive: true 
    })
    .select('-messages -playHistory -queue')
    .populate('creator', 'name userId profilePicture')
    .sort({ createdAt: -1 })
    .limit(20) // Limit to 20 rooms
    .lean();
    
    return NextResponse.json({
      success: true,
      rooms: rooms.map(room => ({
        id: room._id.toString(),
        name: room.name,
        description: room.description,
        roomCode: room.roomCode,
        isPrivate: room.isPrivate,
        creator: room.creator,
        participantCount: room.participants.length,
        maxParticipants: room.maxParticipants,
        nowPlaying: room.nowPlaying,
        createdAt: room.createdAt,
        lastActivity: room.lastActivity
      }))
    });
    
  } catch (error) {
    console.error("Get user rooms error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a room
export async function DELETE(request) {
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
    const roomId = searchParams.get('roomId');
    
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
    
    // Only creator can delete the room
    if (room.creator.toString() !== authResult.user.id) {
      return NextResponse.json(
        { error: "Only the room creator can delete this room" },
        { status: 403 }
      );
    }
    
    // Soft delete by marking as inactive
    room.isActive = false;
    await room.save();
    
    return NextResponse.json({
      success: true,
      message: "Room deleted successfully"
    });
    
  } catch (error) {
    console.error("Delete room error:", error);
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    );
  }
}
