async function handler(req: Request): Promise<Response> {
  const incomingUrl = new URL(req.url);
  if (incomingUrl.pathname === "/") {
    return new Response(
      "此地址只用于为astrbot提供更快速的github访问服务",
      {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      }
    );
  }
  const targetUrlString = decodeURIComponent(incomingUrl.pathname.slice(1));
  if (!targetUrlString || (!targetUrlString.startsWith("http://") && !targetUrlString.startsWith("https://"))) {
    return new Response("Invalid or missing target URL in path. Usage: /<target_url>", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  // 白名单：只允许github域名，防止被滥用
  const allowHosts = ["github.com", "raw.githubusercontent.com"];
  const targetUrl = new URL(targetUrlString);
  if (!allowHosts.includes(targetUrl.host)) {
    return new Response("Only github proxy allowed", { status:403 });
  }

  console.log(`Proxying request to: ${targetUrlString}`);
  try {
    const response = await fetch(targetUrlString, {
      headers: req.headers,
      method: req.method,
      body: req.body,
      redirect: 'manual',
    });
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, *");
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: responseHeaders
      });
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`Error fetching ${targetUrlString}:`, error);
    return new Response(`Failed to proxy request to ${targetUrlString}: ${error.message}`, {
      status: 502,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
console.log("此地址只用于帮助astrbot更快的连接github");
// Deno.serve 默认监听0.0.0.0，Deno Deploy自动分配端口，无需手动指定
Deno.serve(handler);
