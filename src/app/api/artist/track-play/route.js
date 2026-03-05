import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import ArtistSong from "@/models/artistSong";

// POST - Track a song play
export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const { songId } = await request.json();

    const song = await ArtistSong.findById(songId);
    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    // Increment total plays
    song.totalPlays += 1;

    // Add to unique listeners if not already there
    if (!song.uniqueListeners.includes(auth.user.id)) {
      song.uniqueListeners.push(auth.user.id);
    }

    await song.save();

    return NextResponse.json({ 
      success: true,
      totalPlays: song.totalPlays,
      uniqueListeners: song.uniqueListeners.length
    });
  } catch (error) {
    console.error("Track play error:", error);
    return NextResponse.json({ error: "Failed to track play" }, { status: 500 });
  }
}
