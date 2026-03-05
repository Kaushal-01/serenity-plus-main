import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import User from "@/models/user";

// PUT - Update user profile
export async function PUT(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const updates = await request.json();
    const user = await User.findById(auth.user.id);

    // Validate profile picture format (server-side)
    if (updates.profilePicture && updates.profilePicture !== user.profilePicture) {
      // Check if it's a base64 image
      if (updates.profilePicture.startsWith('data:image/')) {
        const imageFormat = updates.profilePicture.split(';')[0].split('/')[1];
        const allowedFormats = ['jpeg', 'jpg', 'png'];
        if (!allowedFormats.includes(imageFormat.toLowerCase())) {
          return NextResponse.json({ 
            error: "Only JPEG, JPG, and PNG image formats are allowed" 
          }, { status: 400 });
        }
      }
    }

    // Handle userId change (no time restriction)
    if (updates.userId && updates.userId !== user.userId) {
      // Validate userId format
      if (updates.userId.length < 3) {
        return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
      }
      
      if (!/^[a-zA-Z0-9_]+$/.test(updates.userId)) {
        return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores" }, { status: 400 });
      }
      
      // Check if userId is already taken
      const existingUser = await User.findOne({ userId: updates.userId.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 });
      }

      user.userId = updates.userId.toLowerCase();
      user.userIdLastChanged = new Date();
    }

    // Update other fields
    if (updates.profilePicture !== undefined) user.profilePicture = updates.profilePicture;
    if (updates.accountType) user.accountType = updates.accountType;
    if (updates.bio !== undefined) user.bio = updates.bio;
    if (updates.favoriteArtists) user.favoriteArtists = updates.favoriteArtists;
    if (updates.favoriteGenres) user.favoriteGenres = updates.favoriteGenres;
    if (updates.artistName !== undefined) user.artistName = updates.artistName;
    if (updates.name) user.name = updates.name;

    await user.save();

    // Update localStorage user data
    const updatedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      userId: user.userId,
      profilePicture: user.profilePicture,
      accountType: user.accountType
    };

    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

// GET - Get full user profile
export async function GET(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(auth.user.id)
      .select("-password");

    return NextResponse.json({ 
      success: true, 
      user: user
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return NextResponse.json({ error: "Failed to get profile" }, { status: 500 });
  }
}
