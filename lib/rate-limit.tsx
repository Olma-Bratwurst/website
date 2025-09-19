import { headers } from "next/headers";

const idToRequestCount = new Map<string, number>();
const rateLimiter = {
  windowStart: Date.now(),
  windowSize: 60 * 1000, // Milliseconds (currently 1 minute)
  maxRequests: 20,
};

const rateLimit = (ip: string) => {
  // console.log("Before: ", idToRequestCount)
  // Check and update current window
  const now = Date.now();
  const isNewWindow = now - rateLimiter.windowStart > rateLimiter.windowSize;
  if (isNewWindow) {
    rateLimiter.windowStart = now;
    idToRequestCount.set(ip, 0);
  }

  // Check and update current request limits
  const currentRequestCount = idToRequestCount.get(ip) ?? 0;
  if (currentRequestCount >= rateLimiter.maxRequests) {
    return true;
  }
  idToRequestCount.set(ip, currentRequestCount + 1);

  return false;
};

export async function handleRateLimit() {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const isRateLimited = await rateLimit(ip);

  if (isRateLimited) {
    // console.log("Rate Limit is hit!");
    return (
      <div className="relative h-screen flex justify-center items-center">
        <div>
          <p>You hit the rate limit! Please try again later.</p>
        </div>
      </div>
    );
  }

  return null;
}
