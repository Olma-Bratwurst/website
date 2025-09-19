"use server";

import { handleRateLimit } from "@/lib/rate-limit";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const rateLimitResponse = await handleRateLimit();
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  return <>{children}</>;
}
