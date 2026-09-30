"use client";

import { ArrowLeft, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import type { McpDiscoveredTool, McpDiscoverResponse } from "@/lib/types";

export function McpImportSelect({
  discovery,
  onBack,
  onCancel,
  onImport,
}: {
  discovery: McpDiscoverResponse;
  onBack: () => void;
  onCancel: () => void;
  onImport: (tools: McpDiscoveredTool[]) => void;
}) {
  const tools = discovery.tools;
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(tools.map((tool) => tool.name)),
  );

  const selectedTools = useMemo(
    () => tools.filter((tool) => selected.has(tool.name)),
    [tools, selected],
  );

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-[56rem]">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 border-0 bg-transparent p-0 text-sm text-ink-mute hover:text-ink"
      >
        <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
        Back to connection
      </button>

      <p className="kicker mt-6">Import tools</p>
      <h1 className="display-page mt-1">Choose tools to import</h1>
      <p className="mt-2.5 max-w-xl text-[15px] font-normal leading-6 text-ink-mute">
        BYOC found {tools.length} {tools.length === 1 ? "tool" : "tools"} on {discovery.server}.
        Select which ones to add to this selector.
      </p>

      <article className="card mt-8 p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="kicker">Discovered tools</p>
            <h2 className="display-section mt-1">Which tools should Jev choose among?</h2>
          </div>
          {tools.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setSelected(
                  selected.size === tools.length
                    ? new Set()
                    : new Set(tools.map((tool) => tool.name)),
                )
              }
              className="border-0 bg-transparent p-0 text-[13px] font-semibold text-copper"
            >
              {selected.size === tools.length ? "Clear selection" : "Select all"}
            </button>
          )}
        </div>

        {tools.length === 0 ? (
          <p className="mt-6 text-sm text-ink-mute">
            This server didn&apos;t expose any tools. Go back and try a different endpoint.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-[11px]">
            {tools.map((tool) => {
              const checked = selected.has(tool.name);
              return (
                <li key={tool.name}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-[0.875rem] border border-line bg-[#fbf7ef] p-4">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(tool.name)}
                      className="mt-1.5 accent-[var(--copper)]"
                    />
                    <span className="mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-lg border border-line text-copper">
                      <Zap size={14} strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-sm text-ink">{tool.name}</span>
                      <span className="mt-1 block text-[0.88rem] leading-[1.5] text-ink-mute">
                        {tool.description.trim() || "No description provided."}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onImport(selectedTools)}
            disabled={selectedTools.length === 0}
            className="btn btn-copper text-[14px] font-semibold"
          >
            Add selected tools
          </button>
        </div>
      </article>
    </div>
  );
}
