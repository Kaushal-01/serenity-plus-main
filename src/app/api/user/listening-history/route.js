import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SongPlay from "@/models/songPlay";
import jwt from "jsonwebtoken";

export async function GET(request) {
  try {
    await connectDB();

    // Get user from token
    const token = request.headers.get("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required", songs: [] },
        { status: 401 }
      );
    }

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch (err) {
      return NextResponse.json(
        { success: false, message: "Invalid token", songs: [] },
        { status: 401 }
      );
    }

    // Get last 12 unique songs listened by this user
    const listeningHistory = await SongPlay.aggregate([
      {
        // Filter by userId
        $match: { userId: userId }
      },
      {
        // Sort by most recent first
        $sort: { playedAt: -1 }
      },
      {
        // Group by songId to get unique songs (keeping the most recent play)
        $group: {
          _id: "$songId",
          songName: { $first: "$songName" },
          artists: { $first: "$artists" },
          primaryArtists: { $first: "$primaryArtists" },
          image: { $first: "$image" },
          downloadUrl: { $first: "$downloadUrl" },
          url: { $first: "$url" },
          lastPlayed: { $first: "$playedAt" }
        }
      },
      {
        // Sort again by last played
        $sort: { lastPlayed: -1 }
      },
      {
        // Limit to 12 songs
        $limit: 12
      },
      {
        // Format the output to match song structure
        $project: {
          id: "$_id",
          name: "$songName",
          artists: "$artists",
          primaryArtists: "$primaryArtists",
          image: "$image",
          downloadUrl: "$downloadUrl",
          url: "$url",
          lastPlayed: "$lastPlayed",
          _id: 0
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      songs: listeningHistory,
      count: listeningHistory.length
    });
  } catch (error) {
    console.error("Error fetching listening history:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch listening history", songs: [] },
      { status: 500 }
    );
  }
}
