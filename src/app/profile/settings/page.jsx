"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Camera, Users, Lock, Globe, Upload, Music } from "lucide-react";

export default function ProfileSettingsPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [daysUntilChange, setDaysUntilChange] = useState(0);
  const [formData, setFormData] = useState({
    userId: "",
    profilePicture: "",
    accountType: "public",
    bio: "",
    favoriteArtists: "",
    favoriteGenres: "",
    artistName: ""
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/user/update-profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        setUser(res.data.user);
        setDaysUntilChange(res.data.daysUntilUserIdChange || 0);
        setFormData({
          userId: res.data.user.userId || "",
          profilePicture: res.data.user.profilePicture || "",
          accountType: res.data.user.accountType || "public",
          bio: res.data.user.bio || "",
          favoriteArtists: res.data.user.favoriteArtists?.join(", ") || "",
          favoriteGenres: res.data.user.favoriteGenres?.join(", ") || "",
          artistName: res.data.user.artistName || ""
        });
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file format (only JPEG, PNG)
      const allowedFormats = ['image/jpeg', 'image/png'];
      if (!allowedFormats.includes(file.type)) {
        setMessage({ type: "error", text: "Only JPEG, JPG, and PNG image formats are allowed" });
        e.target.value = ''; // Reset file input
        return;
      }
      
      // Validate file size
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image must be less than 5MB" });
        e.target.value = ''; // Reset file input
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result });
        setMessage({ type: "success", text: "Image uploaded successfully" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    setSaving(true);

    try {
      const token = localStorage.getItem("token");
      const updateData = {
        userId: formData.userId,
        profilePicture: formData.profilePicture,
        accountType: formData.accountType,
        bio: formData.bio,
        favoriteArtists: formData.favoriteArtists.split(",").map(a => a.trim()).filter(a => a),
        favoriteGenres: formData.favoriteGenres.split(",").map(g => g.trim()).filter(g => g),
        artistName: formData.artistName
      };

      const res = await axios.put("/api/user/update-profile", updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        localStorage.setItem("user", JSON.stringify(res.data.user));
        window.dispatchEvent(new Event("serenity-auth-update"));
        fetchProfile();
      }
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-24 flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-[#0097b2] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20 pb-24 px-4">
      <div className="max-w-4xl mx-auto">
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
          {/* Profile Picture */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Camera className="w-6 h-6 text-[#0097b2]" />
              Profile Picture
            </h2>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-full flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {formData.profilePicture ? (
                  <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase()
                )}
              </div>
              <div>
                <label className="px-4 py-2 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-lg cursor-pointer transition-all inline-block">
                  Upload Photo
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Max size: 5MB (JPEG, JPG, PNG only)</p>
                <p className="text-xs text-[#0097b2] dark:text-[#0097b2] mt-1">
                  ✨ Appears across all of Serenity (Profile, Social, etc.)
                </p>
              </div>
            </div>
          </motion.div>

          {/* User ID */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-[#0097b2]" />
              User ID
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Unique User ID
              </label>
              <input
                type="text"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="Choose a unique ID"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
              />
              {daysUntilChange > 0 && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                  ⚠️ You can change your User ID in {daysUntilChange} days
                </p>
              )}
              {!user?.userId && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                  ℹ️ Set your User ID to connect with friends
                </p>
              )}
            </div>
          </motion.div>

          {/* Account Type */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6 text-[#0097b2]" />
              Account Type
            </h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.accountType === "public"
                  ? "border-[#0097b2] bg-[#0097b2]/10"
                  : "border-gray-200 dark:border-gray-700 hover:border-[#0097b2]/50"
              }`}>
                <input
                  type="radio"
                  name="accountType"
                  value="public"
                  checked={formData.accountType === "public"}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  className="w-5 h-5 text-[#0097b2]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#0097b2]" />
                    <p className="font-semibold text-gray-900 dark:text-white">Public</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Anyone can see your playlists and send friend requests</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.accountType === "private"
                  ? "border-[#0097b2] bg-[#0097b2]/10"
                  : "border-gray-200 dark:border-gray-700 hover:border-[#0097b2]/50"
              }`}>
                <input
                  type="radio"
                  name="accountType"
                  value="private"
                  checked={formData.accountType === "private"}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  className="w-5 h-5 text-[#0097b2]"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[#0097b2]" />
                    <p className="font-semibold text-gray-900 dark:text-white">Private</p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Only you can see your playlists</p>
                </div>
              </label>

            </div>
          </motion.div>

          {/* Bio */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Bio</h2>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell others about yourself and your music taste..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2] resize-none"
            />
          </motion.div>

          {/* Favorite Artists & Genres */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Music Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Favorite Artists (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.favoriteArtists}
                  onChange={(e) => setFormData({ ...formData, favoriteArtists: e.target.value })}
                  placeholder="e.g., Taylor Swift, The Weeknd, Drake"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Favorite Genres (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.favoriteGenres}
                  onChange={(e) => setFormData({ ...formData, favoriteGenres: e.target.value })}
                  placeholder="e.g., Pop, Hip-Hop, Rock, Jazz"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
                />
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-all"
            >
              Back to Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
