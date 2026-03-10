import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "../../../../models/user";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/jwt";
import axios from "axios";
import { validateSignupData } from "@/utils/validation";

// Verify reCAPTCHA token
async function verifyCaptcha(token) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY || "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"; // Test key
  
  try {
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`
    );
    return response.data.success;
  } catch (error) {
    console.error("CAPTCHA verification error:", error);
    return false;
  }
}

export async function POST(req) {
  try {
    // Validate environment variables
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI is not configured");
      return NextResponse.json({ 
        error: "Server configuration error" 
      }, { status: 500 });
    }
    
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");
      return NextResponse.json({ 
        error: "Server configuration error" 
      }, { status: 500 });
    }
    
    const requestData = await req.json();
    
    // Verify CAPTCHA first
    if (!requestData.captchaToken) {
      return NextResponse.json({ error: "CAPTCHA verification required" }, { status: 400 });
    }
    
    const isCaptchaValid = await verifyCaptcha(requestData.captchaToken);
    if (!isCaptchaValid) {
      return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 400 });
    }
    
    // Comprehensive validation and sanitization
    const validation = validateSignupData(requestData);
    
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.errors[0] // Return first error
      }, { status: 400 });
    }
    
    const { 
      name,
      userId, 
      email, 
      password,
      dateOfBirth, 
      gender, 
      ageGroup, 
      occupation,
      listeningHabits
    } = validation.data;
    
    await connectDB();

    // Check if email already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    // Check if userId is already taken
    const userIdExists = await User.findOne({ userId });
    if (userIdExists) {
      return NextResponse.json({ error: "User ID is already taken" }, { status: 400 });
    }

    // Hash password with strong salt rounds
    const hashed = await bcrypt.hash(password, 12);
    
    const newUser = await User.create({ 
      name,
      userId, 
      email, 
      password: hashed,
      dateOfBirth,
      gender,
      ageGroup,
      occupation,
      listeningHabits
    });
    
    // Create JWT token
    const token = createToken(newUser);
    
    // Return user without password
    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      userId: newUser.userId,
      email: newUser.email,
      gender: newUser.gender,
      ageGroup: newUser.ageGroup,
      occupation: newUser.occupation,
      listeningHabits: newUser.listeningHabits
    };
    
    return NextResponse.json({ success: true, token, user: userResponse });
  } catch (error) {
    console.error("Signup error:", error);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return NextResponse.json({ 
        error: `This ${field} is already registered` 
      }, { status: 400 });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const message = Object.values(error.errors).map(e => e.message).join(', ');
      return NextResponse.json({ error: message }, { status: 400 });
    }
    
    // Generic error response
    return NextResponse.json({ 
      error: "An error occurred during signup. Please try again." 
    }, { status: 500 });
  }
}
