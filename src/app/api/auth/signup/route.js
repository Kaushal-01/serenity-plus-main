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
    email, 
    password, 
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
  
  await connectDB();

  const existing = await User.findOne({ email });
  if (existing)
    return NextResponse.json({ error: "User already exists" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = await User.create({ 
    name, 
    email, 
    password: hashed,
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
    email: newUser.email,
    gender: newUser.gender,
    ageGroup: newUser.ageGroup,
    occupation: newUser.occupation,
    listeningHabits: newUser.listeningHabits
  };
  
  return NextResponse.json({ success: true, token, user: userResponse });
}
