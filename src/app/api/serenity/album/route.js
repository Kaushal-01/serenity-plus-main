import axios from "axios";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  let id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing album ID" }, { status: 400 });
  }

  try {
    console.log("Fetching album with ID:", id);
    
    // The API expects the album ID directly
    const res = await axios.get(`https://saavn.sumit.co/api/albums`, {
      params: { id },
    });

    console.log("Album API response:", res.data);
    return Response.json(res.data);
  } catch (err) {
    console.error("Album fetch error:", err.response?.data || err.message);
    return Response.json({ 
      error: "Failed to fetch album", 
      details: err.response?.data || err.message 
    }, { status: 500 });
  }
}
