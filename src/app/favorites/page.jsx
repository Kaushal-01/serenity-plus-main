"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { usePlayer } from "@/context/PlayerContext";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { playSong } = usePlayer();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get("/api/user/favorites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(res.data.favorites || []);
    } catch (err) {
      console.error("fetch favorites err", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await axios.delete(`/api/user/favorites?id=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFavorites();
    } catch (err) {
      console.error("remove favorite err", err);
    }
  };

  return (
    <>
      <div className="mt-10 min-h-screen bg-white text-black p-8">
        <h1 className="text-3xl font-bold mb-6 text-[#0097b2]">My Favorites</h1>

        {loading ? <p className="text-gray-600">Loading...</p> : null}

        {favorites.length === 0 && !loading ? (
          <p className="text-gray-600">No favorites yet. Add songs from the dashboard.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {favorites.map((f) => (
              <div key={f.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all group">
                <img src={f.image?.[1]?.url || f.image?.[0]?.url} alt={f.name} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="p-3">
                  <h3 className="font-semibold text-black text-sm truncate">{f.name}</h3>
                  <p className="text-xs text-gray-600 truncate">{(f.artists && f.artists[0]?.name) || ""}</p>

                  <div className="flex flex-col gap-2 mt-3">
                    <button 
                      onClick={() => playSong(f)} 
                      className="w-full bg-[#0097b2] hover:bg-[#007a93] text-white px-2 py-1.5 rounded-lg text-xs transition-all font-medium"
                    >
                      ▶ Play
                    </button>
                    <button 
                      onClick={() => removeFavorite(f.id)} 
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded-lg text-xs transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
