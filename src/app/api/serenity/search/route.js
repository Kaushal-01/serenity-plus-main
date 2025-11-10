import axios from "axios";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");

    if (!query) {
      return Response.json({ error: "Missing query" }, { status: 400 });
    }

    // 🔍 Make three parallel requests to fetch all types
    const [songsRes, albumsRes, playlistsRes] = await Promise.all([
      axios.get("https://saavn.sumit.co/api/search/songs", {
        params: { query, page: 1, limit: 10 },
      }),
      axios.get("https://saavn.sumit.co/api/search/albums", {
        params: { query, page: 1, limit: 10 },
      }),
      axios.get("https://saavn.sumit.co/api/search/playlists", {
        params: { query, page: 1, limit: 10 },
      }),
    ]);

    // 🧩 Merge the results into one structured response
    const data = {
      success: true,
      data: {
        songs: songsRes.data?.data || songsRes.data,
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
