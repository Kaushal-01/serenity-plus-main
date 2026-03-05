"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Music, List, X } from "lucide-react";

export default function SharePlaylistModal({ isOpen, onClose, friendId }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
    }
  }, [isOpen]);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/user/playlists", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPlaylists(res.data.playlists);
      }
    } catch (err) {
      console.error("Fetch playlists error:", err);
    } finally {
      setLoading(false);
    }
  };

  const sharePlaylist = async (playlist) => {
    setSharing(true);
    try {
      const token = localStorage.getItem("token");
      
      // Get or create chat with friend
      const chatRes = await axios.post("/api/social/chats", 
        { friendId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (chatRes.data.success) {
        const chatId = chatRes.data.chat._id;
        
        // Send playlist as message
        await axios.post(`/api/social/chats/${chatId}`,
          {
            content: `Shared playlist: ${playlist.name}`,
            messageType: "playlist",
            sharedContent: {
              type: "playlist",
              id: playlist._id,
              name: playlist.name,
              image: playlist.songs?.[0]?.image?.[0]?.url || "",
              data: {
                songsCount: playlist.songs?.length || 0,
                description: playlist.description
              }
            }
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        alert("Playlist shared successfully!");
        onClose();
      }
    } catch (err) {
      console.error("Share playlist error:", err);
      alert("Failed to share playlist");
    } finally {
      setSharing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-6 h-6 text-[#0097b2]" />
              Share Playlist
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-3 border-[#0097b2] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-12">
              <List className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No playlists to share</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[60vh]">
              {playlists.map(playlist => (
                <div
                  key={playlist._id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#0097b2] to-[#00b8d4] rounded-lg flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{playlist.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {playlist.songs?.length || 0} songs
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => sharePlaylist(playlist)}
                    disabled={sharing}
                    className="px-4 py-2 bg-[#0097b2] hover:bg-[#007a93] text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
