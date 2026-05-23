"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasCredentials } from "@/lib/credentials";
import { BuilderApp } from "@/components/builder-app";

export function CredentialsGate() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasCredentials()) {
      router.replace("/onboarding");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return null;
  }

  return <BuilderApp />;
}
