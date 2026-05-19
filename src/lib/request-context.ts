type RequestContext = Readonly<{
  clientIp: string;
  requestId: string | null;
  userAgent: string | null;
}>;

const UNKNOWN_CLIENT_IP = "unknown";
const MAX_LOG_MESSAGE_LENGTH = 200;

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

function getDebugErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.slice(0, MAX_LOG_MESSAGE_LENGTH);
  }

  return String(error).slice(0, MAX_LOG_MESSAGE_LENGTH);
}

export async function getRequestContextSafe(source: string): Promise<RequestContext> {
  try {
    return await getRequestContext();
  } catch (error: unknown) {
    console.debug("[request-context] failed to read request context", {
      error: getDebugErrorMessage(error),
      source,
    });

    return {
      clientIp: UNKNOWN_CLIENT_IP,
      requestId: null,
      userAgent: null,
    };
  }
}
