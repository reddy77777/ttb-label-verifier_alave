"use client";

import React, { useState, useEffect } from "react";

interface ApplicationSummary {
  app_id: string;
  brand_name: string;
  class_type: string;
}

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

interface DashboardViewProps {
  userEmail: string;
  onLogout: () => void;
  onInspectResult: (itemId: string, appData: any, rawOcr: string, resultFields: any, fileUrl: string, status: string, reason: string) => void;
  queue: QueueItem[];
  setQueue: React.Dispatch<React.SetStateAction<QueueItem[]>>;
}

export default function DashboardView({ userEmail, onLogout, onInspectResult, queue, setQueue }: DashboardViewProps) {
  const [apps, setApps] = useState<ApplicationSummary[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [apiError, setApiError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch applications list on mount
  useEffect(() => {
    fetch(`${API_URL}/api/applications`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch mock applications database");
        return res.json();
      })
      .then((data) => {
        setApps(data);
        setLoadingApps(false);
      })
      .catch((err) => {
        console.error(err);
        setApiError("Backend connection failed. Please ensure the backend server is running.");
        setLoadingApps(false);
      });
  }, [API_URL]);

  const detectAppId = (filename: string): string => {
    // Look for patterns like TTB-2024-001 or 2024-001 or 001
    const cleanName = filename.toUpperCase();
    if (cleanName.includes("TTB-2024-001") || cleanName.includes("001")) return "TTB-2024-001";
    if (cleanName.includes("TTB-2024-002") || cleanName.includes("002")) return "TTB-2024-002";
    if (cleanName.includes("TTB-2024-003") || cleanName.includes("003")) return "TTB-2024-003";
    return "";
  };

  const handleFiles = (fileList: FileList) => {
    const newItems: QueueItem[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith("image/")) continue;
      
      const detectedId = detectAppId(file.name);
      // Default to detectedId or first app ID, or empty
      const defaultId = detectedId || (apps.length > 0 ? apps[0].app_id : "");

      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        fileName: file.name,
        previewUrl: URL.createObjectURL(file),
        selectedAppId: defaultId,
        status: "pending",
        progress: 0,
      });
    }

    console.log("[DashboardView] handleFiles adding new items:", newItems);
    setQueue((prev) => [...newItems, ...prev]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeQueueItem = (id: string) => {
    console.log("[DashboardView] removeQueueItem called for id:", id);
    setQueue((prev) => {
      const item = prev.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((x) => x.id !== id);
    });
  };

  const verifyItem = async (id: string) => {
    console.log("[DashboardView] verifyItem called for id:", id);
    const item = queue.find((x) => x.id === id);
    if (!item || !item.selectedAppId) return;

    if (!item.file) {
      alert("File is no longer in browser memory. Please drag-and-drop or upload the image again to perform verification.");
      return;
    }

    // Set processing status
    setQueue((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: "processing", progress: 30 } : x))
    );

    const formData = new FormData();
    formData.append("app_id", item.selectedAppId);
    formData.append("file", item.file);

    try {
      const response = await fetch(`${API_URL}/api/verify`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Verification request failed");
      const result = await response.json();

      setQueue((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: "success", progress: 100, result } : x))
      );
    } catch (err) {
      console.error(err);
      setQueue((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: "failed", progress: 100 } : x))
      );
    }
  };

  const verifyAllPending = async () => {
    const pendings = queue.filter((x) => x.status === "pending");
    console.log("[DashboardView] verifyAllPending called for pending count:", pendings.length);
    for (const item of pendings) {
      await verifyItem(item.id);
    }
  };

  const clearQueue = () => {
    console.log("[DashboardView] clearQueue called!");
    queue.forEach((x) => URL.revokeObjectURL(x.previewUrl));
    setQueue([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* Government Banner Header */}
      <header className="bg-[#0f2d59] text-white border-b-4 border-slate-400 py-4 px-6 flex justify-between items-center shadow-md">
        <div>
          <h1 className="text-lg font-bold tracking-wider uppercase">TTB Compliance Portal</h1>
          <p className="text-xs text-slate-300">Alcohol Label Auto-Verification Engine (ALAVE) • PROTOTYPE</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-200">Active Officer:</p>
            <p className="text-sm font-bold text-white">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider border border-slate-500 rounded-none cursor-pointer focus-ring"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        
        {apiError && (
          <div className="p-4 bg-red-100 border-l-4 border-red-600 text-red-900 font-bold text-sm">
            {apiError}
          </div>
        )}

        {/* Drag and Drop Zone */}
        <section className="bg-white border border-slate-300 p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">
            1. Upload Label Artwork
          </h2>
          
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-none p-8 text-center transition-colors focus-ring ${
              dragActive ? "border-blue-900 bg-slate-100" : "border-slate-300 bg-slate-50"
            }`}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
            />
            
            <label htmlFor="file-upload" className="cursor-pointer">
              <svg className="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-bold text-slate-700">
                Drag & Drop label images here, or click to browse
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Supports batch uploads (Max 50 images). Standard image formats only (.jpg, .jpeg, .png).
              </p>
            </label>
          </div>
        </section>

        {/* Queue & Verification Table */}
        <section className="bg-white border border-slate-300 p-6 shadow-sm">
          
          <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
            <h2 className="text-base font-bold text-slate-800 uppercase tracking-wider">
              2. Verification Queue & Datatable
            </h2>
            {queue.length > 0 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={verifyAllPending}
                  className="px-4 py-2 bg-[#0f2d59] hover:bg-[#081e3d] text-white text-xs font-bold uppercase tracking-wider rounded-none cursor-pointer focus-ring"
                >
                  Verify All Pending ({queue.filter(x => x.status === 'pending').length})
                </button>
                <button
                  type="button"
                  onClick={clearQueue}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold uppercase tracking-wider border border-slate-300 rounded-none cursor-pointer focus-ring"
                >
                  Clear Queue
                </button>
              </div>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No label uploads in queue. Upload images above to begin compliance verification.
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-300">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 uppercase text-xs font-bold text-slate-600">
                    <th className="p-3">Label Image</th>
                    <th className="p-3">Filename</th>
                    <th className="p-3">Target Application ID</th>
                    <th className="p-3">Verification Status</th>
                    <th className="p-3">OCR Conf.</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {queue.map((item) => {
                    const matchedApp = apps.find(a => a.app_id === item.selectedAppId);
                    
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        {/* Preview */}
                        <td className="p-3">
                          <img
                            src={item.previewUrl}
                            alt="Label Thumbnail"
                            className="w-12 h-12 object-contain border border-slate-300"
                          />
                        </td>
                        
                        {/* Filename */}
                        <td className="p-3 font-medium text-slate-700 max-w-xs truncate">
                          {item.fileName}
                        </td>
                        
                        {/* Target App ID Selector */}
                        <td className="p-3">
                          {item.status === "pending" ? (
                            <select
                              value={item.selectedAppId}
                              onChange={(e) =>
                                setQueue((prev) =>
                                  prev.map((x) =>
                                    x.id === item.id ? { ...x, selectedAppId: e.target.value } : x
                                  )
                                )
                              }
                              className="px-2 py-1 bg-white border border-slate-300 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-slate-900 cursor-pointer"
                            >
                              <option value="">Select App ID</option>
                              {apps.map((app) => (
                                <option key={app.app_id} value={app.app_id}>
                                  {app.app_id} ({app.brand_name})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-bold text-xs bg-slate-100 text-slate-700 px-2 py-1 border border-slate-300">
                              {item.selectedAppId}
                            </span>
                          )}
                        </td>
                                               {/* Status Badge */}
                        <td className="p-3">
                          {item.decision ? (
                            <>
                              {item.decision === "APPROVED" && (
                                <span className="inline-block px-2 py-1 text-xs font-bold bg-[#166534] text-white border border-[#114f28] uppercase">
                                  Officer: Approved
                                </span>
                              )}
                              {item.decision === "REJECTED" && (
                                <span className="inline-block px-2 py-1 text-xs font-bold bg-[#991b1b] text-white border border-[#7a1515] uppercase">
                                  Officer: Rejected
                                </span>
                              )}
                              {item.decision === "FLAGGED" && (
                                <span className="inline-block px-2 py-1 text-xs font-bold bg-[#854d0e] text-white border border-[#6b3e0b] uppercase">
                                  Officer: Flagged
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {item.status === "pending" && (
                                <span className="inline-block px-2 py-1 text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300 uppercase">
                                  Queued
                                </span>
                              )}
                              {item.status === "processing" && (
                                <div className="flex items-center gap-2">
                                  <span className="animate-pulse inline-block px-2 py-1 text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 uppercase">
                                    Analyzing...
                                  </span>
                                </div>
                              )}
                              {item.status === "success" && item.result && (
                                <>
                                  {item.result.status === "matched" && (
                                    <span className="inline-block px-2 py-1 text-xs font-bold bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] uppercase">
                                      Approved (Match)
                                    </span>
                                  )}
                                  {item.result.status === "mismatched" && (
                                    <span className="inline-block px-2 py-1 text-xs font-bold bg-[#fee2e2] text-[#991b1b] border border-[#fecaca] uppercase">
                                      Rejected (Mismatch)
                                    </span>
                                  )}
                                  {item.result.status === "manual_review" && (
                                    <span className="inline-block px-2 py-1 text-xs font-bold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a] uppercase">
                                      Manual Review
                                    </span>
                                  )}
                                </>
                              )}
                              {item.status === "failed" && (
                                <span className="inline-block px-2 py-1 text-xs font-bold bg-red-100 text-red-800 border border-red-300 uppercase">
                                  Engine Error
                                </span>
                              )}
                            </>
                          )}
                        </td>
                        
                        {/* OCR Confidence */}
                        <td className="p-3 font-semibold text-xs">
                          {item.result ? `${item.result.confidence.toFixed(1)}%` : "N/A"}
                        </td>
                        
                        {/* Action buttons */}
                        <td className="p-3 text-right space-x-2">
                          {item.status === "pending" && (
                            <>
                              <button
                                type="button"
                                onClick={() => verifyItem(item.id)}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase rounded-none cursor-pointer focus-ring"
                              >
                                Verify
                              </button>
                              <button
                                type="button"
                                onClick={() => removeQueueItem(item.id)}
                                className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold uppercase border border-red-200 rounded-none cursor-pointer"
                              >
                                Remove
                              </button>
                            </>
                          )}
                          {item.status === "success" && (
                            <button
                              type="button"
                              onClick={() => {
                                // Find app full details for verification detail view
                                const appData = apps.find(x => x.app_id === item.selectedAppId);
                                if (appData && item.result) {
                                  onInspectResult(
                                    item.id,
                                    appData,
                                    item.result.raw_ocr_text,
                                    item.result.fields,
                                    item.previewUrl,
                                    item.result.status,
                                    item.result.reason
                                  );
                                }
                              }}
                              className="px-3 py-1 bg-[#0f2d59] hover:bg-[#081e3d] text-white text-xs font-bold uppercase rounded-none cursor-pointer focus-ring"
                            >
                              Inspect Diff
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
