"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <h1 className="text-3xl font-bold mb-6">My Favorites</h1>

        {loading ? <p>Loading...</p> : null}

        {favorites.length === 0 && !loading ? (
          <p className="text-gray-400">No favorites yet. Add songs from the dashboard.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {favorites.map((f) => (
              <div key={f.id} className="bg-gray-800 p-4 rounded">
                <img src={f.image?.[1]?.url || f.image?.[0]?.url} alt={f.name} className="rounded mb-3 w-full" />
                <h3 className="font-semibold">{f.name}</h3>
                <p className="text-sm text-gray-400">{(f.artists && f.artists[0]?.name) || ""}</p>

                <div className="flex gap-2 mt-3">
                  {f.downloadUrl?.[0]?.url ? (
                    <a href={f.downloadUrl[0].url} target="_blank" className="text-blue-400 text-sm hover:underline">Download</a>
                  ) : f.url ? (
                    <a href={f.url} target="_blank" className="text-blue-400 text-sm hover:underline">Open</a>
                  ) : null}

                  <button onClick={() => removeFavorite(f.id)} className="ml-auto bg-red-600 px-3 py-1 rounded text-sm">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
