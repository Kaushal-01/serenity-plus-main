import axios from "axios";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  let id = searchParams.get("id");

  try {
    // 🎯 If "id" is present, fetch songs from that specific album
    if (id) {
      // Handle full URLs or search IDs
      if (id.startsWith("http")) {
        // Extract the last part from URL (the real JioSaavn ID)
        id = id.split("/").pop()?.replace("_", "");
      } else if (/^\d+$/.test(id)) {
        // If it's numeric, try converting it to the real one later
        // You can optionally add logic to resolve this to URL form
        console.warn("⚠️ Warning: Numeric ID may not return songs directly");
      }

      const res = await axios.get(`https://saavn.sumit.co/api/albums`, {
        params: { id },
      });

      return Response.json(res.data);
    }

    // 🎯 If "query" is present, search albums
    if (query) {
      const res = await axios.get(`https://saavn.sumit.co/api/search/albums`, {
        params: { query, page: 0, limit: 10 },
      });
      return Response.json(res.data);
    }

    // ❌ Missing query or id
    return Response.json({ error: "Missing query or album ID" }, { status: 400 });
  } catch (err) {
    console.error("Album fetch error:", err.response?.data || err);
    return Response.json({ error: "Failed to fetch album(s)" }, { status: 500 });
  }
}
