import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Report from "@/models/report";
import User from "@/models/user";
import { verifyAuth } from "@/lib/auth";

export async function POST(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { userId, reason, description } = await req.json();

    if (!userId || !reason) {
      return NextResponse.json({ 
        success: false, 
        message: "User ID and reason are required" 
      }, { status: 400 });
    }

    await connectDB();

    const reportedUser = await User.findById(userId);

    if (!reportedUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    // Create the report
    const report = new Report({
      reportedBy: user.userId,
      reportedUser: userId,
      reason,
      description: description || ""
    });

    await report.save();

    return NextResponse.json({ 
      success: true, 
      message: "Report submitted successfully",
      reportId: report._id
    });
  } catch (error) {
    console.error("Report user error:", error);
    return NextResponse.json({ success: false, message: "Failed to submit report" }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    // Get reports made by the current user
    const reports = await Report.find({ reportedBy: user.userId })
      .populate("reportedUser", "name userId profilePicture")
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ 
      success: true, 
      reports
    });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json({ success: false, message: "Failed to get reports" }, { status: 500 });
  }
}
