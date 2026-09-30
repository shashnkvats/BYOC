"use client";

import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import type { McpAuthType, McpDiscoverResponse } from "@/lib/types";

const AUTH_OPTIONS: { value: McpAuthType; label: string }[] = [
  { value: "none", label: "No authentication" },
  { value: "bearer", label: "Bearer token" },
  { value: "api_key", label: "API key" },
];

export function McpImportConnect({
  onBack,
  onDiscovered,
}: {
  onBack: () => void;
  onDiscovered: (result: McpDiscoverResponse) => void;
}) {
  const [url, setUrl] = useState("");
  const [authType, setAuthType] = useState<McpAuthType>("bearer");
  const [credential, setCredential] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError("Enter a server URL.");
      return;
    }
    if (authType !== "none" && !credential.trim()) {
      setError(
        authType === "api_key"
          ? "Enter an API key."
          : "Enter a bearer token.",
      );
      return;
    }

    setConnecting(true);
    setError(null);
    try {
      const result = await api.discoverMcpTools({
        url: trimmedUrl,
        auth_type: authType,
        credential: authType === "none" ? undefined : credential,
      });
      onDiscovered(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Couldn't reach BYOC to discover tools. Try again in a moment.");
      }
      setConnecting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[56rem]">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-sm text-ink-mute hover:text-ink"
      >
        <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
        Back to tool selector
      </button>

      <p className="kicker mt-6">Import tools</p>
      <h1 className="display-page mt-1">Connect an MCP server</h1>
      <p className="mt-2.5 max-w-xl text-[15px] font-normal leading-6 text-ink-mute">
        Connect to a server and BYOC will discover the tools it exposes. You can choose exactly
        which ones to add to this selector.
      </p>

      <form onSubmit={handleConnect}>
        <article className="card mt-8 p-5 sm:p-6">
          <p className="kicker">Server connection</p>
          <h2 className="display-section mt-1">Where should BYOC look?</h2>
          <p className="mt-2 max-w-xl text-[0.92rem] leading-[1.55] text-ink-mute">
            Enter the MCP endpoint and authentication needed for tool discovery.
          </p>

          <label htmlFor="mcp-server-url" className="label mt-6 block">
            Server URL
          </label>
          <input
            id="mcp-server-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://mcp.example.com/mcp"
            autoComplete="off"
            spellCheck={false}
            disabled={connecting}
            className="field mt-2"
          />

          <label htmlFor="mcp-auth-type" className="label mt-6 block">
            Authentication
          </label>
          <select
            id="mcp-auth-type"
            value={authType}
            onChange={(e) => setAuthType(e.target.value as McpAuthType)}
            disabled={connecting}
            className="field mt-2"
          >
            {AUTH_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {authType !== "none" && (
            <>
              <label htmlFor="mcp-credential" className="label mt-6 block">
                {authType === "api_key" ? "API key" : "Token"}
              </label>
              <input
                id="mcp-credential"
                type="password"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="••••••••••••••••"
                autoComplete="new-password"
                disabled={connecting}
                className="field mt-2 font-mono text-sm"
              />
            </>
          )}

          <div className="mt-6 flex gap-3 rounded-[0.875rem] border border-line bg-[#fbf7ef] px-4 py-3.5">
            <Shield
              size={16}
              strokeWidth={1.75}
              className="mt-0.5 shrink-0 text-copper"
              aria-hidden="true"
            />
            <div>
              <p className="text-[0.92rem] font-semibold text-ink">Discovery only</p>
              <p className="mt-1 text-[0.85rem] leading-[1.5] text-ink-mute">
                BYOC will connect to discover tool names and descriptions. No MCP tool will be
                executed during import.
              </p>
            </div>
          </div>

          {connecting && (
            <p className="mt-4 flex items-center gap-2 text-sm text-ink-mute">
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              Connecting and discovering tools…
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 text-sm text-danger">
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={connecting}
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={connecting}
              className="btn btn-copper text-[14px] font-semibold"
            >
              {connecting ? "Discovering…" : "Connect & discover"}
            </button>
          </div>
        </article>
      </form>
    </div>
  );
}
