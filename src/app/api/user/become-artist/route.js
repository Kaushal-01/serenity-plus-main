import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/user";

// PUT - Upgrade user account to artist
export async function PUT(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const { artistName } = await request.json();

    if (!artistName || !artistName.trim()) {
      return NextResponse.json({ error: "Artist name is required" }, { status: 400 });
    }

    const user = await User.findById(auth.user.id);
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already an artist
    if (user.accountType === "artist") {
      return NextResponse.json({ error: "You are already an artist" }, { status: 400 });
    }

    // Upgrade to artist account
    user.accountType = "artist";
    user.artistName = artistName.trim();
    await user.save();

    return NextResponse.json({ 
      success: true, 
      message: "Successfully upgraded to artist account!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        artistName: user.artistName
      }
    });
  } catch (error) {
    console.error("Become artist error:", error);
    return NextResponse.json({ error: "Failed to upgrade account" }, { status: 500 });
  }
}
