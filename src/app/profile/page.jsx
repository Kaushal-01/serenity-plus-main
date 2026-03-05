"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showBecomeArtistModal, setShowBecomeArtistModal] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    userId: "",
    profilePicture: "",
    accountType: "public",
    bio: ""
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [deletePassword, setDeletePassword] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);
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
    const token = localStorage.getItem("token");
    if (!token) return;
    
    setLoading(true);
    try {
      const res = await axios.get("/api/user/update-profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.data.success) {
        setUser(res.data.user);
        setFormData({
          name: res.data.user.name,
          userId: res.data.user.userId || "",
          profilePicture: res.data.user.profilePicture || "",
          accountType: res.data.user.accountType || "public",
          bio: res.data.user.bio || ""
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Name cannot be empty" });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setSaving(true);
    try {
      const updateData = {
        name: formData.name,
        userId: formData.userId,
        profilePicture: formData.profilePicture,
        accountType: formData.accountType,
        bio: formData.bio
      };

      const res = await axios.put(
        "/api/user/update-profile",
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        
        // Update localStorage
        localStorage.setItem("user", JSON.stringify(res.data.user));
        
        // Broadcast update event to navbar
        window.dispatchEvent(new Event("serenity-auth-update"));
        
        // Close modal and refresh
        setShowEditProfileModal(false);
        fetchProfile();
      }
    } catch (err) {
      console.error("Update profile error:", err);
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file format (only JPEG, JPG, PNG)
      const allowedFormats = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedFormats.includes(file.type.toLowerCase())) {
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
        setMessage({ type: "success", text: "Image uploaded successfully. Click 'Save Changes' to update." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords don't match" });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters" });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setSaving(true);
    try {
      const res = await axios.put(
        "/api/user/profile",
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setShowPasswordModal(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      console.error("Change password error:", err);
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to change password" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage({ type: "error", text: "Please enter your password" });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    setSaving(true);
    try {
      const res = await axios.delete(
        `/api/user/profile?password=${encodeURIComponent(deletePassword)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("serenity-auth-update"));
        router.push("/signup");
      }
    } catch (err) {
      console.error("Delete account error:", err);
      setMessage({ type: "error", text: err.response?.data?.error || "Failed to delete account" });
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0097b2]/5 to-white dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="pt-24 px-8 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0097b2]"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0097b2]/5 to-white dark:from-gray-900 dark:to-gray-800">
        <Navbar />
        <div className="pt-24 px-8 text-center">
          <p className="text-gray-600 dark:text-gray-300">Failed to load profile data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0097b2]/5 to-white dark:from-gray-900 dark:to-gray-800 transition-colors">
      <Navbar />
      
      <div className="pt-24 px-4 sm:px-6 pb-24 md:pb-12 max-w-4xl mx-auto">
        {/* Message Alert */}
        <AnimatePresence>
          {message.text && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-6 p-4 rounded-lg ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-red-100 text-red-800 border border-red-300"
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-6 transition-colors"
        >
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6 sm:mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <div className="w-20 sm:w-24 h-20 sm:h-24 bg-gradient-to-br from-[#0097b2] to-[#007a93] rounded-full flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-lg overflow-hidden">
                {user.profilePicture ? (
                  <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <button
                onClick={() => setShowEditProfileModal(true)}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-full flex items-center justify-center shadow-lg transition-all"
                title="Edit Profile"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
            <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
              {user.userId && (
                <p className="text-sm text-gray-500 dark:text-gray-400">@{user.userId}</p>
              )}
              <p className="text-gray-600 dark:text-gray-300 mt-1">{user.email}</p>
            </div>
          </div>

          {/* Account Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#0097b2]/10 to-[#0097b2]/5 dark:from-[#0097b2]/20 dark:to-[#0097b2]/10 p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-[#0097b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Favorites</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{user.favorites?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-100/50 to-purple-50/50 dark:from-purple-900/30 dark:to-purple-800/20 p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Genres</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{user.preferences?.genres?.length || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-100/50 to-green-50/50 dark:from-green-900/30 dark:to-green-800/20 p-6 rounded-xl">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Member Since</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatDate(user.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Information Section */}
          <div className="mb-8 space-y-6">
            {/* Username */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#0097b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Username
              </h3>
              {user?.userId ? (
                <p className="text-gray-900 dark:text-white px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">@{user.userId}</p>
              ) : (
                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    ℹ️ Set your username to connect with friends. Click Edit Profile above.
                  </p>
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Bio</h3>
              {user?.bio ? (
                <p className="text-gray-900 dark:text-white px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl whitespace-pre-wrap">{user.bio}</p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl italic">
                  No bio added yet. Click Edit Profile to add one.
                </p>
              )}
            </div>
          </div>

          {/* Preferences */}
          {user.preferences?.isSetupComplete && (
            <div className="mb-8">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">Onboarding Preferences</h3>
              
              {user.preferences.genres && user.preferences.genres.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Favorite Genres:</p>
                  <div className="flex flex-wrap gap-2">
                    {user.preferences.genres.map((genre, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-[#0097b2]/10 dark:bg-[#0097b2]/20 text-[#0097b2] dark:text-[#0097b2] rounded-full text-sm font-medium"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {user.preferences.artists && user.preferences.artists.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Favorite Artists:</p>
                  <div className="flex flex-wrap gap-2">
                    {user.preferences.artists.map((artist, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium"
                      >
                        {artist}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-[#0097b2] dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-[#0097b2] dark:text-gray-300">Change Password</span>
              </div>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push("/playlists")}
              className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-[#0097b2] dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-[#0097b2] dark:text-gray-300">Manage My Playlists</span>
              </div>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push("/favorites")}
              className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-[#0097b2] dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-[#0097b2] dark:text-gray-300">View My Favorites</span>
              </div>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => router.push("/onboarding")}
              className="w-full flex items-center justify-between px-6 py-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-all group"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-[#0097b2] dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium text-gray-700 group-hover:text-[#0097b2] dark:text-gray-300">Update Music Preferences</span>
              </div>
              <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Become an Artist Button */}
            {user.accountType !== "artist" ? (
              <button
                onClick={() => setShowBecomeArtistModal(true)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0097b2]/10 to-[#00b8d4]/10 hover:from-[#0097b2]/20 hover:to-[#00b8d4]/20 dark:from-[#0097b2]/20 dark:to-[#00b8d4]/20 dark:hover:from-[#0097b2]/30 dark:hover:to-[#00b8d4]/30 rounded-xl transition-all group border-2 border-[#0097b2]/30"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#0097b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <span className="font-medium text-[#0097b2]">Become an Artist</span>
                </div>
                <svg className="w-5 h-5 text-[#0097b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => router.push("/artist/dashboard")}
                className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0097b2]/10 to-[#00b8d4]/10 hover:from-[#0097b2]/20 hover:to-[#00b8d4]/20 dark:from-[#0097b2]/20 dark:to-[#00b8d4]/20 dark:hover:from-[#0097b2]/30 dark:hover:to-[#00b8d4]/30 rounded-xl transition-all group border-2 border-[#0097b2]/30"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#0097b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <span className="font-medium text-[#0097b2]">Artist Dashboard</span>
                </div>
                <svg className="w-5 h-5 text-[#0097b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            <button
              onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.dispatchEvent(new Event("serenity-auth-update"));
                router.push("/login");
              }}
              className="w-full flex items-center justify-between px-6 py-4 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 rounded-xl transition-all group border-2 border-red-200 dark:border-red-800"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium text-red-600 dark:text-red-400">Logout</span>
              </div>
              <svg className="w-5 h-5 text-red-400 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 border-2 border-red-200 dark:border-red-800 transition-colors"
        >
          <h3 className="text-lg md:text-xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Danger Zone
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Once you delete your account, there is no going back. All your data will be permanently deleted.</p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all"
          >
            Delete Account
          </button>
        </motion.div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">Change Password</h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#0097b2] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#0097b2] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#0097b2] focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    {saving ? "Changing..." : "Change Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                      setMessage({ type: "", text: "" });
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">Delete Account?</h3>
                <p className="text-gray-600 dark:text-gray-300">This action cannot be undone. All your data will be permanently deleted.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enter your password to confirm</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Your password"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={saving || !deletePassword}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    {saving ? "Deleting..." : "Yes, Delete My Account"}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeletePassword("");
                      setMessage({ type: "", text: "" });
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setShowEditProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 my-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Profile</h2>
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Profile Picture */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                    Profile Picture
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                      {formData.profilePicture ? (
                        <img src={formData.profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.[0]?.toUpperCase()
                      )}
                    </div>
                    <div>
                      <label className="px-4 py-2 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-lg cursor-pointer transition-all inline-block text-sm">
                        Upload Photo
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Max 5MB (JPEG, JPG, PNG)</p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Username
                  </label>
                  <input
                    type="text"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    placeholder="username"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Letters, numbers, and underscores only
                  </p>
                </div>

                {/* Account Type */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
                    Account Type
                  </label>
                  <div className="space-y-3">
                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.accountType === "public"
                        ? "border-[#0097b2] bg-[#0097b2]/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-[#0097b2]/50"
                    }`}>
                      <input
                        type="radio"
                        name="accountTypeModal"
                        value="public"
                        checked={formData.accountType === "public"}
                        onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                        className="w-4 h-4 text-[#0097b2]"
                      />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">Public</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Anyone can see your playlists</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                      formData.accountType === "private"
                        ? "border-[#0097b2] bg-[#0097b2]/10"
                        : "border-gray-200 dark:border-gray-700 hover:border-[#0097b2]/50"
                    }`}>
                      <input
                        type="radio"
                        name="accountTypeModal"
                        value="private"
                        checked={formData.accountType === "private"}
                        onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                        className="w-4 h-4 text-[#0097b2]"
                      />
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">Private</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Only you can see your playlists</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2] resize-none"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-right">
                    {formData.bio.length}/500 characters
                  </p>
                </div>

                {/* Save Button */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditProfileModal(false);
                      setFormData({
                        name: user.name,
                        userId: user.userId || "",
                        profilePicture: user.profilePicture || "",
                        accountType: user.accountType || "public",
                        bio: user.bio || ""
                      });
                    }}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Become an Artist Modal */}
      <AnimatePresence>
        {showBecomeArtistModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBecomeArtistModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">Become an Artist</h3>
                <p className="text-gray-600 dark:text-gray-300">Share your music with the Serenity community!</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Artist Name</label>
                  <input
                    type="text"
                    value={artistName}
                    onChange={(e) => setArtistName(e.target.value)}
                    placeholder="Enter your artist/band name"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#0097b2] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">This will be displayed on all your uploaded songs</p>
                </div>
                <div className="bg-[#0097b2]/10 dark:bg-[#0097b2]/20 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">As an artist, you can:</h4>
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#0097b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Upload your original music
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#0097b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Track your song plays and listeners
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#0097b2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Build your fanbase
                    </li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      if (!artistName.trim()) {
                        setMessage({ type: "error", text: "Please enter an artist name" });
                        return;
                      }
                      setSaving(true);
                      try {
                        const token = localStorage.getItem("token");
                        const res = await axios.put(
                          "/api/user/become-artist",
                          { artistName: artistName.trim() },
                          { headers: { Authorization: `Bearer ${token}` } }
                        );
                        if (res.data.success) {
                          setMessage({ type: "success", text: "Welcome to Serenity Artists!" });
                          setShowBecomeArtistModal(false);
                          fetchProfile();
                          setTimeout(() => {
                            router.push("/artist/upload");
                          }, 1500);
                        }
                      } catch (err) {
                        setMessage({ type: "error", text: err.response?.data?.error || "Failed to upgrade account" });
                      } finally {
                        setSaving(false);
                      }
                    }}
                    disabled={saving || !artistName.trim()}
                    className="flex-1 px-4 py-2 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-lg font-medium transition-all disabled:opacity-50"
                  >
                    {saving ? "Processing..." : "Become an Artist"}
                  </button>
                  <button
                    onClick={() => {
                      setShowBecomeArtistModal(false);
                      setArtistName("");
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
