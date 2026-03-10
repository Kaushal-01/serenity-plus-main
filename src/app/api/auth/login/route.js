import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "../../../../models/user";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/jwt";
import axios from "axios";
import { validateLoginData } from "@/utils/validation";

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
    const validation = validateLoginData(requestData);
    
    if (!validation.valid) {
      return NextResponse.json({ 
        error: validation.errors[0] // Return first error
      }, { status: 400 });
    }
    
    const { email, password } = validation.data;
    
    await connectDB();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Use generic error message to prevent email enumeration
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Verify password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Create JWT token
    const token = createToken(user);
    
    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ 
      error: "An error occurred during login. Please try again." 
    }, { status: 500 });
  }
}
