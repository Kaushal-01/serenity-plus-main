import axios from "axios";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  let id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing playlist ID" }, { status: 400 });
  }

  try {
    console.log("Fetching playlist with ID:", id);
    
    // Fetch playlist details from JioSaavn API
    const res = await axios.get(`https://saavn.sumit.co/api/playlists`, {
      params: { id },
    });

    console.log("Playlist API response:", res.data);
    return Response.json(res.data);
  } catch (err) {
    console.error("Playlist fetch error:", err.response?.data || err.message);
    return Response.json({ 
      error: "Failed to fetch playlist", 
      details: err.response?.data || err.message 
    }, { status: 500 });
  }
}
