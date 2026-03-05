import connectDB from "../../../../lib/db";
import User from "../../../../models/user";
import { verifyToken } from "../../../../lib/jwt";

export async function GET(req) {
  // GET -> return current user's favorites
  try {
    const startTime = Date.now();
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    if (!token) return Response.json({ error: "No token" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });
    console.log(`[FAVORITES] Auth took ${Date.now() - startTime}ms`);

    const dbStart = Date.now();
    await connectDB();
    console.log(`[FAVORITES] DB connect took ${Date.now() - dbStart}ms`);
    
    // Use lean() for faster query and limit favorites to last 100
    const queryStart = Date.now();
    const user = await User.findById(payload.id)
      .select("favorites")
      .lean();
    console.log(`[FAVORITES] User query took ${Date.now() - queryStart}ms`);
    
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    // Return most recent 100 favorites to avoid massive data transfer
    const favorites = user.favorites ? user.favorites.slice(0, 100) : [];
    console.log(`[FAVORITES] Total time: ${Date.now() - startTime}ms`);
    return Response.json({ success: true, favorites });
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
    const user = await User.findById(payload.id).select("favorites");
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    // avoid duplicates
    const exists = user.favorites.some(f => f.id === song.id);
    if (exists) return Response.json({ success: true, message: "Already in favorites", favorites: user.favorites });

    // Normalize artists - handle complex structures
    let normalizedArtists = [];
    if (song.artists?.primary && Array.isArray(song.artists.primary)) {
      normalizedArtists = song.artists.primary.map(a => a.name || a).filter(Boolean);
    } else if (Array.isArray(song.artists)) {
      normalizedArtists = song.artists.map(a => a.name || a).filter(Boolean);
    } else if (song.primaryArtists) {
      normalizedArtists = [song.primaryArtists];
    }

    const favoriteData = {
      id: song.id,
      name: song.name || song.title || "",
      artists: normalizedArtists,
      image: Array.isArray(song.image) ? song.image : [],
      downloadUrl: Array.isArray(song.downloadUrl) ? song.downloadUrl : [],
      url: song.url || ""
    };

    // Use atomic operation to avoid full document validation
    await User.findByIdAndUpdate(
      payload.id,
      { $push: { favorites: { $each: [favoriteData], $position: 0 } } },
      { returnDocument: 'after', select: "favorites" }
    );

    const updatedUser = await User.findById(payload.id).select("favorites");
    return Response.json({ success: true, favorites: updatedUser.favorites });
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
    
    // Use atomic operation to avoid full document validation
    await User.findByIdAndUpdate(
      payload.id,
      { $pull: { favorites: { id: id } } },
      { returnDocument: 'after' }
    );

    const user = await User.findById(payload.id).select("favorites");
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json({ success: true, favorites: user.favorites });
  } catch (err) {
    console.error("DELETE favorites err", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
