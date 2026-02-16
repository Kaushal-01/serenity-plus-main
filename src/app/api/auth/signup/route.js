import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "../../../../models/user";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/jwt";

export async function POST(req) {
  const { 
    name, 
    email, 
    password, 
    gender, 
    ageGroup, 
    occupation,
    listeningHabits
  } = await req.json();
  
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
