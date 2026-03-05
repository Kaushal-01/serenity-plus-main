import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import ArtistSong from "@/models/artistSong";
import User from "@/models/user";

// POST - Upload a new song (artists only)
export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(auth.user.id);

    if (user.accountType !== "artist") {
      return NextResponse.json({ error: "Only artists can upload songs" }, { status: 403 });
    }

    const formData = await request.formData();
    const songName = formData.get("songName");
    const artistName = formData.get("artistName");
    const musicBy = formData.get("musicBy");
    const coverPhoto = formData.get("coverPhoto"); // URL or base64
    const audioFile = formData.get("audioFile"); // URL or base64
    const duration = formData.get("duration");
    const genre = formData.get("genre");
    const description = formData.get("description");

    if (!songName || !artistName || !musicBy || !coverPhoto || !audioFile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newSong = new ArtistSong({
      songName,
      artistName,
      musicBy,
      coverPhoto,
      audioFile,
      uploadedBy: user._id,
      duration: duration ? parseInt(duration) : 0,
      genre,
      description
    });

    await newSong.save();

    return NextResponse.json({ 
      success: true, 
      message: "Song uploaded successfully",
      song: newSong
    });
  } catch (error) {
    console.error("Upload song error:", error);
    return NextResponse.json({ error: "Failed to upload song" }, { status: 500 });
  }
}

// GET - Get artist's uploaded songs
export async function GET(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get("artistId") || auth.user.id;
    const excludeAudio = searchParams.get("excludeAudio") === "true"; // Option to exclude heavy audio data

    const songs = await ArtistSong.find({ 
      uploadedBy: artistId,
      isActive: true 
    })
    .populate("uploadedBy", "name userId artistName")
    .sort({ uploadedAt: -1 });

    // Format songs with listener count
    const formattedSongs = songs.map(song => {
      const songObj = song.toObject();
      
      // Exclude heavy audio file data for dashboard listing to improve performance
      if (excludeAudio) {
        return {
          ...songObj,
          audioFile: undefined, // Don't send base64 audio - reduces payload by 100KB+ per song
          audioFileUrl: songObj.audioFile?.startsWith('http') ? songObj.audioFile : null, // Keep URL if it's a URL
          listenerCount: song.uniqueListeners.length,
          uniqueListeners: undefined
        };
      }
      
      return {
        ...songObj,
        listenerCount: song.uniqueListeners.length,
        uniqueListeners: undefined
      };
    });

    return NextResponse.json({ 
      success: true, 
      songs: formattedSongs
    });
  } catch (error) {
    console.error("Get artist songs error:", error);
    return NextResponse.json({ error: "Failed to get songs" }, { status: 500 });
  }
}

// DELETE - Delete an artist's song and remove it from all users' data
export async function DELETE(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(auth.user.id);

    if (user.accountType !== "artist") {
      return NextResponse.json({ error: "Only artists can delete songs" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const songId = searchParams.get("id");

    if (!songId) {
      return NextResponse.json({ error: "Song ID is required" }, { status: 400 });
    }

    // Find the song and verify ownership
    const song = await ArtistSong.findById(songId);
    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    if (song.uploadedBy.toString() !== auth.user.id) {
      return NextResponse.json({ error: "You can only delete your own songs" }, { status: 403 });
    }

    // Delete the song from ArtistSong collection
    await ArtistSong.findByIdAndDelete(songId);

    // Remove from all users' favorites
    await User.updateMany(
      { "favorites.id": songId },
      { $pull: { favorites: { id: songId } } }
    );

    // Remove from all users' playlists
    await User.updateMany(
      { "playlists.songs.id": songId },
      { $pull: { "playlists.$[].songs": { id: songId } } }
    );

    // Optional: Delete from listening history (SongPlay)
    // Uncomment if you want to remove all play history as well
    // const SongPlay = require("@/models/songPlay").default;
    // await SongPlay.deleteMany({ songId: songId });

    return NextResponse.json({ 
      success: true, 
      message: "Song deleted successfully and removed from all users' data" 
    });
  } catch (error) {
    console.error("Delete song error:", error);
    return NextResponse.json({ error: "Failed to delete song" }, { status: 500 });
  }
}
