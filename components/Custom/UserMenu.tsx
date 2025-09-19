"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { NavUser } from "../Shadcn/nav-user";

export default function UserMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;
  // console.log("session: ", session)

  if (!session)
    return (
      <button onClick={() => signIn("google")} className="px-4 py-2  rounded">
        Sign in
      </button>
    );

  return (
    <div className="relative">
      <NavUser
        user={{
            name: session.user?.name ?? "",
            email: session.user?.email ?? "",
            image: session.user?.image ?? "",
        }}
        />
    </div>
  );
}