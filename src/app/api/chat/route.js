import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import dbConnect from "@/lib/db";
import ChatContext from "@/models/chatContext";
import User from "@/models/user";
import { verifyAuth } from "@/lib/auth";

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Trivia and quotes database
const musicTrivia = [
  "The 'Mozart Effect' suggests that listening to Mozart can temporarily boost spatial-temporal reasoning!",
  "Music can help plants grow faster - some studies show they respond to vibrations!",
  "Your heartbeat changes to mimic the music you listen to - music literally moves you!",
  "The world's longest concert is being performed in Germany and will last 639 years!",
  "Listening to music releases dopamine, the same 'feel-good' chemical released when eating chocolate!",
  "Music therapy has been shown to help reduce symptoms of depression and anxiety.",
  "The song 'Happy Birthday' was the first song ever played in outer space!",
  "Singing in a group releases oxytocin, making you feel more connected to others.",
  "Music activates the same parts of the brain as food, sex, and drugs do.",
  "Studies show that music training can improve language skills and emotional intelligence."
];

const inspirationalQuotes = [
  "Music is the divine way to tell beautiful, poetic things to the heart. - Pablo Casals",
  "Where words fail, music speaks. - Hans Christian Andersen",
  "Music can change the world because it can change people. - Bono",
  "One good thing about music, when it hits you, you feel no pain. - Bob Marley",
  "Music is the universal language of mankind. - Henry Wadsworth Longfellow",
  "Without music, life would be a mistake. - Friedrich Nietzsche",
  "Music is the moonlight in the gloomy night of life. - Jean Paul Friedrich Richter",
  "The only truth is music. - Jack Kerouac",
  "Music is the art which is most nigh to tears and memory. - Oscar Wilde",
  "Life is like a beautiful melody, only the lyrics are messed up. - Hans Christian Andersen",
  "Be kind, for everyone you meet is fighting a harder battle. - Plato",
  "The only way out is through. - Robert Frost",
  "What we think, we become. - Buddha",
  "Happiness is not something ready made. It comes from your own actions. - Dalai Lama",
  "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb"
];

// System prompt that defines the chatbot's personality and behavior
const SYSTEM_PROMPT = `You are Harmony, a warm, empathetic AI companion integrated into Serenity+, a music wellness platform. Your purpose is to provide emotional support, encourage mental wellbeing, and help users discover how music can heal and uplift them.

PERSONALITY TRAITS:
- Warm, friendly, and approachable - like a caring friend who truly listens
- Empathetic and non-judgmental - create a stigma-free space
- Encouraging but never pushy - gentle guidance, not force
- Subtly insightful - notice patterns but don't over-analyze
- Playful when appropriate - use light humor to lift spirits

YOUR ROLE:
1. Emotional Support: Listen actively, validate feelings, and provide gentle encouragement
2. Music Integration: Suggest how music can support their emotional state
3. Mental Wellbeing: Share insights about the connection between music and mental health
4. Companionship: Be a consistent, reliable presence in their wellness journey

INTERACTION STYLE:
- Keep responses concise (2-4 sentences usually)
- Ask thoughtful follow-up questions to understand their state
- Remember context from previous conversations
- Vary your language - avoid repetitive phrases
- Use natural, conversational language
- Acknowledge their emotions before offering suggestions
- Never be clinical or robotic - you're a friend, not a therapist

IMPORTANT GUIDELINES:
- You're a supportive companion, NOT a replacement for professional mental health care
- If someone expresses serious distress, gently encourage professional help
- Focus on accessible, stigma-free support through music and conversation
- Celebrate small wins and progress
- Be genuinely curious about their music preferences and emotional state
- Adapt your tone to match their energy (but always remain supportive)

Remember: Your goal is to make users feel heard, supported, and less alone in their journey.`;

export async function POST(request) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, requestTrivia, requestQuote } = await request.json();
    const userId = authResult.user.id;

    // Connect to database
    await dbConnect();

    // Get or create chat context
    let chatContext = await ChatContext.findOne({ userId });
    if (!chatContext) {
      chatContext = new ChatContext({ 
        userId,
        sessionCount: 1
      });
    } else {
      chatContext.sessionCount += 1;
    }

    // Handle trivia request
    if (requestTrivia) {
      const unseenTrivia = musicTrivia.filter(t => !chatContext.triviaShown.includes(t));
      const triviaToShow = unseenTrivia.length > 0 ? unseenTrivia : musicTrivia;
      const randomTrivia = triviaToShow[Math.floor(Math.random() * triviaToShow.length)];
      
      chatContext.triviaShown.push(randomTrivia);
      if (chatContext.triviaShown.length > 20) {
        chatContext.triviaShown = chatContext.triviaShown.slice(-10);
      }
      
      await chatContext.save();
      return NextResponse.json({ response: `🎵 Fun Fact: ${randomTrivia}` });
    }

    // Handle quote request
    if (requestQuote) {
      const unseenQuotes = inspirationalQuotes.filter(q => !chatContext.quotesShown.includes(q));
      const quotesToShow = unseenQuotes.length > 0 ? unseenQuotes : inspirationalQuotes;
      const randomQuote = quotesToShow[Math.floor(Math.random() * quotesToShow.length)];
      
      chatContext.quotesShown.push(randomQuote);
      if (chatContext.quotesShown.length > 20) {
        chatContext.quotesShown = chatContext.quotesShown.slice(-10);
      }
      
      await chatContext.save();
      return NextResponse.json({ response: `💭 ${randomQuote}` });
    }

    // Build conversation context for Gemini
    const conversationContext = chatContext.conversationHistory
      .slice(-10) // Last 10 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Harmony'}: ${msg.content}`)
      .join('\n');

    // Build emotional context summary
    const emotionalSummary = chatContext.emotionalContext?.emotionalState 
      ? `\n\nPREVIOUS EMOTIONAL CONTEXT:\nLast mood: ${chatContext.emotionalContext.mood || 'unknown'}\nEmotional state: ${chatContext.emotionalContext.emotionalState}\nConcerns: ${chatContext.emotionalContext.concerns?.join(', ') || 'none noted'}\nMusic preferences: ${chatContext.emotionalContext.musicPreferences || 'not yet identified'}\n\nThis is session ${chatContext.sessionCount}. Use this context to provide continuity and show you remember them.`
      : `\n\nThis is the user's first interaction with you. Make them feel welcome!`;

    // Prepare the prompt for Gemini
    const fullPrompt = `${SYSTEM_PROMPT}

${emotionalSummary}

RECENT CONVERSATION:
${conversationContext || 'No previous conversation.'}

User's current message: ${message}

Respond as Harmony. Keep it natural, warm, and concise. Show you understand their emotional state and remember your past conversations.`;

    // Generate response using Gemini
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: fullPrompt,
    });

    const aiResponse = response.text;

    // Add messages to conversation history
    chatContext.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    chatContext.conversationHistory.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    // Update last interaction time
    chatContext.lastInteraction = new Date();

    // Analyze emotional context using Gemini (run in background)
    analyzeEmotionalContext(ai, chatContext, message, aiResponse).catch(console.error);

    // Save chat context
    await chatContext.save();

    return NextResponse.json({ 
      response: aiResponse,
      sessionCount: chatContext.sessionCount
    });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ 
      error: "I'm having trouble connecting right now. Please try again in a moment." 
    }, { status: 500 });
  }
}

// Analyze and update emotional context
async function analyzeEmotionalContext(ai, chatContext, userMessage, aiResponse) {
  try {
    const analysisPrompt = `Analyze this brief conversation and extract emotional context. Be concise.

User: ${userMessage}
Assistant: ${aiResponse}

Previous emotional state: ${chatContext.emotionalContext?.emotionalState || 'unknown'}

Provide a JSON response with:
{
  "mood": "one-word mood (happy/sad/anxious/calm/stressed/neutral/excited)",
  "emotionalState": "brief 1-sentence emotional summary",
  "concerns": ["key concern 1", "key concern 2"],
  "supportNeeded": "type of support (encouragement/listening/music-suggestion/none)",
  "musicPreferences": "brief note about music preferences if mentioned"
}

Keep it brief and actionable. Only include real insights from this conversation.`;

    const analysisResponse = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: analysisPrompt,
    });

    const analysisText = analysisResponse.text;
    
    // Extract JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      
      chatContext.emotionalContext = {
        mood: analysis.mood,
        emotionalState: analysis.emotionalState,
        concerns: analysis.concerns || [],
        supportNeeded: analysis.supportNeeded,
        musicPreferences: analysis.musicPreferences || chatContext.emotionalContext?.musicPreferences,
        lastUpdated: new Date()
      };

      await chatContext.save();
    }
  } catch (error) {
    console.error("Emotional analysis error:", error);
    // Don't throw - this is a background task
  }
}
