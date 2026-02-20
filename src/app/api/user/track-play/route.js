import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SongPlay from "@/models/songPlay";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    await connectDB();

    // Get user from token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    let userId = null;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
        
        // Convert to ObjectId if it's a valid ObjectId string
        if (userId && mongoose.Types.ObjectId.isValid(userId)) {
          userId = new mongoose.Types.ObjectId(userId);
        }
      } catch (err) {
        console.log("Invalid token, tracking anonymously");
      }
    }

    const { song } = await request.json();
    
    if (!song || !song.id) {
      return NextResponse.json(
        { success: false, message: "Song data is required" },
        { status: 400 }
      );
    }

    // Create song play record
    const songPlay = new SongPlay({
      songId: song.id,
      songName: song.name,
      artists: song.artists || [],
      primaryArtists: song.primaryArtists || song.artists?.primary?.[0]?.name || "",
      image: song.image || [],
      downloadUrl: song.downloadUrl || [],
      url: song.url || "",
      userId: userId
    });

    await songPlay.save();
    
    console.log("Song play tracked:", {
      songId: song.id,
      songName: song.name,
      userId: userId,
      hasDownloadUrl: !!(song.downloadUrl && song.downloadUrl.length > 0),
      hasImage: !!(song.image && song.image.length > 0)
    });

    return NextResponse.json({
      success: true,
      message: "Song play tracked"
    });
  } catch (error) {
    console.error("Error tracking song play:", error);
    return NextResponse.json(
      { success: false, message: "Failed to track song play" },
      { status: 500 }
    );
  }
}
