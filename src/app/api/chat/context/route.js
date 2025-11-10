import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import ChatContext from "@/models/chatContext";
import { verifyAuth } from "@/lib/auth";

export async function GET(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authResult.user.id;

    // Connect to database
    await dbConnect();

    // Get chat context
    const chatContext = await ChatContext.findOne({ userId });

    if (!chatContext) {
      return NextResponse.json({ 
        hasContext: false,
        message: "No previous conversations found"
      });
    }

    return NextResponse.json({
      hasContext: true,
      emotionalContext: chatContext.emotionalContext,
      lastInteraction: chatContext.lastInteraction,
      sessionCount: chatContext.sessionCount,
      recentMessages: chatContext.conversationHistory.slice(-5) // Last 5 messages
    });

  } catch (error) {
    console.error("Context retrieval error:", error);
    return NextResponse.json({ 
      error: "Failed to retrieve context" 
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authResult.user.id;
    const { action } = await request.json();

    // Connect to database
    await dbConnect();

    // Get chat context
    let chatContext = await ChatContext.findOne({ userId });

    if (!chatContext) {
      return NextResponse.json({ 
        error: "No context found" 
      }, { status: 404 });
    }

    // Handle different actions
    if (action === 'clear') {
      // Clear conversation history but keep emotional context
      chatContext.conversationHistory = [];
      await chatContext.save();
      
      return NextResponse.json({ 
        message: "Conversation cleared",
        emotionalContext: chatContext.emotionalContext
      });
    }

    if (action === 'reset') {
      // Complete reset
      await ChatContext.deleteOne({ userId });
      
      return NextResponse.json({ 
        message: "All data reset"
      });
    }

    return NextResponse.json({ 
      error: "Invalid action" 
    }, { status: 400 });

  } catch (error) {
    console.error("Context management error:", error);
    return NextResponse.json({ 
      error: "Failed to manage context" 
    }, { status: 500 });
  }
}
