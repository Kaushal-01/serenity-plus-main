import connectDB from "../../../../lib/db";
import User from "../../../../models/user"
import { verifyToken } from "../../../../lib/jwt";

export async function GET(req) {
  try {
    const startTime = Date.now();
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    if (!token) return Response.json({ error: "No token" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });
    console.log(`[AUTH_VERIFY] Token verification took ${Date.now() - startTime}ms`);

    const dbStart = Date.now();
    await connectDB();
    console.log(`[AUTH_VERIFY] DB connect took ${Date.now() - dbStart}ms`);
    
    // Only select essential fields to avoid loading massive arrays (favorites, playlists, friends, etc.)
    const queryStart = Date.now();
    const user = await User.findById(payload.id)
      .select("name email userId profilePicture accountType bio favoriteArtists favoriteGenres artistName artistVerified preferences createdAt dateOfBirth gender ageGroup occupation listeningHabits")
      .lean(); // Use lean() for faster queries when we don't need Mongoose document methods
    console.log(`[AUTH_VERIFY] User query took ${Date.now() - queryStart}ms`);
    
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    console.log(`[AUTH_VERIFY] Total time: ${Date.now() - startTime}ms`);
    return Response.json({ success: true, user });
  } catch (err) {
    console.error("verify route err", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
