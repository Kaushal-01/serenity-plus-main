import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SongPlay from "@/models/songPlay";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export async function GET(request) {
  try {
    const startTime = Date.now();
    const dbStart = Date.now();
    await connectDB();
    console.log(`[LISTENING_HISTORY] DB connect took ${Date.now() - dbStart}ms`);

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

    // Convert userId to ObjectId for MongoDB query
    let userIdQuery;
    try {
      userIdQuery = new mongoose.Types.ObjectId(userId);
    } catch (e) {
      // If conversion fails, use as string
      userIdQuery = userId;
    }

    // Get last 12 unique songs listened by this user
    // Optimized: Only look at recent plays (last 90 days) to reduce dataset
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const aggStart = Date.now();
    const listeningHistory = await SongPlay.aggregate([
      {
        // Filter by userId and recent plays only
        $match: { 
          userId: userIdQuery,
          playedAt: { $gte: ninetyDaysAgo }
        }
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
    console.log(`[LISTENING_HISTORY] Aggregation took ${Date.now() - aggStart}ms, found ${listeningHistory.length} songs`);
    console.log(`[LISTENING_HISTORY] Total time: ${Date.now() - startTime}ms`);

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
