"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import { Upload, Music, Image as ImageIcon, FileAudio, ArrowLeft } from "lucide-react";

export default function ArtistUploadPage() {
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    songName: "",
    artistName: "",
    musicBy: "",
    genre: "",
    description: "",
    coverPhoto: "",
    audioFile: "",
    duration: 0
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    checkArtistStatus();
  }, []);

  const checkArtistStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/user/update-profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setUser(res.data.user);
        if (res.data.user.accountType !== "artist") {
          router.push("/profile");
          alert("Please switch to Artist account type first");
        }
        setFormData({
          ...formData,
          artistName: res.data.user.artistName || res.data.user.name
        });
      }
    } catch (err) {
      console.error("Check artist status error:", err);
    }
  };

  const handleCoverPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file format (only JPEG, JPG, PNG)
      const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedFormats.includes(file.type.toLowerCase())) {
        setMessage({ type: "error", text: "Only JPEG, JPG, and PNG image formats are allowed" });
        e.target.value = ''; // Reset file input
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "Cover photo must be less than 5MB" });
        e.target.value = ''; // Reset file input
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, coverPhoto: reader.result });
        setMessage({ type: "success", text: "Cover photo uploaded successfully" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file format (only MP3)
      if (file.type !== 'audio/mpeg' && file.type !== 'audio/mp3' && !file.name.endsWith('.mp3')) {
        setMessage({ type: "error", text: "Only MP3 audio files are allowed" });
        e.target.value = ''; // Reset file input
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) {
        setMessage({ type: "error", text: "Audio file must be less than 50MB" });
        e.target.value = ''; // Reset file input
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, audioFile: reader.result });
        
        // Get audio duration
        const audio = new Audio(reader.result);
        audio.onloadedmetadata = () => {
          setFormData(prev => ({ ...prev, duration: Math.floor(audio.duration) }));
          setMessage({ type: "success", text: `Audio file uploaded successfully (${Math.floor(audio.duration)}s)` });
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!formData.songName || !formData.artistName || !formData.musicBy || !formData.coverPhoto || !formData.audioFile) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const uploadFormData = new FormData();
      uploadFormData.append("songName", formData.songName);
      uploadFormData.append("artistName", formData.artistName);
      uploadFormData.append("musicBy", formData.musicBy);
      uploadFormData.append("coverPhoto", formData.coverPhoto);
      uploadFormData.append("audioFile", formData.audioFile);
      uploadFormData.append("duration", formData.duration);
      uploadFormData.append("genre", formData.genre);
      uploadFormData.append("description", formData.description);

      const res = await axios.post("/api/artist/songs", uploadFormData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setMessage({ type: "success", text: "Song uploaded successfully!" });
        // Reset form
        setFormData({
          songName: "",
          artistName: user.artistName || user.name,
          musicBy: "",
          genre: "",
          description: "",
          coverPhoto: "",
          audioFile: "",
          duration: 0
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to upload song" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => router.push("/profile")}
            className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#0097b2] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Profile
          </button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0097b2] to-[#00b8d4] bg-clip-text text-transparent mb-2">
            Upload Your Music
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Share your original songs with the Serenity community</p>
        </motion.div>

        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl ${
              message.type === "success"
                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-300 dark:border-green-700"
                : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-2 border-red-300 dark:border-red-700"
            }`}
          >
            {message.text}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cover Photo */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-6 h-6 text-[#0097b2]" />
              Cover Photo *
            </h2>
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center overflow-hidden">
                {formData.coverPhoto ? (
                  <img src={formData.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <div>
                <label className="px-4 py-2 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-lg cursor-pointer transition-all inline-block">
                  Choose Cover Photo
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleCoverPhotoUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Max size: 5MB (JPEG, JPG, PNG only)</p>
              </div>
            </div>
          </motion.div>

          {/* Audio File */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileAudio className="w-6 h-6 text-[#0097b2]" />
              Audio File *
            </h2>
            <div>
              <label className="px-4 py-2 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-lg cursor-pointer transition-all inline-block">
                Choose Audio File (.mp3 only)
                <input
                  type="file"
                  accept="audio/mpeg,audio/mp3,.mp3"
                  onChange={handleAudioUpload}
                  className="hidden"
                />
              </label>
              {formData.audioFile && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  ✓ Audio file uploaded ({formData.duration}s)
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Max size: 50MB (MP3 format only)</p>
            </div>
          </motion.div>

          {/* Song Details */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Song Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Song Name *
                </label>
                <input
                  type="text"
                  value={formData.songName}
                  onChange={(e) => setFormData({ ...formData, songName: e.target.value })}
                  placeholder="Enter song name"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Artist Name *
                </label>
                <input
                  type="text"
                  value={formData.artistName}
                  onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                  placeholder="Your artist name"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Music By *
                </label>
                <input
                  type="text"
                  value={formData.musicBy}
                  onChange={(e) => setFormData({ ...formData, musicBy: e.target.value })}
                  placeholder="Composer/Producer name"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Genre
                </label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  placeholder="e.g., Pop, Rock, Hip-Hop"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell listeners about this song..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2] resize-none"
                />
              </div>
            </div>
          </motion.div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#0097b2] to-[#00b8d4] hover:from-[#007a93] hover:to-[#0097b2] text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
          >
            <Upload className="w-5 h-5" />
            {uploading ? "Uploading..." : "Upload Song"}
          </button>
        </form>
      </div>
    </div>
  );
}
