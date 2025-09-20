"use server";

import { handleRateLimit } from "@/lib/rate-limit";
import SessionProvider from "@/lib/SessionProvider";
import "styles/tailwind.css"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const rateLimitResponse = await handleRateLimit();
  if (rateLimitResponse) {
    return (
      <html lang="en">
        <body><SessionProvider>{rateLimitResponse}</SessionProvider></body>
      </html>
    )
  }
  
  return (
    <html lang="en">
      <body><SessionProvider>{children}</SessionProvider></body>
    </html>
  )
}
