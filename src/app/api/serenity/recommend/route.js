export async function POST(req) {
  try {
    const body = await req.json();
    const { mood } = body;

    if (mood === undefined) {
      return Response.json({ error: "Mood value is required" }, { status: 400 });
    }

    // Forward POST request to your Render API
    const res = await fetch("https://serenity-recommendation-model.onrender.com/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood }),
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: "External API failed", detail: text }, { status: 500 });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error("Proxy error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
