import connectDB from "../../../../lib/db";
import User from "../../../../models/user";
import { verifyToken } from "../../../../lib/jwt";

// GET - Fetch all user playlists
export async function GET(req) {
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

    await connectDB();
    const user = await User.findById(payload.id).select("playlists");
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      playlists: user.playlists || []
    });
  } catch (err) {
    console.error("GET playlists error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// POST - Create a new playlist
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
    const { name, description } = body;

    if (!name || !name.trim()) {
      return Response.json({ error: "Playlist name is required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(payload.id);
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check if playlist with same name exists
    const exists = user.playlists.some(p => p.name.toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      return Response.json({ error: "Playlist with this name already exists" }, { status: 400 });
    }

    const newPlaylist = {
      name: name.trim(),
      description: description?.trim() || "",
      songs: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    user.playlists.push(newPlaylist);
    await user.save();

    return Response.json({
      success: true,
      message: "Playlist created successfully",
      playlist: user.playlists[user.playlists.length - 1]
    });
  } catch (err) {
    console.error("POST playlist error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT - Update playlist (name, description)
export async function PUT(req) {
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
    const { playlistId, name, description } = body;

    if (!playlistId) {
      return Response.json({ error: "Playlist ID is required" }, { status: 400 });
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

    if (name && name.trim()) {
      playlist.name = name.trim();
    }
    if (description !== undefined) {
      playlist.description = description.trim();
    }
    playlist.updatedAt = new Date();

    await user.save();

    return Response.json({
      success: true,
      message: "Playlist updated successfully",
      playlist
    });
  } catch (err) {
    console.error("PUT playlist error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE - Delete a playlist
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
    const playlistId = searchParams.get("id");

    if (!playlistId) {
      return Response.json({ error: "Playlist ID is required" }, { status: 400 });
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

    playlist.deleteOne();
    await user.save();

    return Response.json({
      success: true,
      message: "Playlist deleted successfully"
    });
  } catch (err) {
    console.error("DELETE playlist error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
