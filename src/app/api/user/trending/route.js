import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import SongPlay from "@/models/songPlay";

export async function GET(request) {
  try {
    await connectDB();

    // Aggregate song plays to get top 10 most played songs
    const trendingSongs = await SongPlay.aggregate([
      {
        // Group by songId and count plays
        $group: {
          _id: "$songId",
          playCount: { $sum: 1 },
          songName: { $first: "$songName" },
          artists: { $first: "$artists" },
          primaryArtists: { $first: "$primaryArtists" },
          image: { $first: "$image" },
          downloadUrl: { $first: "$downloadUrl" },
          url: { $first: "$url" },
          lastPlayed: { $max: "$playedAt" }
        }
      },
      {
        // Sort by play count (descending) and last played (descending)
        $sort: { playCount: -1, lastPlayed: -1 }
      },
      {
        // Limit to top 10
        $limit: 10
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
          playCount: "$playCount",
          _id: 0
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      songs: trendingSongs,
      count: trendingSongs.length
    });
  } catch (error) {
    console.error("Error fetching trending songs:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch trending songs", songs: [] },
      { status: 500 }
    );
  }
}
