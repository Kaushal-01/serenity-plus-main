import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import connectDB from "@/lib/db";
import Chat from "@/models/chat";
import { getCachedUsers, cacheUsers } from "@/lib/cache";

export async function GET(request, context) {
  try {
    const startTime = Date.now();
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    console.log(`[CHAT_ID] Auth took ${Date.now() - startTime}ms`);

    const dbStart = Date.now();
    await connectDB();
    console.log(`[CHAT_ID] DB connect took ${Date.now() - dbStart}ms`);
    
    const { chatId } = await context.params;

    // Use aggregation to limit messages at DB level for maximum speed
    const aggStart = Date.now();
    const chatData = await Chat.aggregate([
      { $match: { _id: new (await import("mongoose")).default.Types.ObjectId(chatId) } },
      {
        $project: {
          participants: 1,
          clearedBy: 1,
          lastMessage: 1,
          createdAt: 1,
          // Only get last 50 messages directly from DB
          messages: { $slice: ["$messages", -50] }
        }
      }
    ]);
    console.log(`[CHAT_ID] Aggregation took ${Date.now() - aggStart}ms`);

    if (!chatData || chatData.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const chat = chatData[0];

    // Verify user is participant
    const isParticipant = chat.participants.some(p => p.toString() === auth.user.id);
    if (!isParticipant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Filter messages based on cleared time (fast in-memory operation on only 50 messages)
    const userCleared = chat.clearedBy?.find(c => c.user.toString() === auth.user.id);
    const clearedTime = userCleared ? new Date(userCleared.clearedAt) : new Date(0);
    
    const filteredMessages = chat.messages.filter(msg => new Date(msg.createdAt) > clearedTime);

    // Get unique user IDs
    const messageUserIds = filteredMessages.map(m => m.sender.toString());
    const allUserIds = [...new Set([...chat.participants.map(p => p.toString()), ...messageUserIds])];
    
    // Single batch query for all users with caching
    const userQueryStart = Date.now();
    const { cached, missing } = getCachedUsers(allUserIds);
    console.log(`[CHAT_ID] Cache hit: ${cached.length}, Cache miss: ${missing.length}`);
    
    let users = [...cached];
    if (missing.length > 0) {
      const User = (await import("@/models/user")).default;
      const fetchedUsers = await User.find({ _id: { $in: missing } })
        .select("name userId profilePicture")
        .lean();
      cacheUsers(fetchedUsers);
      users = [...users, ...fetchedUsers];
    }
    console.log(`[CHAT_ID] User query took ${Date.now() - userQueryStart}ms, found ${users.length} users`);
    
    // Map for O(1) lookups
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Build response
    const participants = chat.participants
      .map(pId => userMap.get(pId.toString()))
      .filter(Boolean);
      
    const messages = filteredMessages.map(msg => {
      const message = {
        ...msg,
        sender: userMap.get(msg.sender.toString()) || null
      };
      
      // Strip bloated sharedContent.data field (can be 100KB+) - keep only essentials
      if (message.sharedContent?.data) {
        // Clean downloadUrl - remove base64 audio
        let cleanDownloadUrl = message.sharedContent.data.downloadUrl;
        if (Array.isArray(cleanDownloadUrl)) {
          cleanDownloadUrl = cleanDownloadUrl
            .map(item => {
              if (typeof item === 'string') {
                return item.startsWith('data:') ? null : item;
              }
              if (item?.url) {
                return item.url.startsWith('data:') ? null : { url: item.url, quality: item.quality };
              }
              return null;
            })
            .filter(Boolean);
        } else if (typeof cleanDownloadUrl === 'string' && cleanDownloadUrl.startsWith('data:')) {
          cleanDownloadUrl = null;
        }
        
        const { data, ...sharedContentWithoutData } = message.sharedContent;
        message.sharedContent = {
          ...sharedContentWithoutData,
          // Keep only essential fields from data
          data: data ? {
            artist: data.artist,
            url: data.url,
            downloadUrl: cleanDownloadUrl, // Sanitized
            artists: data.artists,
            primaryArtists: data.primaryArtists,
            duration: data.duration,
            album: data.album,
            year: data.year
          } : undefined
        };
      }
      
      return message;
    });

    console.log(`[CHAT_ID] Total time: ${Date.now() - startTime}ms`);
    return NextResponse.json({ 
      success: true, 
      chat: {
        _id: chat._id,
        participants,
        messages,
        lastMessage: chat.lastMessage,
        createdAt: chat.createdAt,
        clearedBy: chat.clearedBy
      }
    });
  } catch (error) {
    console.error("Get chat error:", error);
    return NextResponse.json({ error: "Failed to get chat" }, { status: 500 });
  }
}

export async function POST(request, context) {
  try {
    console.log("[CHAT POST] Request received");
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const { chatId } = await context.params;
    const body = await request.json();
    console.log("[CHAT POST] Request body:", JSON.stringify(body, null, 2));
    const { content, messageType, sharedContent } = body;

    // Validate message length (500 character limit)
    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ error: "Message too long. Maximum 500 characters allowed" }, { status: 400 });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Verify user is participant
    if (!chat.participants.some(p => p.toString() === auth.user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Sanitize sharedContent to prevent storing massive data objects (100KB+)
    // CRITICAL: Artist-uploaded songs often have base64-encoded MP3 files in downloadUrl
    // Storing these causes 3-second query delays due to document size (275KB per message!)
    // Solution: Strip base64, store only HTTP URLs. Audio is loaded on-demand when user plays.
    let sanitizedSharedContent = null;
    if (sharedContent) {
      // Clean downloadUrl - remove base64 audio data
      let cleanDownloadUrl = null;
      let strippedBase64 = false;
      if (sharedContent.data?.downloadUrl) {
        if (Array.isArray(sharedContent.data.downloadUrl)) {
          // Filter out base64 audio - only keep HTTP URLs
          cleanDownloadUrl = sharedContent.data.downloadUrl
            .map(item => {
              if (typeof item === 'string') {
                // Skip base64 data URLs
                if (item.startsWith('data:')) {
                  strippedBase64 = true;
                  return null;
                }
                return item;
              }
              if (item?.url) {
                // Skip base64 data URLs in objects
                if (item.url.startsWith('data:')) {
                  strippedBase64 = true;
                  return null;
                }
                return { url: item.url, quality: item.quality };
              }
              return null;
            })
            .filter(Boolean);
          
          // If array is empty after filtering, set to null
          if (cleanDownloadUrl.length === 0) {
            cleanDownloadUrl = null;
          }
        } else if (typeof sharedContent.data.downloadUrl === 'string') {
          // Skip if it's base64
          if (sharedContent.data.downloadUrl.startsWith('data:')) {
            strippedBase64 = true;
            cleanDownloadUrl = null;
          } else {
            cleanDownloadUrl = sharedContent.data.downloadUrl;
          }
        }
      }
      
      if (strippedBase64) {
        console.log(`[CHAT] Stripped base64 audio from ${messageType || 'message'} to prevent DB bloat`);
      }
      
      sanitizedSharedContent = {
        type: sharedContent.type,
        id: sharedContent.id,
        name: sharedContent.name,
        image: sharedContent.image,
        // Only store essential fields - NO binary data
        data: sharedContent.data ? {
          artist: sharedContent.data.artist,
          duration: sharedContent.data.duration,
          url: sharedContent.data.url,
          downloadUrl: cleanDownloadUrl,
          artists: sharedContent.data.artists,
          primaryArtists: sharedContent.data.primaryArtists,
          album: sharedContent.data.album,
          year: sharedContent.data.year
        } : undefined
      };
      
      // Validate total size
      const contentSize = JSON.stringify(sanitizedSharedContent).length;
      if (contentSize > 10000) { // 10KB limit
        console.warn(`[CHAT] Large sharedContent detected: ${contentSize} bytes, stripping data`);
        sanitizedSharedContent.data = undefined;
      }
    }

    const message = {
      sender: auth.user.id,
      content,
      messageType: messageType || "text",
      sharedContent: sanitizedSharedContent,
      createdAt: new Date()
    };

    console.log("[CHAT POST] About to save message:", JSON.stringify(message, null, 2));
    chat.messages.push(message);
    chat.lastMessage = new Date();
    await chat.save();
    console.log("[CHAT POST] Message saved successfully");

    // Get newly created message with sender info
    const User = (await import("@/models/user")).default;
    const sender = await User.findById(auth.user.id)
      .select("name userId profilePicture")
      .lean();

    const newMessage = {
      ...message,
      sender: sender,
      _id: chat.messages[chat.messages.length - 1]._id
    };

    // Return just the new message, not the entire chat
    return NextResponse.json({ 
      success: true, 
      message: newMessage
    });
  } catch (error) {
    console.error("Send message error:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json({ 
      error: "Failed to send message", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const { chatId } = await context.params;
    const { action } = await request.json();

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Verify user is participant
    if (!chat.participants.some(p => p.toString() === auth.user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (action === "clear") {
      // Mark chat as cleared for this user only (don't delete messages for other user)
      
      // Initialize clearedBy if it doesn't exist
      if (!chat.clearedBy) {
        chat.clearedBy = [];
      }
      
      const existingClearIndex = chat.clearedBy.findIndex(c => c.user.toString() === auth.user.id);
      const clearTimestamp = new Date();
      
      if (existingClearIndex >= 0) {
        // Update existing clear timestamp
        chat.clearedBy[existingClearIndex].clearedAt = clearTimestamp;
      } else {
        // Add new clear entry
        chat.clearedBy.push({
          user: auth.user.id,
          clearedAt: clearTimestamp
        });
      }
      
      // Update lastMessage to current time so chat appears at top of list
      chat.lastMessage = clearTimestamp;
      
      await chat.save();

      // Return chat with filtered messages (empty since user just cleared)
      const updatedChat = await Chat.findById(chatId)
        .populate("participants", "name userId profilePicture")
        .populate("messages.sender", "name userId profilePicture");
      
      // Filter messages to show only those after clear timestamp
      const chatObj = updatedChat.toObject();
      chatObj.messages = [];

      return NextResponse.json({ 
        success: true, 
        message: "Chat cleared successfully",
        chat: chatObj
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Clear chat error:", error);
    return NextResponse.json({ error: "Failed to clear chat" }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const auth = await verifyAuth(request);
    if (!auth.authenticated) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    await connectDB();
    const { chatId } = await context.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Verify user is participant
    if (!chat.participants.some(p => p.toString() === auth.user.id)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the entire chat
    await Chat.findByIdAndDelete(chatId);

    return NextResponse.json({ 
      success: true, 
      message: "Chat deleted successfully"
    });
  } catch (error) {
    console.error("Delete chat error:", error);
    return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 });
  }
}
