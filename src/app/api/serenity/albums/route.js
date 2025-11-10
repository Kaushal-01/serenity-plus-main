import axios from "axios";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const page = searchParams.get("page") || 0;
    const limit = searchParams.get("limit") || 10;

    if (!query) {
      return Response.json({ error: "Missing query parameter" }, { status: 400 });
    }

    // Fetch albums from JioSaavn API
    const res = await axios.get("https://saavn.sumit.co/api/search/albums", {
      params: { query, page, limit },
    });
    return Response.json(res.data);
  } catch (error) {
    console.error("Albums route error:", error);
    return Response.json({ error: "Failed to fetch albums" }, { status: 500 });
  }
}
