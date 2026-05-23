"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasCredentials } from "@/lib/credentials";
import { BuilderApp } from "@/components/builder-app";
import styles from "./credentials-gate.module.css";

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
    return (
      <div className={styles.loading} aria-busy="true" aria-label="Loading">
        <div className={styles.loader} />
      </div>
    );
  }

  return <BuilderApp />;
}
