import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: any) {
  const { tilePath } = params;
  if (!tilePath || tilePath.length === 0) {
    return new Response("Missing tile path", { status: 400 });
  }

  // Reconstruct the path for the OpenFreeMap tile server
  const url = `https://tiles.openfreemap.org/${tilePath.join("/")}`;
  console.log("proxy-tile debug:", { tilePath, url });

  try {
    const tileRes = await fetch(url);
    if (!tileRes.ok) {
      return new Response("Tile not found", { status: tileRes.status });
    }

    // Clone the response and set CORS and content headers
    const headers = new Headers(tileRes.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");

    return new Response(tileRes.body, {
      status: 200,
      headers,
    });
  } catch (err) {
    console.log(err);
    return new Response("Proxy error", { status: 500 });
  }
}
