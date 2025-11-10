import connectDB from "../../../../lib/db";
import User from "../../../../models/user"
import { verifyToken } from "../../../../lib/jwt";

export async function GET(req) {
  try {
    const auth = req.headers.get("authorization") || "";
    const token = auth.replace("Bearer ", "");
    if (!token) return Response.json({ error: "No token" }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return Response.json({ error: "Invalid token" }, { status: 401 });

    await connectDB();
    const user = await User.findById(payload.id).select("-password");
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json({ success: true, user });
  } catch (err) {
    console.error("verify route err", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
