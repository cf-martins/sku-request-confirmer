export async function POST({ request }) {
  const targetURL = request.headers.get("Target-URL");
  if (!targetURL) {
    return new Response("Missing Target-URL header", { status: 400 });
  }
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const authHeader = request.headers.get("Authorization");
  if (authHeader) {
    headers.Authorization = authHeader;
  }

  const body = await request.text();
  const response = await fetch(targetURL, {
    method: "POST",
    headers,
    body,
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
    },
  });
}

export async function GET({ request }) {
  const targetURL = request.headers.get("Target-URL");
  const params = new URL(request.url).searchParams;
  try {
    const response = await fetch(`${targetURL}?${params.toString()}`, {
      method: "GET",
      headers: {
        ...(request.headers.get("Content-Type") && {
          "Content-Type": request.headers.get("Content-Type") || "",
        }),
      },
    });

    const contentType = response.headers.get("Content-Type");
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        ...(contentType && { "Content-Type": contentType }),
      },
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
