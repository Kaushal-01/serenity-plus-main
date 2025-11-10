"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { usePlayer } from "@/context/PlayerContext";

// Utility function to convert AudioBuffer to WAV format
function audioBufferToWav(buffer, numberOfChannels, sampleRate) {
  const length = buffer.length * numberOfChannels * 2;
  const view = new DataView(new ArrayBuffer(44 + length));

  // Write WAV header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Write audio data
  const channelData = new Float32Array(buffer.length);
  buffer.copyFromChannel(channelData, 0, 0);
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  return view.buffer;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export default function RecognizePage() {
  const router = useRouter();
  const { playSong } = usePlayer();
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [userId, setUserId] = useState(null);
  const [isLoadingSong, setIsLoadingSong] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Check if user is logged in via the audio recognition backend
    const audioUserId = localStorage.getItem("userId"); // From audio backend login
    const storedUser = localStorage.getItem("user"); // From main app login
    
    if (audioUserId) {
      // User logged in via audio recognition system (integer ID)
      setUserId(parseInt(audioUserId));
    } else if (storedUser) {
      // User logged in via main app - need to get or create audio backend user
      const user = JSON.parse(storedUser);
      loginAudioBackend(user.name || user.username || "guest");
    } else {
      // Not logged in anywhere - create a guest user automatically
      const guestUsername = `guest_${Date.now()}`;
      loginAudioBackend(guestUsername);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Login to audio recognition backend
  const loginAudioBackend = async (username) => {
    try {
      const formData = new FormData();
      formData.append("username", username);
      const res = await axios.post("http://localhost:8000/user/login", formData);
      if (res.data?.user_id) {
        setUserId(res.data.user_id);
        localStorage.setItem("userId", res.data.user_id);
      }
    } catch (err) {
      console.error("Audio backend login error:", err);
      setError("Could not connect to audio recognition service. Make sure the backend is running on http://localhost:8000");
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      setResult(null);
      setAudioBlob(null);
      setRecordingTime(0);

      // Request microphone access with optimal settings for recognition
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 44100, // Higher initial sample rate for better quality
          channelCount: 1,   // Mono audio
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      streamRef.current = stream;

      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 256000
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        // Process recorded audio
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 22050
        });
        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Resample to 22050 Hz mono
        const offlineContext = new OfflineAudioContext({
          numberOfChannels: 1,
          length: Math.ceil(audioBuffer.duration * 22050),
          sampleRate: 22050
        });
        
        const source = offlineContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(offlineContext.destination);
        source.start();
        
        const renderedBuffer = await offlineContext.startRendering();
        const wavBuffer = audioBufferToWav(renderedBuffer, 1, 22050);
        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
        
        setAudioBlob(wavBlob);
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        // Automatically recognize the song after processing
        await recognizeSongWithBlob(wavBlob);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please grant permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const recognizeSongWithBlob = async (blob) => {
    if (!blob) {
      setError("No audio recorded. Please record audio first.");
      return;
    }

    if (!userId) {
      setError("Connecting to recognition service... Please wait and try again.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.wav");
      formData.append("user_id", userId.toString());
      formData.append("emotion", "neutral");

      const response = await axios.post("http://localhost:8000/recognize", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // The backend returns the result directly
      setResult(response.data);
    } catch (err) {
      console.error("Recognition error:", err);
      
      // Better error messages
      if (err.code === "ERR_NETWORK" || err.message.includes("Network Error")) {
        setError("Cannot connect to recognition service. Make sure the backend server is running on http://localhost:8000");
      } else {
        setError(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          "Failed to recognize song. Please try recording again with clearer audio."
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const recognizeSong = async () => {
    await recognizeSongWithBlob(audioBlob);
  };

  const handlePlaySong = async (songName) => {
    setIsLoadingSong(true);
    try {
      // Search for the song using your API
      const response = await axios.get("/api/serenity/search", {
        params: { query: songName },
      });

      if (response.data?.success && response.data?.data?.songs?.results?.length > 0) {
        const song = response.data.data.songs.results[0];
        playSong(song);
      } else {
        setError(`Could not find "${songName}" on streaming service. Try searching manually.`);
      }
    } catch (err) {
      console.error("Play song error:", err);
      setError("Failed to load song. Please try searching manually.");
    } finally {
      setIsLoadingSong(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white pt-20 pb-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Song Recognition
          </h1>
          <p className="text-gray-300 text-lg">
            Record audio and discover what's playing
          </p>
        </motion.div>

        {/* Login Prompt (if not logged in) */}
        {!userId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 bg-yellow-500/10 backdrop-blur-xl rounded-2xl border border-yellow-500/30"
          >
            <div className="flex items-center gap-3 text-yellow-300 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-semibold">Login Required</p>
            </div>
            <p className="text-gray-300 text-sm">
              You're currently using the app as a guest. For full functionality, please{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-cyan-400 hover:text-cyan-300 underline font-medium"
              >
                login here
              </button>
              . Guest mode uses a temporary account.
            </p>
          </motion.div>
        )}

        {/* Recording Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl"
        >
          {/* Visual Indicator */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              className={`relative w-40 h-40 rounded-full flex items-center justify-center ${
                isRecording
                  ? "bg-gradient-to-r from-red-500 to-pink-500"
                  : isProcessing
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500"
                  : "bg-gradient-to-r from-purple-500 to-indigo-500"
              }`}
              animate={{
                scale: isRecording || isProcessing ? [1, 1.05, 1] : 1,
                rotate: isProcessing ? [0, 360] : 0,
              }}
              transition={{
                scale: {
                  duration: 1.5,
                  repeat: isRecording || isProcessing ? Infinity : 0,
                  ease: "easeInOut",
                },
                rotate: {
                  duration: 2,
                  repeat: isProcessing ? Infinity : 0,
                  ease: "linear",
                },
              }}
            >
              {/* Pulse rings */}
              {isRecording && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-red-300"
                    animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-pink-300"
                    animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                </>
              )}

              {/* Processing rings */}
              {isProcessing && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-cyan-300"
                    animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-blue-300"
                    animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                </>
              )}

              {/* Microphone Icon */}
              <svg
                className="w-20 h-20 text-white z-10"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
            </motion.div>

            {/* Recording Time */}
            {isRecording && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-2xl font-mono font-bold text-red-400"
              >
                {formatTime(recordingTime)}
              </motion.div>
            )}

            {/* Status Text */}
            <p className="mt-4 text-lg text-gray-300">
              {isRecording
                ? "Recording... Press to stop"
                : isProcessing
                ? "Recognizing song..."
                : audioBlob
                ? "Ready to recognize again!"
                : "Press to start recording"}
            </p>
          </div>

          {/* Recording Button */}
          <div className="flex flex-col gap-4">
            {!isRecording ? (
              <motion.button
                onClick={startRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg shadow-lg shadow-purple-500/50 transition-all"
              >
                🎤 Start Recording
              </motion.button>
            ) : (
              <motion.button
                onClick={stopRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-bold text-lg shadow-lg shadow-red-500/50 transition-all"
              >
                ⏹️ Stop Recording
              </motion.button>
            )}
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300"
              >
                <p className="text-center">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result Display */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-6"
              >
                {result.status === "success" ? (
                  <div className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-2xl">
                    {/* Main Song */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-green-300 mb-3">
                        ✅ Recognized Song
                      </h3>
                      <div className="bg-white/5 p-4 rounded-xl">
                        <div className="text-2xl font-bold text-white mb-2">
                          {result.song}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-300 mb-4">
                          <span className="bg-green-500/20 px-3 py-1 rounded-full">
                            Confidence: {Math.round(result.confidence * 100)}%
                          </span>
                          <span className="bg-blue-500/20 px-3 py-1 rounded-full">
                            Votes: {result.votes}
                          </span>
                        </div>

                        {/* Play Button */}
                        <motion.button
                          onClick={() => handlePlaySong(result.song)}
                          disabled={isLoadingSong}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-base shadow-lg shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoadingSong ? (
                            <>
                              <svg
                                className="animate-spin h-5 w-5"
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                              Loading Song...
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-6 h-6"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                              Play Song
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    {/* Similar Songs */}
                    {result.similar_songs && result.similar_songs.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-purple-300 mb-3">
                          🎵 Similar Songs
                        </h4>
                        <div className="space-y-2">
                          {result.similar_songs.map((song, index) => (
                            <div
                              key={index}
                              className="bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="text-white font-medium">
                                    {song.song}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                    <span>
                                      {Math.round(song.confidence * 100)}% match
                                    </span>
                                    <span>•</span>
                                    <span>{song.votes} votes</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handlePlaySong(song.song)}
                                  disabled={isLoadingSong}
                                  className="p-2 rounded-full bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Play this song"
                                >
                                  <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Processing Time */}
                    {result.processing_time && (
                      <div className="mt-4 text-xs text-gray-400 text-center">
                        ⚡ Processed in {result.processing_time}s
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl text-center">
                    <div className="text-4xl mb-3">⚠️</div>
                    <h3 className="text-xl font-bold text-yellow-300 mb-2">
                      No Match Found
                    </h3>
                    <p className="text-gray-300">
                      Try recording again with clearer audio or a longer sample
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center text-gray-400 text-sm"
        >
          <p>📱 Make sure your device has microphone access enabled</p>
          <p className="mt-2">
            🎵 Record at least 5-10 seconds of audio for best results
          </p>
        </motion.div>
      </div>
    </div>
  );
}
