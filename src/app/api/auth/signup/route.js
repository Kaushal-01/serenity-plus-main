import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "../../../../models/user";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/jwt";
import axios from "axios";

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
  const { 
    name,
    userId, 
    email, 
    password,
    dateOfBirth, 
    gender, 
    ageGroup, 
    occupation,
    listeningHabits,
    captchaToken
  } = await req.json();
  
  // Verify CAPTCHA
  if (!captchaToken) {
    return NextResponse.json({ error: "CAPTCHA verification required" }, { status: 400 });
  }
  
  const isCaptchaValid = await verifyCaptcha(captchaToken);
  if (!isCaptchaValid) {
    return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 400 });
  }
  
  // Validate dateOfBirth
  if (!dateOfBirth) {
    return NextResponse.json({ error: "Date of birth is required" }, { status: 400 });
  }
  
  // Calculate age
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  // Validate minimum age
  if (age < 16) {
    return NextResponse.json({ error: "You must be at least 16 years old to sign up" }, { status: 400 });
  }
  
  // Validate userId
  if (!userId || userId.length < 3) {
    return NextResponse.json({ error: "User ID must be at least 3 characters" }, { status: 400 });
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
    return NextResponse.json({ error: "User ID can only contain letters, numbers, and underscores" }, { status: 400 });
  }
  
  await connectDB();

  const existing = await User.findOne({ email });
  if (existing)
    return NextResponse.json({ error: "User already exists" }, { status: 400 });

  // Check if userId is already taken
  const userIdExists = await User.findOne({ userId: userId.toLowerCase() });
  if (userIdExists)
    return NextResponse.json({ error: "User ID is already taken" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = await User.create({ 
    name,
    userId: userId.toLowerCase(), 
    email, 
    password: hashed,
    dateOfBirth: new Date(dateOfBirth),
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
}
