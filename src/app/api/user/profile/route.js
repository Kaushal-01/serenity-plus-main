import connectDB from "../../../../lib/db";
import User from "../../../../models/user";
import { verifyToken } from "../../../../lib/jwt";
import bcrypt from "bcryptjs";

// GET - Fetch user profile data
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
    const user = await User.findById(payload.id).select("-password");
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences || { genres: [], artists: [], isSetupComplete: false },
        favoritesCount: user.favorites?.length || 0,
        joinedAt: user._id.getTimestamp()
      }
    });
  } catch (err) {
    console.error("GET profile error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT - Update user profile
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
    const { name, currentPassword, newPassword } = body;

    await connectDB();
    const user = await User.findById(payload.id);
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Update name if provided
    if (name && name.trim()) {
      user.name = name.trim();
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      
      if (!isMatch) {
        return Response.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return Response.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    // Update localStorage user data
    const updatedUser = {
      id: user._id,
      name: user.name,
      email: user.email
    };

    return Response.json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (err) {
    console.error("PUT profile error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE - Delete user account
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
    const password = searchParams.get("password");

    if (!password) {
      return Response.json({ error: "Password required to delete account" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(payload.id);
    
    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return Response.json({ error: "Incorrect password" }, { status: 400 });
    }

    await User.findByIdAndDelete(payload.id);

    return Response.json({
      success: true,
      message: "Account deleted successfully"
    });
  } catch (err) {
    console.error("DELETE profile error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
