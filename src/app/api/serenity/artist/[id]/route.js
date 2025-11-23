import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const response = await fetch(
      `https://saavn.dev/api/artists/${id}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch artist data");
    }

    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Artist API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch artist data", message: error.message },
      { status: 500 }
    );
  }
}
