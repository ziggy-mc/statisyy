type RequestContext = Readonly<{
  clientIp: string;
  requestId: string | null;
  userAgent: string | null;
}>;

const UNKNOWN_CLIENT_IP = "unknown";

function readClientIpFromForwardedFor(forwardedFor: string | null): string | null {
  if (!forwardedFor) {
    return null;
  }

  const [rawIp] = forwardedFor.split(",");
  const clientIp = rawIp?.trim();

  if (!clientIp) {
    return null;
  }

  return clientIp.slice(0, 128);
}

export async function getRequestContext(): Promise<RequestContext> {
  const { headers } = await import("next/headers");
  const headerStore = headers() as unknown as Headers;
  const forwardedFor = headerStore.get("x-forwarded-for");
  const realIp = headerStore.get("x-real-ip");
  const clientIp =
    readClientIpFromForwardedFor(forwardedFor) ??
    realIp?.trim().slice(0, 128) ??
    UNKNOWN_CLIENT_IP;
  const requestIdHeader = headerStore.get("x-request-id");
  const userAgentHeader = headerStore.get("user-agent");

  return {
    clientIp,
    requestId: requestIdHeader?.trim().slice(0, 128) ?? null,
    userAgent: userAgentHeader?.trim().slice(0, 512) ?? null,
  };
}
