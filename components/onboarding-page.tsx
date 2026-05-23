"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DEFAULT_TEMPLATE_REPO_REF,
  DEFAULT_TEMPLATE_REPO_URL,
  defaultCredentials,
  hasCredentials,
  loadCredentials,
  saveCredentials,
  type UserCredentials,
} from "@/lib/credentials";
import styles from "./onboarding-page.module.css";

type VerifyState = "idle" | "checking" | "success" | "error";

export function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState<UserCredentials>(defaultCredentials());
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [showCursorKey, setShowCursorKey] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);

  useEffect(() => {
    const existing = loadCredentials();
    if (existing) {
      setForm(existing);
    }
  }, []);

  const updateField = <K extends keyof UserCredentials>(key: K, value: UserCredentials[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setVerifyState("idle");
    setVerifyMessage("");
  };

  const canSubmit =
    form.cursorApiKey.trim().length > 0 &&
    form.githubToken.trim().length > 0 &&
    form.templateRepoUrl.trim().length > 0;

  const handleVerify = async () => {
    if (!canSubmit) return;

    setVerifyState("checking");
    setVerifyMessage("");

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Verification failed");
      }

      setVerifyState(data.ok ? "success" : "error");
      setVerifyMessage(data.message ?? "");
    } catch (err) {
      setVerifyState("error");
      setVerifyMessage(err instanceof Error ? err.message : "Verification failed");
    }
  };

  const handleSave = () => {
    if (!canSubmit) return;
    saveCredentials(form);
    router.push("/");
  };

  const handleClear = () => {
    setForm(defaultCredentials());
    setVerifyState("idle");
    setVerifyMessage("");
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <span className={styles.logo} aria-hidden />
            <span>Cursor SDK Web</span>
          </div>
          <h1>Set up your keys</h1>
          <p>
            Keys stay in your browser&apos;s local storage and are sent to this app&apos;s API
            routes when you generate or export. They are never written to the template repo.
          </p>
        </header>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.step}>1</span>
            <div>
              <h2>Cursor API key</h2>
              <p>
                Used to run cloud agents. Get one from{" "}
                <a
                  href="https://cursor.com/settings"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.externalLink}
                  aria-label="Cursor Settings (opens in new tab)"
                >
                  Cursor Settings<span aria-hidden> ↗</span>
                </a>
                .
              </p>
            </div>
          </div>
          <label className={styles.field}>
            <span>API key</span>
            <div className={styles.secretRow}>
              <input
                type={showCursorKey ? "text" : "password"}
                value={form.cursorApiKey}
                onChange={(e) => updateField("cursorApiKey", e.target.value)}
                placeholder="cur_..."
                autoComplete="off"
              />
              <button
                type="button"
                className={styles.revealBtn}
                onClick={() => setShowCursorKey((v) => !v)}
                aria-label={showCursorKey ? "Hide API key" : "Show API key"}
              >
                {showCursorKey ? "Hide" : "Show"}
              </button>
            </div>
          </label>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.step}>2</span>
            <div>
              <h2>GitHub token</h2>
              <p>
                Used to read generated files from your template repo. Create a classic PAT with{" "}
                <code>repo</code> scope on{" "}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.externalLink}
                  aria-label="GitHub token settings (opens in new tab)"
                >
                  GitHub<span aria-hidden> ↗</span>
                </a>
                .
              </p>
            </div>
          </div>
          <label className={styles.field}>
            <span>Personal access token</span>
            <div className={styles.secretRow}>
              <input
                type={showGithubToken ? "text" : "password"}
                value={form.githubToken}
                onChange={(e) => updateField("githubToken", e.target.value)}
                placeholder="ghp_..."
                autoComplete="off"
              />
              <button
                type="button"
                className={styles.revealBtn}
                onClick={() => setShowGithubToken((v) => !v)}
                aria-label={showGithubToken ? "Hide GitHub token" : "Show GitHub token"}
              >
                {showGithubToken ? "Hide" : "Show"}
              </button>
            </div>
          </label>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.step}>3</span>
            <div>
              <h2>Template repository</h2>
              <p>
                The cloud agent clones this repo and writes to{" "}
                <code>sites/&lt;sessionId&gt;/</code>. Fork{" "}
                <a
                  href={DEFAULT_TEMPLATE_REPO_URL}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.externalLink}
                  aria-label="cursor-sdk-web-template repository (opens in new tab)"
                >
                  cursor-sdk-web-template<span aria-hidden> ↗</span>
                </a>{" "}
                and connect it to your Cursor account.
              </p>
            </div>
          </div>
          <label className={styles.field}>
            <span>Repository URL</span>
            <input
              type="url"
              value={form.templateRepoUrl}
              onChange={(e) => updateField("templateRepoUrl", e.target.value)}
              placeholder={DEFAULT_TEMPLATE_REPO_URL}
            />
          </label>
          <label className={styles.field}>
            <span>Branch</span>
            <input
              type="text"
              value={form.templateRepoRef}
              onChange={(e) => updateField("templateRepoRef", e.target.value)}
              placeholder={DEFAULT_TEMPLATE_REPO_REF}
            />
          </label>
        </section>

        {verifyMessage ? (
          <div
            role="alert"
            aria-live="polite"
            className={
              verifyState === "success" ? styles.verifySuccess : styles.verifyError
            }
          >
            {verifyMessage}
          </div>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleVerify}
            disabled={!canSubmit || verifyState === "checking"}
          >
            {verifyState === "checking" ? "Checking…" : "Test connection"}
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleSave}
            disabled={!canSubmit}
          >
            Save and continue
          </button>
        </div>

        <footer className={styles.footer}>
          {hasCredentials() ? (
            <Link href="/" className={styles.link}>
              Back to builder
            </Link>
          ) : null}
          <button type="button" className={styles.linkBtn} onClick={handleClear}>
            Clear form
          </button>
        </footer>
      </div>
    </div>
  );
}
