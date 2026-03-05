import axios from "axios";
import connectDB from "@/lib/db";
import ArtistSong from "@/models/artistSong";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query) {
      return Response.json({ error: "Missing query" }, { status: 400 });
    }

    // Connect to DB for artist songs
    let artistSongs = [];
    try {
      await connectDB();
      artistSongs = await ArtistSong.find({
        $or: [
          { songName: { $regex: query, $options: "i" } },
          { artistName: { $regex: query, $options: "i" } },
          { musicBy: { $regex: query, $options: "i" } }
        ],
        isActive: true
      })
      .populate("uploadedBy", "name userId artistName")
      .limit(10)
      .lean();
    } catch (dbErr) {
      console.error("Database error in search:", dbErr);
      // Continue without artist songs if DB fails
    }

    // 🔍 Make parallel requests to fetch all types
    const [songsRes, albumsRes, playlistsRes] = await Promise.all([
      axios.get("https://saavn.sumit.co/api/search/songs", {
        params: { query, page: 1, limit: 10 },
      }).catch(err => {
        console.error("Songs API error:", err.message);
        return { data: { data: { results: [] } } };
      }),
      axios.get("https://saavn.sumit.co/api/search/albums", {
        params: { query, page: 1, limit: 10 },
      }).catch(err => {
        console.error("Albums API error:", err.message);
        return { data: { data: { results: [] } } };
      }),
      axios.get("https://saavn.sumit.co/api/search/playlists", {
        params: { query, page: 1, limit: 10 },
      }).catch(err => {
        console.error("Playlists API error:", err.message);
        return { data: { data: { results: [] } } };
      })
    ]);

    // Format artist songs to match Saavn API structure
    const formattedArtistSongs = artistSongs.map(song => ({
      id: song._id.toString(),
      name: song.songName,
      primaryArtists: song.artistName,
      image: [{ url: song.coverPhoto }],
      downloadUrl: [{ url: song.audioFile }],
      duration: song.duration,
      type: "artist-upload",
      artistId: song.uploadedBy._id
    }));

    // Get songs from Saavn API
    const saavnSongs = songsRes.data?.data?.results || songsRes.data?.results || [];
    
    // Combine Saavn songs with artist songs
    const combinedSongs = [...formattedArtistSongs, ...saavnSongs];

    // 🧩 Merge the results into one structured response
    const data = {
      success: true,
      data: {
        songs: {
          results: combinedSongs,
          total: combinedSongs.length
        },
        albums: albumsRes.data?.data || albumsRes.data,
        playlists: playlistsRes.data?.data || playlistsRes.data,
      },
    };

    return Response.json(data, { status: 200 });
  } catch (err) {
    console.error("Global search API error:", err.message);
    return Response.json({ error: "Failed to fetch search results" }, { status: 500 });
  }
}
