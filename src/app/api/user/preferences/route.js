import connectDB from "../../../../lib/db";
import User from "../../../../models/user";
import { verifyToken } from "../../../../lib/jwt";

// ✅ GET request (for checking setup)
export async function GET(req) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    const payload = verifyToken(token);
    if (!payload)
      return Response.json({ error: "Invalid token" }, { status: 401 });

    await connectDB();
    const user = await User.findById(payload.id);
    if (!user)
      return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json({
      success: true,
      preferences: user.preferences || { isSetupComplete: false },
    });
  } catch (err) {
    console.error("GET /preferences error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// ✅ POST request (for saving preferences)
export async function POST(req) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    const payload = verifyToken(token);
    if (!payload)
      return Response.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json();
    const { genres, artists } = body;

    await connectDB();
    const user = await User.findById(payload.id);
    if (!user)
      return Response.json({ error: "User not found" }, { status: 404 });

    user.preferences = {
      genres: genres || [],
      artists: artists || [],
      isSetupComplete: true,
    };

    await user.save();

    return Response.json({
      success: true,
      preferences: user.preferences,
    });
  } catch (err) {
    console.error("POST /preferences error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// ✅ PUT request (for updating preferences)
export async function PUT(req) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    const payload = verifyToken(token);
    if (!payload)
      return Response.json({ error: "Invalid token" }, { status: 401 });

    const body = await req.json();
    const { genres, artists } = body;

    await connectDB();
    const user = await User.findById(payload.id);
    if (!user)
      return Response.json({ error: "User not found" }, { status: 404 });

    user.preferences = {
      genres: genres || [],
      artists: artists || [],
      isSetupComplete: true,
    };

    await user.save();

    return Response.json({
      success: true,
      preferences: user.preferences,
    });
  } catch (err) {
    console.error("PUT /preferences error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
