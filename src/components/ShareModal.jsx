"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Send, Users, Music2, ListMusic } from "lucide-react";
import axios from "axios";

export default function ShareModal({ isOpen, onClose, song, playlist }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState({});

  const contentType = song ? "song" : playlist ? "playlist" : null;
  const content = song || playlist;

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/social/friends", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setFriends(res.data.friends);
      }
    } catch (err) {
      console.error("Fetch friends error:", err);
    } finally {
      setLoading(false);
    }
  };

  const shareContent = async (friend) => {
    try {
      setSending(prev => ({ ...prev, [friend._id]: true }));
      const token = localStorage.getItem("token");
      
      if (!content) {
        alert("Nothing to share");
        setSending(prev => ({ ...prev, [friend._id]: false }));
        return;
      }

      // Basic validation - just check if song/playlist has required fields
      if (contentType === "song" && !song?.id && !song?.name) {
        alert("This song cannot be shared - missing required data.");
        setSending(prev => ({ ...prev, [friend._id]: false }));
        return;
      }
      
      // First, create or get chat with the friend
      const chatRes = await axios.post("/api/social/chats", 
        { friendId: friend._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!chatRes.data.success) {
        throw new Error("Failed to create chat");
      }

      const chatId = chatRes.data.chat._id;

      // Prepare message based on content type
      let messageData;
      if (contentType === "song") {
        // IMPORTANT: Filter out base64 audio from downloadUrl to prevent bloating database
        // Artist-uploaded songs can have 100KB+ base64 MP3 data in downloadUrl
        // We only store references - the actual audio is loaded when user plays the song
        let cleanDownloadUrl = null;
        if (song.downloadUrl) {
          if (Array.isArray(song.downloadUrl)) {
            cleanDownloadUrl = song.downloadUrl
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
          } else if (typeof song.downloadUrl === 'string' && !song.downloadUrl.startsWith('data:')) {
            cleanDownloadUrl = song.downloadUrl;
          }
        }
        
        messageData = {
          content: song.name,
          messageType: "song",
          sharedContent: {
            type: "song",
            id: song.id,
            name: song.name,
            image: song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url,
            data: {
              artist: song.artists?.primary?.[0]?.name || song.artists?.[0]?.name || song.primaryArtists || "Unknown Artist",
              duration: song.duration,
              url: song.url,
              artists: song.artists,
              downloadUrl: cleanDownloadUrl, // Sanitized - no base64
              primaryArtists: song.primaryArtists,
              album: song.album,
              year: song.year
            }
          }
        };
      } else if (contentType === "playlist") {
        messageData = {
          content: playlist.name,
          messageType: "playlist",
          sharedContent: {
            type: "playlist",
            id: playlist._id,
            name: playlist.name,
            image: playlist.songs?.[0]?.image?.[2]?.url || playlist.songs?.[0]?.image?.[1]?.url || playlist.songs?.[0]?.image?.[0]?.url || "",
            data: {
              songsCount: playlist.songs?.length || 0,
              description: playlist.description,
              isPublic: playlist.isPublic,
              songs: playlist.songs
            }
          }
        };
      }

      // Send the message
      const messageRes = await axios.post(`/api/social/chats/${chatId}`,
        messageData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (messageRes.data.success) {
        // Close modal after successful share
        setSending(prev => ({ ...prev, [friend._id]: false }));
        setTimeout(() => {
          onClose();
        }, 300);
      }
    } catch (err) {
      console.error("Share error:", err);
      alert(err.response?.data?.error || `Failed to share ${contentType}`);
    } finally {
      setSending(prev => ({ ...prev, [friend._id]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" 
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#0097b2] to-[#007a93]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {contentType === "playlist" ? <ListMusic className="w-6 h-6" /> : <Music2 className="w-6 h-6" />}
              Share {contentType === "playlist" ? "Playlist" : "Song"}
            </h2>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content Preview */}
          {content && (
            <div className="flex items-center gap-3 mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-3">
              <img
                src={contentType === "song" ? (song.image?.[2]?.url || song.image?.[1]?.url || song.image?.[0]?.url) : (playlist.songs?.[0]?.image?.[2]?.url || playlist.songs?.[0]?.image?.[1]?.url || playlist.songs?.[0]?.image?.[0]?.url || "/playlist-default.png")}
                alt={content.name}
                className="w-14 h-14 rounded-lg object-cover shadow-lg"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">
                  {content.name}
                </p>
                <p className="text-sm text-white/80 truncate">
                  {contentType === "song" ? (song.artists?.primary?.[0]?.name || song.artists?.[0]?.name || song.primaryArtists || "Unknown Artist") : `${playlist.songs?.length || 0} songs`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Friends List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0097b2] border-t-transparent"></div>
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-12 px-4">
              <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No friends yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Add friends to share music!</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {friends.map((friend) => (
                <div
                  key={friend._id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0097b2] to-[#007a93] flex items-center justify-center text-white font-bold text-lg shadow-md">
                      {friend.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {friend.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        @{friend.userId}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => shareContent(friend)}
                    disabled={sending[friend._id]}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                  >
                    {sending[friend._id] ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span className="text-sm">Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span className="text-sm">Send</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
