import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "../../../../models/user";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/jwt";

export async function POST(req) {
  const { email, password } = await req.json();
  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const token = createToken(user);
  return NextResponse.json({ success: true, token });
}
