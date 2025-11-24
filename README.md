# 🎵 Serenity Plus

**Serenity Plus** is an AI-powered music streaming and wellness platform that combines personalized music recommendations with mental health support through intelligent conversations. The platform offers mood-based music discovery, audio recognition, playlist management, and an AI chatbot that provides emotional support and music therapy.

> **⚠️ EDUCATIONAL PROJECT DISCLAIMER**  
> This project is developed **solely for educational and learning purposes** as part of my personal journey to learn web development, AI integration, and full-stack technologies. It is **NOT intended for commercial use, distribution, or production deployment**. All third-party APIs and services are used under their respective terms and conditions for educational purposes only. This project is not affiliated with or endorsed by JioSaavn, Google, or any other service mentioned.

---

## ✨ Features

### 🎼 Music Streaming & Discovery
- **Global Search**: Search for songs, albums, artists, and playlists across the JioSaavn library
- **Mood-Based Recommendations**: Get music suggestions based on your current emotional state (Happy, Sad, Calm, Angry)
- **Personalized Dashboard**: Featured albums, recommended songs, and mood-based collections
- **Smart Music Player**: Full-featured audio player with play/pause, skip, shuffle, and volume control
- **Favorites Management**: Save and organize your favorite songs
- **Custom Playlists**: Create, edit, and manage personal playlists

### 🎙️ Audio Recognition
- **Song Identification**: Identify songs by recording audio snippets
- **Real-time Audio Processing**: Advanced audio recognition capabilities
- **Quick Access Button**: Floating button for instant song recognition

### 🤖 AI-Powered Wellness Chatbot (SerenityAI)
- **Emotional Support**: Contextual conversations about feelings and mental well-being
- **Music Therapy**: AI recommends songs based on emotional state and preferences
- **Conversation Memory**: Persistent chat context across sessions
- **Personalized Interactions**: Adapts responses based on user history and preferences
- **Google Gemini Integration**: Powered by advanced AI for natural conversations

### 👤 User Management
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **User Profiles**: Personalized user accounts with preferences
- **Onboarding Flow**: Genre and artist preference setup for new users
- **Session Management**: Secure token-based session handling

### 🎨 Modern UI/UX
- **Responsive Design**: Fully responsive interface for all devices
- **Smooth Animations**: Framer Motion animations for enhanced user experience
- **GSAP Effects**: Advanced animations and transitions
- **Modern Styling**: Tailwind CSS v4 for beautiful, consistent design
- **Dark Mode Support**: Theme customization with Lucide React icons

---

## 🛠️ Tech Stack

### Frontend
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library
- **[GSAP](https://greensock.com/gsap/)** - Professional-grade animation
- **[Lucide React](https://lucide.dev/)** - Modern icon library
- **[Axios](https://axios-http.com/)** - HTTP client for API requests

### Backend
- **[Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)** - Serverless API endpoints
- **[MongoDB](https://www.mongodb.com/)** - NoSQL database
- **[Mongoose](https://mongoosejs.com/)** - MongoDB object modeling
- **[JWT](https://jwt.io/)** (jsonwebtoken) - Secure authentication tokens
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js)** - Password hashing

### AI & External APIs
- **[Google Generative AI (Gemini)](https://ai.google.dev/)** - AI chatbot and conversation
- **[JioSaavn API](https://saavn.sumit.co/)** - Music streaming data
- **Audio Recognition APIs** - Song identification service

### Development Tools
- **Babel React Compiler** - Optimized React compilation
- **PostCSS** - CSS transformation

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm
- MongoDB database (local or cloud)
- Google Gemini API key
- JioSaavn API access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Kaushal-01/serenity-plus-main.git
   cd serenity-plus-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📁 Project Structure

```
serenity-plus-main/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── chat/          # AI chatbot endpoints
│   │   │   ├── serenity/      # Music API endpoints
│   │   │   └── user/          # User management endpoints
│   │   ├── dashboard/         # Main dashboard
│   │   ├── favorites/         # Favorites page
│   │   ├── playlists/         # Playlist management
│   │   ├── profile/           # User profile
│   │   ├── recognize/         # Audio recognition
│   │   └── ...
│   ├── components/            # React components
│   │   ├── AudioRecognitionButton.jsx
│   │   ├── ChatBot.jsx
│   │   ├── Navbar.jsx
│   │   ├── PlayerDemo.jsx
│   │   └── SongCard.jsx
│   ├── context/               # React Context providers
│   │   ├── PlayerContext.jsx
│   │   └── MiniPlayer.jsx
│   ├── lib/                   # Utility libraries
│   │   ├── auth.js
│   │   ├── db.js
│   │   └── jwt.js
│   ├── models/                # MongoDB models
│   │   ├── user.js
│   │   └── chatContext.js
│   └── hooks/                 # Custom React hooks
│       └── useTheme.js
├── public/                    # Static assets
├── package.json
└── next.config.mjs
```

---

## 🎯 Key Functionality

### Authentication Flow
1. Users sign up with name, email, and password
2. Passwords are hashed using bcryptjs
3. JWT tokens are generated for session management
4. Protected routes verify token validity

### Music Recommendation System
1. User selects mood or completes preference onboarding
2. System fetches personalized recommendations
3. AI chatbot can suggest songs based on conversation
4. Favorites and listening history influence future recommendations

### AI Chatbot Interaction
1. User opens chat interface
2. Context is loaded from previous sessions
3. AI responds with empathy and music suggestions
4. Conversation context is saved to MongoDB
5. Google Gemini processes natural language understanding

### Audio Recognition
1. User clicks microphone button
2. Audio is recorded from device
3. Audio fingerprint is sent to recognition API
4. Matching song details are returned
5. User can play or add song to favorites

---

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Protected API Routes**: Token verification middleware
- **Environment Variables**: Sensitive data in .env files
- **Input Validation**: Server-side validation for all inputs

---

## 📦 Build & Deploy

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Deploy to Vercel
The easiest way to deploy is using the [Vercel Platform](https://vercel.com/):

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License & Legal

**Educational Use Only**: This project is created for educational and learning purposes. It is not intended for commercial use or public distribution.

**Third-Party APIs**: This project uses third-party APIs (JioSaavn, Google Gemini) for educational purposes. Users must comply with the terms of service of these platforms. The developer assumes no liability for misuse.

**No Warranty**: This software is provided "as is", without warranty of any kind. Use at your own risk.

**Learning Project**: This is a personal project to demonstrate and learn full-stack development, AI integration, and modern web technologies.

---

## 👨‍💻 Developer

**Kaushal**
- GitHub: [@Kaushal-01](https://github.com/Kaushal-01)

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [JioSaavn API](https://saavn.sumit.co/) - Music streaming data
- [Google Gemini](https://ai.google.dev/) - AI capabilities
- [MongoDB](https://www.mongodb.com/) - Database solution
- [Vercel](https://vercel.com/) - Deployment platform

---

Made with ❤️ and 🎵
