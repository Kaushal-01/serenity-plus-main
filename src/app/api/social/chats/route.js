import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Chat from "@/models/chat";
import User from "@/models/user";
import { getCachedUsers, cacheUsers } from "@/lib/cache";

// GET - Get all chats for current user
export async function GET(request) {
  try {
    const startTime = Date.now();
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    console.log(`[CHATS] Auth took ${Date.now() - startTime}ms`);

    const dbStart = Date.now();
    await connectDB();
    console.log(`[CHATS] DB connect took ${Date.now() - dbStart}ms`);
    
    // OPTIMIZED: Don't use populate - batch load users instead
    const queryStart = Date.now();
    const chats = await Chat.find({ 
      participants: auth.user.id 
    })
    .select('participants lastMessage createdAt clearedBy')
    .sort({ lastMessage: -1 })
    .limit(50)
    .lean();
    console.log(`[CHATS] Chat query took ${Date.now() - queryStart}ms, found ${chats?.length || 0} chats`);

    if (!chats || chats.length === 0) {
      console.log(`[CHATS] Total time: ${Date.now() - startTime}ms`);
      return NextResponse.json({ success: true, chats: [] });
    }

    // Get all unique participant IDs from all chats
    const allParticipantIds = [...new Set(
      chats.flatMap(chat => chat.participants.map(p => p.toString()))
    )];

    // Single batch query for ALL users with caching
    const userQueryStart = Date.now();
    const { cached, missing } = getCachedUsers(allParticipantIds);
    console.log(`[CHATS] Cache hit: ${cached.length}, Cache miss: ${missing.length}`);
    
    let users = [...cached];
    if (missing.length > 0) {
      const fetchedUsers = await User.find({ _id: { $in: missing } })
        .select('name userId profilePicture')
        .lean();
      cacheUsers(fetchedUsers);
      users = [...users, ...fetchedUsers];
    }
    console.log(`[CHATS] User query took ${Date.now() - userQueryStart}ms, found ${users.length} users`);

    // Create lookup map for O(1) access
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Attach user data to chats
    const validChats = chats
      .map(chat => {
        const participants = chat.participants
          .map(pId => userMap.get(pId.toString()))
          .filter(Boolean);
        
        // Only include chats with valid participants
        if (participants.length < 2) return null;

        return {
          ...chat,
          participants,
          messages: [] // Empty array to maintain API compatibility
        };
      })
      .filter(Boolean);

    console.log(`[CHATS] Total time: ${Date.now() - startTime}ms`);
    return NextResponse.json({ success: true, chats: validChats });
  } catch (error) {
    console.error("Get chats error:", error);
    return NextResponse.json({ error: "Failed to get chats" }, { status: 500 });
  }
}

// POST - Create or get chat with a user
export async function POST(request) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const { friendId } = await request.json();

    // Check if chat already exists - don't populate messages
    let chat = await Chat.findOne({
      participants: { $all: [auth.user.id, friendId] }
    })
    .select('_id participants lastMessage createdAt clearedBy')
    .populate("participants", "name userId profilePicture");

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [auth.user.id, friendId],
        messages: [],
        clearedBy: []
      });
      await chat.save();
      await chat.populate("participants", "name userId profilePicture");
    }

    // Return chat without messages - they'll be loaded separately when chat is opened
    const chatObj = chat.toObject();
    chatObj.messages = []; // Empty array to maintain API compatibility

    return NextResponse.json({ success: true, chat: chatObj });
  } catch (error) {
    console.error("Create chat error:", error);
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  }
}
