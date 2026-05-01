# F1 Live Timing — Cloudflare Worker Proxy

## Why This Exists

F1's live timing CDN (`livetiming.formula1.com`) is served through AWS CloudFront with a WAF that blocks entire datacenter IP ranges. Hetzner's AS24940 is one of those ranges, meaning any VPS on Hetzner (including the Turn One backend at `91.99.127.72`) gets a 403 from CloudFront before the request even reaches F1's servers.

The fix is a Cloudflare Worker that acts as an outbound proxy: the VPS backend sends requests to the Worker, the Worker forwards them to F1 from a Cloudflare edge IP (not blocked), and relays the response back.

The `/live` page frontend is not affected — browsers connect directly to F1 from the user's residential IP, which is never blocked.

---

## Architecture

```
VPS Backend (F1LiveTimingService)
    │
    │  HTTP: https://your-worker.workers.dev/signalr/negotiate
    │  WSS:  wss://your-worker.workers.dev/signalr/connect
    ▼
Cloudflare Worker (edge node, unblocked IP)
    │
    │  HTTP: https://livetiming.formula1.com/signalr/negotiate
    │  WSS:  wss://livetiming.formula1.com/signalr/connect
    ▼
F1 Live Timing API
```

The frontend `/live` page still connects **directly** from the browser — no proxy needed there.

---

## Cloudflare Worker Code

Deploy this in the Cloudflare dashboard → Workers & Pages → Create Worker.

```js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const f1Base = 'livetiming.formula1.com';
    const f1Headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://www.formula1.com/',
      'Origin': 'https://www.formula1.com',
    };

    // WebSocket proxy
    if (request.headers.get('Upgrade')?.toLowerCase() === 'websocket') {
      const wsUrl = `wss://${f1Base}${url.pathname}${url.search}`;
      const { 0: clientWs, 1: serverWs } = new WebSocketPair();
      serverWs.accept();
      try {
        const f1Ws = new WebSocket(wsUrl);
        f1Ws.addEventListener('message', e => { try { serverWs.send(e.data); } catch {} });
        f1Ws.addEventListener('close', e => { try { serverWs.close(e.code, e.reason); } catch {} });
        f1Ws.addEventListener('error', () => { try { serverWs.close(1011, 'F1 error'); } catch {} });
        serverWs.addEventListener('message', e => { try { f1Ws.send(e.data); } catch {} });
        serverWs.addEventListener('close', e => { try { f1Ws.close(e.code, e.reason); } catch {} });
      } catch (e) {
        serverWs.close(1011, e.message);
      }
      return new Response(null, { status: 101, webSocket: clientWs });
    }

    // HTTP proxy
    try {
      const resp = await fetch(`https://${f1Base}${url.pathname}${url.search}`, { headers: f1Headers });
      const headers = new Headers(resp.headers);
      headers.set('Access-Control-Allow-Origin', '*');
      return new Response(resp.body, { status: resp.status, headers });
    } catch (e) {
      return new Response(`F1 fetch failed: ${e.message}`, { status: 502 });
    }
  }
}
```

### Required Worker Settings

In the Cloudflare dashboard for your Worker:

- **Settings → Compatibility date**: set to `2024-01-01` or later — required for the `new WebSocket()` constructor to be available in Workers.

---

## Deployment Steps

### 1. Deploy the Worker

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → Workers & Pages → Create Worker
2. Paste the code above into the editor
3. Click **Deploy**
4. Note the worker URL: `https://your-worker-name.workers.dev`
5. Go to Settings → Compatibility date → set to `2024-01-01`

### 2. Configure the VPS

Add `F1_PROXY_URL` to the `.env` file on your VPS:

```
F1_PROXY_URL=https://your-worker-name.workers.dev
```

The backend reads this in `F1LiveTimingService.cs` and `F1LiveTimingController.cs`:

```csharp
_f1BaseUrl = Environment.GetEnvironmentVariable("F1_PROXY_URL") ?? "https://livetiming.formula1.com";
```

### 3. Redeploy the Backend

```bash
docker-compose pull api && docker-compose up -d api
```

Or for a full rebuild:

```bash
docker-compose up --build -d api
```

---

## Verification

After deploying, check backend logs for:

```
[INF] Connecting to F1 live timing...
[INF] F1 negotiation successful, token received
[INF] F1 WebSocket connected
```

Instead of:

```
[WRN] F1 negotiation failed: 403
```

You can also hit the status endpoint:

```bash
curl https://your-api-domain.com/api/f1livetiming/status
```

Expected response when Worker is working and a session is active:
```json
{ "available": true, "hasActiveSession": true, "timestamp": "..." }
```

Expected response when no race session is live (still means proxy works):
```json
{ "available": false, "hasActiveSession": false, ... }
```

---

## Cloudflare Worker Free Tier Limits

The Cloudflare Workers free tier includes:
- **100,000 requests/day**
- **10ms CPU time per request** (wall time is longer; WebSockets are handled differently)
- **WebSockets**: each WebSocket connection counts as 1 request, not per-message

During a race weekend the backend holds one persistent WebSocket connection, so the Worker usage is very low — well within free tier limits.

---

## Troubleshooting

| Symptom | Likely cause |
|---------|-------------|
| `403` from Worker | Compatibility date not set, or Worker not deployed |
| `502` from Worker | Worker deployed but `new WebSocket()` failing — check Worker logs in Cloudflare dashboard |
| `Connection refused` on VPS | `F1_PROXY_URL` not set or container not restarted after `.env` change |
| HTTP negotiate works, WebSocket 502 | Compatibility date missing — set to `2024-01-01` |
| Everything works locally but not on VPS | Confirm `F1_PROXY_URL` is set in the `.env` on the VPS, not just locally |

To see Worker real-time errors: Cloudflare dashboard → Workers & Pages → your worker → **Logs** tab → click **Begin log stream**.

---

## Local Development

No changes needed locally. The fallback in both service files is:

```csharp
_f1BaseUrl = Environment.GetEnvironmentVariable("F1_PROXY_URL") ?? "https://livetiming.formula1.com";
```

When `F1_PROXY_URL` is not set (local dev), requests go directly to F1. Your home/office IP is not blocked.

---

## Files Modified for This Feature

| File | Change |
|------|--------|
| `turn-one-backend/API/Services/F1LiveTimingService.cs` | Reads `F1_PROXY_URL`, uses it for negotiate URL and WebSocket URL |
| `turn-one-backend/API/Controllers/F1LiveTimingController.cs` | Reads `F1_PROXY_URL`, uses it for negotiate proxy endpoint |
| `docker-compose.yml` | Passes `F1_PROXY_URL` env var to API container |
| `turn-one-client/lib/f1LiveDataService.ts` | Negotiate called directly from browser (bypasses VPS entirely) |
