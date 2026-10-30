"use client"

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();

    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleSignOut} className="cursor-pointer">
      Sign Out
    </button>
  )
}