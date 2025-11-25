"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { usePlayer } from "@/context/PlayerContext";
import { Mic, Square, Music, CheckCircle, AlertTriangle, Play, Loader2 } from "lucide-react";

// Utility function to convert AudioBuffer to WAV format
function audioBufferToWav(buffer, numberOfChannels, sampleRate) {
  try {
    const length = buffer.length * numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);

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
    const channelData = buffer.getChannelData(0);
    let offset = 44;
    
    for (let i = 0; i < channelData.length; i++) {
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      const value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, value, true);
      offset += 2;
    }

    return arrayBuffer;
  } catch (error) {
    console.error("Error in audioBufferToWav:", error);
    throw error;
  }
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
  const isProcessingRef = useRef(false); // Prevent re-entry

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
      isProcessingRef.current = false; // Reset processing flag

      // Request microphone access with optimal settings for recognition
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: 44100, // Higher initial sample rate for better quality
          channelCount: 1,   // Mono audio
          echoCancellation: false, // Disable to preserve audio fingerprint
          noiseSuppression: false, // Disable to preserve original audio
          autoGainControl: false   // Disable to preserve dynamics
        } 
      });
      streamRef.current = stream;

      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 256000
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`Audio chunk received: ${event.data.size} bytes`);
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        // Prevent re-entry
        if (isProcessingRef.current) {
          console.log("Already processing, skipping duplicate onstop call");
          return;
        }
        isProcessingRef.current = true;
        
        console.log(`Recording stopped. Chunks collected: ${audioChunksRef.current.length}`);
        
        // Check if we have any recorded data
        if (audioChunksRef.current.length === 0) {
          setError("No audio data was recorded. Please try again.");
          isProcessingRef.current = false;
          return;
        }

        // Process recorded audio
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log(`Audio blob created: ${audioBlob.size} bytes`);
        
        // Check if the blob has data
        if (audioBlob.size === 0) {
          setError("Recorded audio is empty. Please try again.");
          isProcessingRef.current = false;
          return;
        }

        try {
          // Create audio context at 22050 Hz to match backend
          const audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: 22050
          });
          const arrayBuffer = await audioBlob.arrayBuffer();
          
          // Decode audio data
          let audioBuffer;
          try {
            audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          } catch (decodeError) {
            console.error("Audio decode error:", decodeError);
            setError("Failed to process audio. Please try recording again.");
            isProcessingRef.current = false;
            return;
          }
          
          console.log(`Audio decoded: duration=${audioBuffer.duration.toFixed(2)}s, sampleRate=${audioBuffer.sampleRate}Hz`);
          
          // Resample to 22050 Hz mono to match backend exactly
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
          console.log(`Resampled buffer: length=${renderedBuffer.length}, duration=${renderedBuffer.duration.toFixed(2)}s`);
          
          // Convert to WAV format
          const wavBuffer = audioBufferToWav(renderedBuffer, 1, 22050);
          const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
          console.log(`Final WAV blob: ${wavBlob.size} bytes, duration: ${renderedBuffer.duration.toFixed(2)}s`);
          
          setAudioBlob(wavBlob);
          
          // Clean up stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }

          // Automatically recognize the song after processing
          await recognizeSongWithBlob(wavBlob);
        } catch (err) {
          console.error("Error processing audio:", err);
          setError("An error occurred while processing the audio. Please try again.");
        } finally {
          isProcessingRef.current = false;
        }
      };

      // Start recording with timeslice to ensure data is captured periodically
      // This triggers ondataavailable every 100ms
      mediaRecorderRef.current.start(100);
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
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== "recording") {
      return;
    }
    
    // Stop the media recorder
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    
    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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
    <div className="min-h-screen bg-gradient-to-br from-[#0097b2]/5 to-white dark:from-gray-900 dark:to-gray-800 text-black dark:text-white pt-20 pb-10 px-4 transition-colors">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-[#0097b2] transition-colors"
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-[#0097b2]">
            Song Recognition
          </h1>
          <p className="text-gray-600 text-lg">
            Record audio and discover what's playing
          </p>
        </motion.div>

        {/* Login Prompt (if not logged in) */}
        {!userId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-6 bg-yellow-50 rounded-2xl border border-yellow-300"
          >
            <div className="flex items-center gap-3 text-yellow-700 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="font-semibold">Login Required</p>
            </div>
            <p className="text-gray-600 text-sm">
              You're currently using the app as a guest. For full functionality, please{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-[#0097b2] hover:text-[#007a93] underline font-medium"
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
          className="bg-white dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700 shadow-lg transition-colors"
        >
          {/* Visual Indicator */}
          <div className="flex flex-col items-center mb-8">
            <motion.div
              className={`relative w-40 h-40 rounded-full flex items-center justify-center ${
                isRecording
                  ? "bg-red-500"
                  : isProcessing
                  ? "bg-[#0097b2]"
                  : "bg-gray-200 dark:bg-gray-700"
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
                    className="absolute inset-0 rounded-full border-4 border-red-400"
                    animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-red-300"
                    animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                </>
              )}

              {/* Processing rings */}
              {isProcessing && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-[#0097b2]"
                    animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-[#00b8d4]"
                    animate={{ scale: [1, 1.5, 2], opacity: [0.8, 0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  />
                </>
              )}

              {/* Microphone Icon */}
              <svg
                className={`w-20 h-20 z-10 ${isRecording || isProcessing ? 'text-white' : 'text-gray-600'}`}
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
                className="mt-4 text-2xl font-mono font-bold text-red-600"
              >
                {formatTime(recordingTime)}
              </motion.div>
            )}

            {/* Status Text */}
            <p className="mt-4 text-lg text-gray-600">
              {isRecording
                ? "Recording... Press to stop and recognize"
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
                className="w-full py-4 rounded-full bg-[#0097b2] hover:bg-[#007a93] text-white font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Mic className="w-5 h-5" />
                Start Recording
              </motion.button>
            ) : (
              <motion.button
                onClick={stopRecording}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-4 rounded-full bg-red-500 hover:bg-red-600 text-white font-bold text-lg shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Square className="w-5 h-5" />
                Stop & Recognize
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
                className="mt-6 p-4 bg-red-50 border border-red-300 rounded-xl text-red-700"
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
                  <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-2xl transition-colors">
                    {/* Main Song */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-green-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Recognized Song
                      </h3>
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors">
                        <div className="text-2xl font-bold text-black dark:text-white mb-2">
                          {result.song}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300 mb-4">
                          <span className="bg-green-100 px-3 py-1 rounded-full border border-green-300">
                            Confidence: {Math.round(result.confidence * 100)}%
                          </span>
                          <span className="bg-blue-100 px-3 py-1 rounded-full border border-blue-300">
                            Votes: {result.votes}
                          </span>
                        </div>

                        {/* Play Button */}
                        <motion.button
                          onClick={() => handlePlaySong(result.song)}
                          disabled={isLoadingSong}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="w-full py-3 rounded-xl bg-[#0097b2] hover:bg-[#007a93] text-white font-bold text-base shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        <h4 className="text-lg font-semibold text-[#0097b2] mb-3 flex items-center gap-2">
                          <Music className="w-5 h-5" />
                          Similar Songs
                        </h4>
                        <div className="space-y-2">
                          {result.similar_songs.map((song, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="text-black dark:text-white font-medium">
                                    {song.song}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
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
                                  className="p-2 rounded-full bg-[#0097b2]/10 hover:bg-[#0097b2] text-[#0097b2] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                      <div className="mt-4 text-xs text-gray-600 text-center flex items-center justify-center gap-1">
                        <Loader2 className="w-3 h-3" />
                        Processed in {result.processing_time}s
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-yellow-50 border border-yellow-300 rounded-2xl text-center">
                    <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-yellow-700 mb-2">
                      No Match Found
                    </h3>
                    <p className="text-gray-600">
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
          className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800"
        >
        </motion.div>
      </div>
    </div>
  );
}
