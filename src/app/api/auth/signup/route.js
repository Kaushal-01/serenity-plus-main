import connectDB from "@/lib/db";
import User from "../../../../models/user";
import bcrypt from "bcryptjs";

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
    return Response.json({ error: "User already exists" }, { status: 400 });

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
  
  return Response.json({ success: true, user: newUser });
}
