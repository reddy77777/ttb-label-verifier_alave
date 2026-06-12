"use client";

import React, { useState, useEffect } from "react";
import LoginView from "@/components/LoginView";
import DashboardView from "@/components/DashboardView";
import VerificationDetailView from "@/components/VerificationDetailView";

interface QueueItem {
  id: string;
  file?: File;
  fileName: string;
  previewUrl: string;
  selectedAppId: string;
  status: "pending" | "processing" | "success" | "failed";
  progress: number;
  result?: any;
  decision?: "APPROVED" | "REJECTED" | "FLAGGED";
}

// Global in-memory cache to preserve File objects across state transitions and hot reloads
const fileCache: Record<string, File> = {};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const sanitizeContext = (ctx: any): any => {
  if (!ctx) return null;
  try {
    return JSON.parse(
      JSON.stringify(ctx, (key, value) => {
        if (value instanceof File) {
          return { name: value.name, size: value.size, type: value.type };
        }
        if (value instanceof FileList) {
          return Array.from(value).map(f => ({ name: f.name, size: f.size, type: f.type }));
        }
        return value;
      })
    );
  } catch (e) {
    return { error: "Unserializable context" };
  }
};

const sendClientLog = (level: "info" | "error", message: string, context?: any) => {
  console.log(`[${level.toUpperCase()}] ${message}`, context || "");
  if (typeof window !== "undefined") {
    fetch(`${API_URL}/api/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, message, context: sanitizeContext(context) }),
    }).catch(() => {});
  }
};

export default function Home() {
  const [mounted, setMounted] = useState(false);

  // Synchronously initialize states from sessionStorage on the client to avoid race conditions
  const [view, setView] = useState<"login" | "dashboard" | "inspect">(() => {
    if (typeof window !== "undefined") {
      try {
        return (sessionStorage.getItem("ttb_view") as any) || "login";
      } catch (e) {
        return "login";
      }
    }
    return "login";
  });

  const [userEmail, setUserEmail] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return sessionStorage.getItem("ttb_userEmail") || "";
      } catch (e) {
        return "";
      }
    }
    return "";
  });

  const [queue, setQueue] = useState<QueueItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("ttb_queue");
        if (saved) {
          const parsed = JSON.parse(saved) as QueueItem[];
          return parsed.map(item => ({
            ...item,
            file: fileCache[item.id] || item.file
          }));
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [inspectData, setInspectData] = useState<any>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("ttb_inspectData");
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Client-side mount indicator
  useEffect(() => {
    setMounted(true);
    sendClientLog("info", "Home component mounted client-side", {
      sessionStorageState: {
        email: typeof window !== "undefined" ? sessionStorage.getItem("ttb_userEmail") : null,
        view: typeof window !== "undefined" ? sessionStorage.getItem("ttb_view") : null,
        queuePresent: typeof window !== "undefined" ? !!sessionStorage.getItem("ttb_queue") : null
      }
    });
  }, []);

  // Diagnostic state changes logging
  useEffect(() => {
    if (!mounted) return;
    sendClientLog("info", `State update: view=${view}, email=${userEmail}, queueLength=${queue.length}`, {
      queue: queue.map(q => ({ id: q.id, status: q.status, selectedAppId: q.selectedAppId, decision: q.decision })),
      inspectDataPresent: !!inspectData
    });
  }, [view, userEmail, queue.length, inspectData, mounted]);

  // Synchronize state changes back to sessionStorage
  useEffect(() => {
    if (!mounted) return;
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("ttb_userEmail", userEmail);
        sessionStorage.setItem("ttb_view", view);
        if (inspectData) {
          sessionStorage.setItem("ttb_inspectData", JSON.stringify(inspectData));
        } else {
          sessionStorage.removeItem("ttb_inspectData");
        }

        // Cache File handles in memory
        queue.forEach(item => {
          if (item.file) {
            fileCache[item.id] = item.file;
          }
        });

        const queueToSave = queue.map(({ file, ...rest }) => rest);
        sessionStorage.setItem("ttb_queue", JSON.stringify(queueToSave));
      } catch (e) {
        sendClientLog("error", "Failed to save state to sessionStorage", { error: String(e) });
      }
    }
  }, [userEmail, view, queue, inspectData, mounted]);

  const handleLoginSuccess = (email: string) => {
    sendClientLog("info", "handleLoginSuccess called", { email });
    setUserEmail(email);
    setView("dashboard");
  };

  const handleLogout = () => {
    sendClientLog("info", "handleLogout called");
    setUserEmail("");
    setView("login");
    setInspectData(null);
    queue.forEach((x) => URL.revokeObjectURL(x.previewUrl));
    setQueue([]);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.clear();
      } catch (e) {
        sendClientLog("error", "Failed to clear sessionStorage on logout", { error: String(e) });
      }
    }
  };

  const handleInspectResult = (
    itemId: string,
    appData: any,
    rawOcr: string,
    resultFields: any,
    fileUrl: string,
    status: string,
    reason: string
  ) => {
    sendClientLog("info", "handleInspectResult called", { itemId, app_id: appData?.app_id });
    setInspectData({
      itemId,
      appSummary: appData,
      rawOcrText: rawOcr,
      fields: resultFields,
      fileUrl,
      status,
      reason
    });
    setView("inspect");
  };

  // Render a consistent initial layout to match the SSR representation (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
        <div className="text-center font-semibold">Loading portal session...</div>
      </div>
    );
  }

  return (
    <>
      {view === "login" ? (
        <LoginView onLoginSuccess={handleLoginSuccess} />
      ) : (
        <>
          <div className={view === "dashboard" ? "" : "hidden"}>
            <DashboardView
              userEmail={userEmail}
              onLogout={handleLogout}
              onInspectResult={handleInspectResult}
              queue={queue}
              setQueue={setQueue}
            />
          </div>
          
          {view === "inspect" && inspectData && (
            <VerificationDetailView
              appSummary={inspectData.appSummary}
              rawOcrText={inspectData.rawOcrText}
              fields={inspectData.fields}
              fileUrl={inspectData.fileUrl}
              status={inspectData.status}
              reason={inspectData.reason}
              onBack={() => {
                sendClientLog("info", "onBack called - returning to dashboard");
                setView("dashboard");
                setInspectData(null);
              }}
              itemId={inspectData.itemId}
              onRegisterDecision={(itemId, decision) => {
                sendClientLog("info", "onRegisterDecision callback triggered", { itemId, decision });
                setQueue((prev) => {
                  const updated = prev.map((x) =>
                    x.id === itemId ? { ...x, decision } : x
                  );
                  return updated;
                });
              }}
            />
          )}
        </>
      )}
    </>
  );
}
