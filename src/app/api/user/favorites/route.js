import connectDB from "../../../../lib/db";
import User from "../../../../models/user";
import { verifyToken } from "../../../../lib/jwt";

export async function GET(req) {
  // GET -> return current user's favorites
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    if (!token) return Response.json({ error: "No token" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });

    await connectDB();
    const user = await User.findById(payload.id).select("favorites -_id");
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json({ success: true, favorites: user.favorites });
  } catch (err) {
    console.error("GET favorites err", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  // POST -> add a favorite. Body: { song: { id, name, artists, image, downloadUrl, url } }
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    if (!token) return Response.json({ error: "No token" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json();
    const song = body.song;
    if (!song || !song.id) return Response.json({ error: "Invalid song" }, { status: 400 });

    await connectDB();
    const user = await User.findById(payload.id);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    // avoid duplicates
    const exists = user.favorites.some(f => f.id === song.id);
    if (exists) return Response.json({ success: true, message: "Already in favorites", favorites: user.favorites });

    user.favorites.unshift({
      id: song.id,
      name: song.name || song.title || "",
      artists: song.artists || song.primaryArtists || [],
      image: song.image || [],
      downloadUrl: song.downloadUrl || [],
      url: song.url || ""
    });
    await user.save();

    return Response.json({ success: true, favorites: user.favorites });
  } catch (err) {
    console.error("POST favorites err", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  // DELETE -> remove favorite by id via query param ?id=<songId>
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    if (!token) return Response.json({ error: "No token" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

    await connectDB();
    const user = await User.findById(payload.id);
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    user.favorites = user.favorites.filter(f => f.id !== id);
    await user.save();

    return Response.json({ success: true, favorites: user.favorites });
  } catch (err) {
    console.error("DELETE favorites err", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
