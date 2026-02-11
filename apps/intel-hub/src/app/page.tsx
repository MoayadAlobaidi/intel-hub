"use client";

import { useEffect, useMemo, useState } from "react";
import { checkOne, TabKey, TabStatus } from "@/utils/checkOne";

export default function Home() {
  const WM = process.env.NEXT_PUBLIC_WORLD_MONITOR_URL ?? "http://localhost:5173";
  const DI = process.env.NEXT_PUBLIC_DELTA_INTEL_URL ?? "http://localhost:3000";

  const tabs = useMemo(
    () => [
      { key: "worldmonitor" as const, label: "World Monitor", url: WM },
      { key: "deltaintel" as const, label: "Delta Intel", url: DI },
    ],
    [WM, DI]
  );

  const [active, setActive] = useState<TabKey>("worldmonitor");
  const [status, setStatus] = useState<Record<TabKey, TabStatus>>({
    worldmonitor: "checking",
    deltaintel: "checking",
  });

  useEffect(() => {
    const saved = localStorage.getItem("intelHub.activeTab") as TabKey | null;
    if (saved === "worldmonitor" || saved === "deltaintel") setActive(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("intelHub.activeTab", active);
  }, [active]);

  const handleCheckOne = (key: TabKey, url: string) => {
    checkOne({ key, url, setStatus });
  };

  useEffect(() => {
    // initial + periodic health check
    tabs.forEach((t) => handleCheckOne(t.key, t.url));
    const id = setInterval(() => tabs.forEach((t) => handleCheckOne(t.key, t.url)), 15000);
    return () => clearInterval(id);
  }, [tabs]);

  const activeTab = tabs.find((t) => t.key === active)!;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderBottom: "1px solid #2a2a2a" }}>
        <div style={{ fontWeight: 700 }}>Intel Hub</div>
        <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              style={{
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid #2a2a2a",
                background: active === t.key ? "#1f1f1f" : "transparent",
                color: "inherit",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>{t.label}</span>
              <span style={{ fontSize: 12, opacity: 0.8 }}>
                {status[t.key] === "checking" ? "…" : status[t.key]}
              </span>
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => window.open(activeTab.url, "_blank")}
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #2a2a2a", background: "transparent", color: "inherit", cursor: "pointer" }}
          >
            Open in new tab
          </button>
          <button
            onClick={() => handleCheckOne(activeTab.key, activeTab.url)}
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #2a2a2a", background: "transparent", color: "inherit", cursor: "pointer" }}
          >
            Refresh status
          </button>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <iframe
          key={activeTab.key}
          src={activeTab.url}
          style={{ width: "100%", height: "100%", border: "0" }}
          allow="clipboard-read; clipboard-write"
        />
      </main>
    </div>
  );
}
