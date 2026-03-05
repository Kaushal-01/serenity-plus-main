"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { motion } from "framer-motion";
import { Users, Search, MessageCircle, UserPlus, UserMinus, Check, X, Send, Music, Smile, MoreVertical, UserX, Flag, AlertCircle, Trash2, Eraser, Play, ListMusic, Music2 } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";

export default function SocialPage() {
  const router = useRouter();
  const { playSong } = usePlayer();
  const [activeTab, setActiveTab] = useState("friends");
  const [myRooms, setMyRooms] = useState([]);
  const [publicRooms, setPublicRooms] = useState([]);
  const [roomSearchQuery, setRoomSearchQuery] = useState("");
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [roomFormData, setRoomFormData] = useState({
    name: "",
    description: "",
    isPrivate: false,
    maxParticipants: 25
  });
  const [roomError, setRoomError] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingUser, setReportingUser] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  // Common emojis for quick access
  const quickEmojis = [
    '😊', '😂', '❤️', '👍', '🎵', '🎶', '🎧', '🎤',
    '🔥', '👏', '🙌', '✨', '💯', '🎉', '😍', '🤩',
    '😎', '🥰', '😘', '😁', '🤔', '👌', '💪', '🙏'
  ];

  const addEmoji = (emoji) => {
    setMessageText(messageText + emoji);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    
    // Get current user ID from localStorage
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user._id) {
      setCurrentUserId(user._id);
    }
    
    fetchFriends();
    fetchChats();
    fetchMyRooms();
    fetchPublicRooms();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.menu-container')) {
        setOpenMenuId(null);
      }
      if (showChatMenu && !event.target.closest('.menu-container')) {
        setShowChatMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId, showChatMenu]);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/social/friends", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setFriends(res.data.friends);
        setFriendRequests(res.data.friendRequests);
      }
    } catch (err) {
      console.error("Fetch friends error:", err);
    }
  };

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/social/chats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        // Filter out any chats without valid participants
        const validChats = (res.data.chats || []).filter(chat => chat.participants && Array.isArray(chat.participants));
        setChats(validChats);
      }
    } catch (err) {
      console.error("Fetch chats error:", err);
    }
  };

  const fetchMyRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/audio-rooms", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMyRooms(res.data.rooms || []);
      }
    } catch (err) {
      console.error("Fetch my rooms error:", err);
    }
  };

  const fetchPublicRooms = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/audio-rooms/search?type=public", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPublicRooms(res.data.rooms || []);
      }
    } catch (err) {
      console.error("Fetch public rooms error:", err);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setRoomError("");
    setCreatingRoom(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/audio-rooms",
        roomFormData,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      if (res.data.success) {
        setShowCreateRoomModal(false);
        setRoomFormData({ name: "", description: "", isPrivate: false, maxParticipants: 25 });
        fetchMyRooms();
        fetchPublicRooms();
        router.push(`/audio-rooms/${res.data.room.id}`);
      }
    } catch (err) {
      setRoomError(err.response?.data?.error || "Failed to create room");
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/audio-rooms/join",
        { roomId },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );

      if (res.data.success) {
        router.push(`/audio-rooms/${roomId}`);
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to join room");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`/api/audio-rooms?roomId=${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        fetchMyRooms();
        fetchPublicRooms();
      }
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete room");
    }
  };

  const searchRooms = async () => {
    if (!roomSearchQuery.trim()) {
      fetchPublicRooms();
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/audio-rooms/search?q=${encodeURIComponent(roomSearchQuery)}&type=all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPublicRooms(res.data.rooms || []);
      }
    } catch (err) {
      console.error("Search rooms error:", err);
    }
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/social/search-users?q=${encodeURIComponent(searchQuery)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setSearchResults(res.data.users);
      }
    } catch (err) {
      console.error("Search users error:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (targetUserId) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/social/friend-request", 
        { targetUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        alert("Friend request sent!");
        fetchFriends(); // Refresh friends data to update UI
        searchUsers(); // Refresh search results
      }
    } catch (err) {
      console.error("Friend request error:", err);
      const errorMsg = err.response?.data?.error || "Failed to send friend request";
      alert(errorMsg);
      // If they're already friends, refresh the UI to show correct status
      if (errorMsg.includes("Already")) {
        fetchFriends();
        searchUsers();
      }
    }
  };

  const respondToRequest = async (requestId, action) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/social/friend-response",
        { requestId, action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        fetchFriends();
      }
    } catch (err) {
      alert("Failed to respond to request");
    }
  };

  const openChat = async (friend) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/social/chats",
        { friendId: friend._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success && res.data.chat) {
        // Validate participants before setting selected chat
        if (res.data.chat.participants && Array.isArray(res.data.chat.participants)) {
          setSelectedChat(res.data.chat);
          setActiveTab("messages");
        } else {
          console.error("Invalid chat data: missing participants");
        }
      }
    } catch (err) {
      console.error("Open chat error:", err);
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !selectedChat) return;
    
    // Validate character limit
    if (messageText.length > 500) {
      alert("Message too long. Maximum 500 characters allowed.");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`/api/social/chats/${selectedChat._id}`,
        { content: messageText, messageType: "text" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Add new message to chat optimistically
        if (res.data.message && selectedChat) {
          setSelectedChat({
            ...selectedChat,
            messages: [...(selectedChat.messages || []), res.data.message],
            lastMessage: new Date()
          });
        }
        setMessageText("");
        setShowEmojiPicker(false);
      }
    } catch (err) {
      console.error("Send message error:", err);
      alert(err.response?.data?.error || "Failed to send message");
    }
  };

  const clearChat = async () => {
    if (!confirm("Are you sure you want to clear all messages in this chat?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(`/api/social/chats/${selectedChat._id}`,
        { action: "clear" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Update selectedChat while preserving participant data
        setSelectedChat(prev => ({
          ...prev,
          messages: res.data.chat.messages,
          lastMessage: res.data.chat.lastMessage
        }));
        setShowChatMenu(false);
        alert("Chat cleared successfully");
      }
    } catch (err) {
      console.error("Clear chat error:", err);
      alert("Failed to clear chat");
    }
  };

  const deleteChat = async () => {
    if (!confirm("Are you sure you want to delete this chat? This cannot be undone.")) return;
    
    try {
      const token = localStorage.getItem("token");
      const chatIdToDelete = selectedChat._id;
      
      // Clear selectedChat first to stop auto-refresh before deletion
      setSelectedChat(null);
      setShowChatMenu(false);
      
      const res = await axios.delete(`/api/social/chats/${chatIdToDelete}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        fetchChats(); // Refresh chat list
        alert("Chat deleted successfully");
      }
    } catch (err) {
      console.error("Delete chat error:", err);
      alert("Failed to delete chat");
    }
  };

  const removeFriend = async (friendId) => {
    if (!confirm("Are you sure you want to remove this friend?")) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete("/api/social/friends", {
        headers: { Authorization: `Bearer ${token}` },
        data: { friendId }
      });
      if (res.data.success) {
        alert("Friend removed successfully");
        await fetchFriends();
        setOpenMenuId(null);
        // Refresh search results if user has searched
        if (searchQuery.trim()) {
          await searchUsers();
        }
      }
    } catch (err) {
      console.error("Remove friend error:", err);
      alert("Failed to remove friend");
    }
  };

  const blockUser = async (userId) => {
    if (!confirm("Are you sure you want to block this user? They will be removed from your friends list.")) return;
    
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/social/block",
        { userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        alert("User blocked successfully");
        fetchFriends();
        setOpenMenuId(null);
      }
    } catch (err) {
      console.error("Block user error:", err);
      alert(err.response?.data?.message || "Failed to block user");
    }
  };

  const openReportModal = (user) => {
    setReportingUser(user);
    setShowReportModal(true);
    setOpenMenuId(null);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) {
      alert("Please select a reason for reporting");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("/api/social/report",
        { 
          userId: reportingUser._id, 
          reason: reportReason,
          description: reportDescription 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        alert("Report submitted successfully. Our team will review it.");
        setShowReportModal(false);
        setReportingUser(null);
        setReportReason("");
        setReportDescription("");
      }
    } catch (err) {
      console.error("Report user error:", err);
      alert("Failed to submit report");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-refresh selected chat every 1 second - only fetch messages to reduce overhead
  useEffect(() => {
    if (!selectedChat?._id) return;
    
    const refreshChat = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/social/chats/${selectedChat._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.chat) {
          // Validate that participants exist before updating
          if (!res.data.chat.participants || !Array.isArray(res.data.chat.participants)) {
            setSelectedChat(null);
            return;
          }
          // Only update messages array, keep existing participant data to reduce overhead
          setSelectedChat(prev => ({
            ...prev,
            messages: res.data.chat.messages,
            lastMessage: res.data.chat.lastMessage,
            participants: res.data.chat.participants
          }));
        }
      } catch (err) {
        // If chat is deleted (404), clear selectedChat to stop polling
        if (err.response?.status === 404) {
          setSelectedChat(null);
        } else {
          console.error("Refresh chat error:", err);
        }
      }
    };
    
    const interval = setInterval(refreshChat, 1000);
    return () => clearInterval(interval);
  }, [selectedChat?._id]);

  // Auto-refresh friend requests every 3 seconds for real-time updates
  useEffect(() => {
    const refreshFriends = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/social/friends", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setFriends(res.data.friends);
          setFriendRequests(res.data.friendRequests);
        }
      } catch (err) {
        console.error("Refresh friends error:", err);
      }
    };
    
    const interval = setInterval(refreshFriends, 3000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh chat list every 5 seconds to update participant profile pictures
  useEffect(() => {
    const refreshChatList = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/social/chats", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setChats(res.data.chats);
          // If there's a selected chat, update it with the refreshed data to maintain consistency
          if (selectedChat?._id) {
            const refreshedSelectedChat = res.data.chats.find(c => c._id === selectedChat._id);
            if (refreshedSelectedChat) {
              // Update selectedChat with refreshed participant data, but keep existing messages
              setSelectedChat(prev => ({
                ...prev,
                participants: refreshedSelectedChat.participants,
                lastMessage: refreshedSelectedChat.lastMessage
              }));
            }
          }
        }
      } catch (err) {
        console.error("Refresh chat list error:", err);
      }
    };
    
    const interval = setInterval(refreshChatList, 5000);
    return () => clearInterval(interval);
  }, [selectedChat?._id]);

  // Refresh full chat participant data every 10 seconds (slower than message polling)
  useEffect(() => {
    if (!selectedChat?._id) return;
    
    const refreshFullChat = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`/api/social/chats/${selectedChat._id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success && res.data.chat) {
          // Update participant data only, preserving the chat selection stability
          setSelectedChat(prev => ({
            ...prev,
            participants: res.data.chat.participants,
            lastMessage: res.data.chat.lastMessage,
            clearedBy: res.data.chat.clearedBy
          }));
        }
      } catch (err) {
        // If chat is deleted (404), clear selectedChat to stop polling
        if (err.response?.status === 404) {
          setSelectedChat(null);
        } else {
          console.error("Refresh full chat error:", err);
        }
      }
    };
    
    const interval = setInterval(refreshFullChat, 10000);
    return () => clearInterval(interval);
  }, [selectedChat?._id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16 md:pt-20 pb-24 md:pb-24 px-2 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-1.5 sm:gap-2 mt-4 sm:mt-6 mb-4 md:mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: "friends", label: "Friends", mobileLabel: "Friends", icon: Users },
            { id: "discover", label: "Discover", mobileLabel: "Discover", icon: Search },
            { id: "messages", label: "Messages", mobileLabel: "Messages", icon: MessageCircle },
            { id: "rooms", label: "Audio Rooms", mobileLabel: "Rooms", icon: Music2 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[#0097b2] text-white shadow-lg"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.mobileLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Friends Tab */}
        {activeTab === "friends" && (
          <div className="space-y-6">
            {/* Friend Requests */}
            {friendRequests.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg"
              >
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-4">Friend Requests ({friendRequests.length})</h2>
                <div className="space-y-3">
                  {friendRequests.map(request => (
                    <div key={request.from._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                          {request.from?.profilePicture ? (
                            <img src={request.from.profilePicture} alt="" className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            request.from?.name?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{request.from.name}</p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">@{request.from.userId || "user"}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end sm:justify-start">
                        <button
                          onClick={() => respondToRequest(request.from._id, "accept")}
                          className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all flex items-center justify-center"
                        >
                          <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button
                          onClick={() => respondToRequest(request.from._id, "decline")}
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all flex items-center justify-center"
                        >
                          <X className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Friends List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg"
            >
            
              {friends.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No friends yet. Start discovering!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {friends.map(friend => (
                    <div key={friend._id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl relative">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                          {friend.profilePicture ? (
                            <img src={friend.profilePicture} alt="" className="w-12 h-12 rounded-full object-cover" />
                          ) : (
                            friend.name?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{friend.name}</p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">@{friend.userId || "user"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openChat(friend)}
                          className="p-2 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-lg transition-all flex-shrink-0 flex items-center justify-center"
                        >
                          <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <div className="relative menu-container">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === friend._id ? null : friend._id)}
                            className="p-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition-all flex-shrink-0 flex items-center justify-center"
                          >
                            <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          {openMenuId === friend._id && (
                            <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-[180px]">
                              <button
                                onClick={() => removeFriend(friend._id)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
                              >
                                <UserMinus className="w-4 h-4" />
                                Remove Friend
                              </button>
                              <button
                                onClick={() => blockUser(friend._id)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-orange-600 dark:text-orange-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <UserX className="w-4 h-4" />
                                Block Person
                              </button>
                              <button
                                onClick={() => openReportModal(friend)}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-b-lg"
                              >
                                <Flag className="w-4 h-4" />
                                Report Person
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Discover Tab */}
        {activeTab === "discover" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-lg"
          >
            
            <div className="mb-4 sm:mb-6">
              <input
                type="text"
                placeholder="Search by User ID or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
              />
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 border-[#0097b2] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map(user => (
                  <div key={user._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt="" className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          user.name?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">@{user.userId || "user"}</p>
                        {user.bio && <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">{user.bio}</p>}
                      </div>
                    </div>
                    <div className="flex justify-end sm:justify-start">
                      {user.isFriend ? (
                        <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-xs sm:text-sm whitespace-nowrap">Friends</span>
                      ) : user.requestSent ? (
                        <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded-lg text-xs sm:text-sm whitespace-nowrap">Pending</span>
                      ) : user.requestReceived ? (
                        <span className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg text-xs sm:text-sm whitespace-nowrap">Respond</span>
                      ) : (
                        <button
                          onClick={() => sendFriendRequest(user.userId)}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
                        >
                          <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">No users found</p>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">Search for users to connect</p>
            )}
          </motion.div>
        )}

        {/* Messages Tab */}
        {activeTab === "messages" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {/* Chat List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="md:col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-3 sm:p-4 shadow-lg max-h-[300px] md:max-h-none overflow-y-auto"
            >
              
              {chats.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8 text-sm">No chats yet</p>
              ) : (
                <div className="space-y-2">
                  {chats.map(chat => {
                    const otherUser = chat.participants?.find(p => p._id !== currentUserId);
                    return (
                      <button
                        key={chat._id}
                        onClick={() => setSelectedChat(chat)}
                        className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl transition-all ${
                          selectedChat?._id === chat._id
                            ? "bg-[#0097b2] text-white"
                            : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                        }`}
                      >
                        <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                          {otherUser?.profilePicture ? (
                            <img src={otherUser.profilePicture} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover" />
                          ) : (
                            otherUser?.name?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate">{otherUser?.name}</p>
                          <p className="text-[10px] sm:text-xs opacity-75 truncate">@{otherUser?.userId || "user"}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Chat Window */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg flex flex-col"
              style={{ height: "400px", maxHeight: "calc(100vh - 300px)" }}
            >
              {selectedChat ? (
                <>
                  <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                          {selectedChat.participants?.find(p => p._id !== currentUserId)?.profilePicture ? (
                            <img 
                              src={selectedChat.participants?.find(p => p._id !== currentUserId)?.profilePicture} 
                              alt="" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            selectedChat.participants?.find(p => p._id !== currentUserId)?.name?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white truncate">
                            {selectedChat.participants?.find(p => p._id !== currentUserId)?.name}
                          </p>
                        </div>
                      </div>
                      <div className="relative menu-container">
                        <button
                          onClick={() => setShowChatMenu(!showChatMenu)}
                          className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all flex-shrink-0 flex items-center justify-center"
                        >
                          <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        {showChatMenu && (
                          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 min-w-[180px]">
                            <button
                              onClick={clearChat}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
                            >
                              <Eraser className="w-4 h-4" />
                              Clear Chat
                            </button>
                            <button
                              onClick={deleteChat}
                              className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-b-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Chat
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-2 sm:space-y-3">
                    {selectedChat.messages?.map((msg, idx) => {
                      const isMe = msg.sender?._id === currentUserId || msg.sender === currentUserId;
                      return (
                        <div key={idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl text-sm sm:text-base ${
                            isMe
                              ? "bg-[#0097b2] text-white"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                          }`}>
                            {msg.messageType === "song" && msg.sharedContent ? (
                              <div className="p-2">
                                <button
                                  onClick={() => {
                                    // Convert sharedContent to song format for player
                                    const sharedData = msg.sharedContent.data;
                                    
                                    // Ensure downloadUrl is properly formatted
                                    let downloadUrl = sharedData?.downloadUrl;
                                    if (!downloadUrl || !Array.isArray(downloadUrl) || downloadUrl.length === 0) {
                                      alert("This song cannot be played - audio data is missing.");
                                      return;
                                    }

                                    const song = {
                                      id: msg.sharedContent.id,
                                      name: msg.sharedContent.name,
                                      image: msg.sharedContent.imageArray || [
                                        { url: msg.sharedContent.image },
                                        { url: msg.sharedContent.image },
                                        { url: msg.sharedContent.image }
                                      ],
                                      artists: sharedData?.artists || {
                                        primary: [{ name: sharedData?.artist }]
                                      },
                                      primaryArtists: sharedData?.primaryArtists || sharedData?.artist,
                                      duration: sharedData?.duration,
                                      url: sharedData?.url,
                                      downloadUrl: downloadUrl,
                                      album: sharedData?.album,
                                      year: sharedData?.year
                                    };
                                    
                                    playSong(song, [song]);
                                  }}
                                  className="w-full flex items-center gap-2 bg-white/10 dark:bg-black/20 hover:bg-white/20 dark:hover:bg-black/30 rounded-lg p-2 transition-all group"
                                >
                                  <img
                                    src={msg.sharedContent.image}
                                    alt={msg.sharedContent.name}
                                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="font-semibold text-xs truncate">
                                      {msg.sharedContent.name}
                                    </p>
                                    <p className={`text-xs truncate ${isMe ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                                      {msg.sharedContent.data?.artist}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 dark:bg-black/30 flex items-center justify-center group-hover:bg-white/30 dark:group-hover:bg-black/40 transition-all">
                                    <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                                  </div>
                                </button>
                              </div>
                            ) : msg.messageType === "playlist" && msg.sharedContent ? (
                              <div className="p-2">
                                <button
                                  onClick={() => {
                                    // Navigate to playlist page
                                    router.push(`/playlists/${msg.sharedContent.id}`);
                                  }}
                                  className="w-full flex items-center gap-2 bg-white/10 dark:bg-black/20 hover:bg-white/20 dark:hover:bg-black/30 rounded-lg p-2 transition-all group"
                                >
                                  <div className="w-12 h-12 rounded bg-white dark:bg-gray-100 flex items-center justify-center flex-shrink-0">
                                    <ListMusic className="w-6 h-6 text-[#0097b2]" />
                                  </div>
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="font-semibold text-xs truncate">
                                      {msg.sharedContent.name}
                                    </p>
                                    <p className={`text-xs truncate ${isMe ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
                                      {msg.sharedContent.data?.songCount || 0} songs
                                      {msg.sharedContent.data?.description ? ` • ${msg.sharedContent.data.description}` : ""}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 dark:bg-black/30 flex items-center justify-center group-hover:bg-white/30 dark:group-hover:bg-black/40 transition-all">
                                    <ListMusic className="w-4 h-4" />
                                  </div>
                                </button>
                              </div>
                            ) : (
                              <p className="px-3 sm:px-4 py-2">{msg.content}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-2 sm:p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="relative">
                      {/* Emoji Picker */}
                      {showEmojiPicker && (
                        <div className="absolute bottom-full mb-2 left-0 right-0 sm:left-0 sm:right-auto bg-white dark:bg-gray-700 rounded-2xl shadow-xl p-3 sm:p-4 border-2 border-gray-200 dark:border-gray-600 z-10">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">Quick Emojis</h3>
                            <button
                              onClick={() => setShowEmojiPicker(false)}
                              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-2 max-w-full sm:max-w-sm">
                            {quickEmojis.map((emoji, idx) => (
                              <button
                                key={idx}
                                onClick={() => addEmoji(emoji)}
                                className="text-xl sm:text-2xl hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg p-1 sm:p-2 transition-all hover:scale-110"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex gap-1.5 sm:gap-2">
                          <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all flex-shrink-0"
                            title="Add emoji"
                          >
                            <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <input
                            type="text"
                            placeholder="Type a message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                            maxLength={500}
                            className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
                          />
                          <button
                            onClick={sendMessage}
                            disabled={!messageText.trim()}
                            className="p-2 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 flex items-center justify-center"
                          >
                            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                        {messageText.length > 0 && (
                          <div className="text-right">
                            <span className={`text-xs ${messageText.length > 450 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                              {messageText.length}/500
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-600 dark:text-gray-400 p-4 text-center text-sm sm:text-base">
                  Select a chat to start messaging
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Audio Rooms Tab */}
        {activeTab === "rooms" && (
          <div className="space-y-4">
            {/* My Rooms Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">My Audio Rooms</h2>
                <button
                  onClick={() => setShowCreateRoomModal(true)}
                  disabled={myRooms.length >= 2}
                  className="px-4 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Create Room
                </button>
              </div>

              {myRooms.length >= 2 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    You've reached the maximum of 2 audio rooms. Delete a room to create a new one.
                  </p>
                </div>
              )}

              {myRooms.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  No audio rooms yet. Create your first room to get started!
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myRooms.map((room) => (
                    <div key={room.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{room.name}</h3>
                          {room.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{room.description}</p>
                          )}
                        </div>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${
                          room.isPrivate 
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' 
                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        }`}>
                          {room.isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Code:</span>
                          <code className="px-2 py-0.5 bg-gray-100 dark:bg-gray-600 rounded font-mono text-xs">
                            {room.roomCode}
                          </code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Participants:</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {room.participantCount} / {room.maxParticipants}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/audio-rooms/${room.id}`)}
                          className="flex-1 px-3 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-all text-sm font-medium"
                        >
                          Enter Room
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Discover Rooms Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
            >
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Discover Audio Rooms</h2>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={roomSearchQuery}
                  onChange={(e) => setRoomSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchRooms()}
                  placeholder="Search by name or room code..."
                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
                />
                <button
                  onClick={searchRooms}
                  className="px-6 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-all font-medium"
                >
                  Search
                </button>
              </div>

              {publicRooms.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                  No rooms found. Be the first to create one!
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {publicRooms.map((room) => (
                    <div key={room.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{room.name}</h3>
                          {room.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{room.description}</p>
                          )}
                        </div>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded whitespace-nowrap ${
                          room.isPrivate 
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200' 
                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                        }`}>
                          {room.isPrivate ? 'Private' : 'Public'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <Users className="w-4 h-4" />
                        <span className="truncate">{room.creator?.name}</span>
                      </div>

                      <div className="flex items-center justify-between text-sm mb-3">
                        <span className="text-gray-600 dark:text-gray-400">
                          {room.participantCount} / {room.maxParticipants} participants
                        </span>
                        {room.participantCount >= room.maxParticipants && (
                          <span className="text-red-600 dark:text-red-400 text-xs font-medium">Full</span>
                        )}
                      </div>

                      {room.nowPlaying && (
                        <div className="mb-3 p-2 bg-white dark:bg-gray-600 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Now Playing:</p>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {room.nowPlaying.songName}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={room.participantCount >= room.maxParticipants}
                        className="w-full px-4 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {room.participantCount >= room.maxParticipants ? 'Room Full' : 'Join Room'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateRoomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Create Audio Room</h2>

              {roomError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm">{roomError}</p>
                </div>
              )}

              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Room Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={roomFormData.name}
                    onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
                    placeholder="My Awesome Room"
                    maxLength={50}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={roomFormData.description}
                    onChange={(e) => setRoomFormData({ ...roomFormData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
                    placeholder="Describe your room..."
                    rows={3}
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    value={roomFormData.maxParticipants}
                    onChange={(e) => setRoomFormData({ ...roomFormData, maxParticipants: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
                    min={2}
                    max={25}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    checked={roomFormData.isPrivate}
                    onChange={(e) => setRoomFormData({ ...roomFormData, isPrivate: e.target.checked })}
                    className="w-4 h-4 text-[#0097b2] bg-gray-100 border-gray-300 rounded focus:ring-[#0097b2]"
                  />
                  <label htmlFor="isPrivate" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Make this room private (requires room code to join)
                  </label>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> You must be at least 16 years old and can create up to 2 audio rooms.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateRoomModal(false);
                      setRoomError('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingRoom}
                    className="flex-1 px-4 py-2 bg-[#0097b2] text-white rounded-lg hover:bg-[#007a93] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {creatingRoom ? 'Creating...' : 'Create Room'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-500" />
                Report User
              </h2>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportingUser(null);
                  setReportReason("");
                  setReportDescription("");
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                You are reporting: <span className="font-semibold text-gray-900 dark:text-white">{reportingUser?.name}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for reporting <span className="text-red-500">*</span>
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2]"
                >
                  <option value="">Select a reason</option>
                  <option value="harassment">Harassment or Bullying</option>
                  <option value="spam">Spam or Scam</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="impersonation">Impersonation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide more information about this report..."
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0097b2] resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportingUser(null);
                    setReportReason("");
                    setReportDescription("");
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  disabled={!reportReason}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
