import connectDB from "../../../../../lib/db";
import User from "../../../../../models/user";
import { verifyToken } from "../../../../../lib/jwt";

// POST - Add song to playlist
export async function POST(req) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    
    if (!token) {
      return Response.json({ error: "No token provided" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { playlistId, song } = body;

    if (!playlistId || !song || !song.id) {
      return Response.json({ error: "Playlist ID and song are required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(payload.id);
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const playlist = user.playlists.id(playlistId);
    if (!playlist) {
      return Response.json({ error: "Playlist not found" }, { status: 404 });
    }

    // Check if song already exists in playlist
    const exists = playlist.songs.some(s => s.id === song.id);
    if (exists) {
      return Response.json({ 
        success: true, 
        message: "Song already in playlist",
        playlist 
      });
    }

    // Normalize artists - handle complex structures
    let normalizedArtists = [];
    if (song.artists?.primary && Array.isArray(song.artists.primary)) {
      normalizedArtists = song.artists.primary.map(a => a.name || a).filter(Boolean);
    } else if (Array.isArray(song.artists)) {
      normalizedArtists = song.artists.map(a => a.name || a).filter(Boolean);
    } else if (song.primaryArtists) {
      normalizedArtists = [song.primaryArtists];
    }

    const songData = {
      id: song.id,
      name: song.name || song.title || "",
      artists: normalizedArtists,
      primaryArtists: song.primaryArtists || normalizedArtists.join(", ") || "",
      image: Array.isArray(song.image) ? song.image : [],
      downloadUrl: Array.isArray(song.downloadUrl) ? song.downloadUrl : [],
      url: song.url || "",
      addedAt: new Date()
    };

    // Use atomic operation to avoid full document validation
    await User.findOneAndUpdate(
      { _id: payload.id, "playlists._id": playlistId },
      { 
        $push: { "playlists.$.songs": songData },
        $set: { "playlists.$.updatedAt": new Date() }
      },
      { returnDocument: 'after' }
    );

    return Response.json({
      success: true,
      message: "Song added to playlist",
      playlist
    });
  } catch (err) {
    console.error("POST playlist song error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE - Remove song from playlist
export async function DELETE(req) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    
    if (!token) {
      return Response.json({ error: "No token provided" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const playlistId = searchParams.get("playlistId");
    const songId = searchParams.get("songId");

    if (!playlistId || !songId) {
      return Response.json({ error: "Playlist ID and Song ID are required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(payload.id);
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const playlist = user.playlists.id(playlistId);
    if (!playlist) {
      return Response.json({ error: "Playlist not found" }, { status: 404 });
    }

    playlist.songs = playlist.songs.filter(s => s.id !== songId);
    playlist.updatedAt = new Date();

    await user.save();

    return Response.json({
      success: true,
      message: "Song removed from playlist",
      playlist
    });
  } catch (err) {
    console.error("DELETE playlist song error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
