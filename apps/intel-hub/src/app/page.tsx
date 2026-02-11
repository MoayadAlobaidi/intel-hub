"use client";

import { useEffect, useMemo, useState, lazy, Suspense } from "react";

type TabKey = "worldmonitor" | "deltaintel";

const DeltaDashboard = lazy(() => import("./deltaintel/DeltaDashboard"));

function DeltaIntelLoading() {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
      <span style={{ color: "#52525b", fontSize: 12 }}>Loading Delta Intelligence...</span>
    </div>
  );
}

export default function Home() {
  const WM = process.env.NEXT_PUBLIC_WORLD_MONITOR_URL ?? "http://localhost:5173";

  const [active, setActive] = useState<TabKey>("worldmonitor");
  const [wmStatus, setWmStatus] = useState<"checking" | "online" | "offline">("checking");

  useEffect(() => {
    const saved = localStorage.getItem("intelHub.activeTab") as TabKey | null;
    if (saved === "worldmonitor" || saved === "deltaintel") setActive(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("intelHub.activeTab", active);
  }, [active]);

  async function checkWorldMonitor() {
    setWmStatus("checking");
    try {
      const r = await fetch(`/api/ping?url=${encodeURIComponent(WM)}`, { cache: "no-store" });
      const j = await r.json();
      setWmStatus(j.ok ? "online" : "offline");
    } catch {
      setWmStatus("offline");
    }
  }

  useEffect(() => {
    checkWorldMonitor();
    const id = setInterval(checkWorldMonitor, 15000);
    return () => clearInterval(id);
  }, [WM]);

  const tabs = useMemo(
    () => [
      { key: "worldmonitor" as const, label: "World Monitor" },
      { key: "deltaintel" as const, label: "Delta Intel" },
    ],
    []
  );

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="intel-hub-header">
        <div style={{ fontWeight: 700 }}>Intel Hub</div>
        <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`intel-hub-tab${active === t.key ? " active" : ""}`}
            >
              <span>{t.label}</span>
              {t.key === "worldmonitor" && (
                <span style={{ fontSize: 12, opacity: 0.8 }}>
                  {wmStatus === "checking" ? "\u2026" : wmStatus}
                </span>
              )}
              {t.key === "deltaintel" && (
                <span style={{ fontSize: 12, opacity: 0.8 }}>
                  integrated
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {active === "worldmonitor" && (
            <>
              <button
                onClick={() => window.open(WM, "_blank")}
                className="intel-hub-action"
              >
                Open in new tab
              </button>
              <button
                onClick={checkWorldMonitor}
                className="intel-hub-action"
              >
                Refresh status
              </button>
            </>
          )}
        </div>
      </header>

      <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* WorldMonitor: iframe (only shown when active, keeps alive in background) */}
        <div style={{ flex: 1, display: active === "worldmonitor" ? "flex" : "none" }}>
          <iframe
            src={WM}
            style={{ width: "100%", height: "100%", border: "0" }}
            allow="clipboard-read; clipboard-write"
          />
        </div>

        {/* DeltaIntel: native React (only shown when active) */}
        <div style={{ flex: 1, display: active === "deltaintel" ? "flex" : "none", flexDirection: "column" }}>
          <Suspense fallback={<DeltaIntelLoading />}>
            <DeltaDashboard />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
