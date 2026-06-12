"use client";

import React, { useState } from "react";

interface FieldStatus {
  expected: string;
  actual?: string;
  matched: boolean;
  score?: number;
  detail?: string;
}

interface VerificationDetailViewProps {
  appSummary: {
    app_id: string;
    brand_name: string;
    class_type: string;
  };
  rawOcrText: string;
  fields: {
    brand_name: FieldStatus;
    class_type: FieldStatus;
    bottler_name_address: FieldStatus;
    country_of_origin: FieldStatus;
    abv: FieldStatus;
    net_contents: FieldStatus;
    warning_text: FieldStatus;
  };
  fileUrl: string;
  status: "matched" | "mismatched" | "manual_review";
  reason: string;
  onBack: () => void;
  itemId: string;
  onRegisterDecision?: (itemId: string, decision: "APPROVED" | "REJECTED" | "FLAGGED") => void;
}

export default function VerificationDetailView({
  appSummary,
  rawOcrText,
  fields,
  fileUrl,
  status,
  reason,
  onBack,
  itemId,
  onRegisterDecision
}: VerificationDetailViewProps) {
  const [actionTaken, setActionTaken] = useState<string | null>(null);

  const handleAction = (action: "APPROVED" | "REJECTED" | "FLAGGED") => {
    setActionTaken(action);
    if (onRegisterDecision) {
      onRegisterDecision(itemId, action);
    }
    // In a full application, this would post the agent decision to the COLA/backend DB.
    setTimeout(() => {
      onBack();
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* Header */}
      <header className="bg-[#0f2d59] text-white border-b-4 border-slate-400 py-4 px-6 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-xs font-bold uppercase tracking-wider border border-slate-500 rounded-none cursor-pointer focus-ring"
          >
            ← Back to Dashboard
          </button>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider">
              Verification Detail: {appSummary.app_id}
            </h1>
            <p className="text-xs text-slate-300">
              {appSummary.brand_name} • {appSummary.class_type}
            </p>
          </div>
        </div>

        {/* Global Compliance Status Badge */}
        <div>
          {status === "matched" && (
            <span className="inline-block px-3 py-1.5 text-xs font-bold bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] uppercase">
              System Recommendation: APPROVE
            </span>
          )}
          {status === "mismatched" && (
            <span className="inline-block px-3 py-1.5 text-xs font-bold bg-[#fee2e2] text-[#991b1b] border border-[#fecaca] uppercase">
              System Recommendation: REJECT
            </span>
          )}
          {status === "manual_review" && (
            <span className="inline-block px-3 py-1.5 text-xs font-bold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a] uppercase">
              System Recommendation: MANUAL REVIEW
            </span>
          )}
        </div>
      </header>

      {/* Main Split Screen Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Uploaded Label Artwork */}
        <div className="w-full md:w-1/2 p-6 border-r border-slate-300 flex flex-col bg-slate-200 overflow-y-auto">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">
            Label Image Artwork
          </h2>
          <div className="flex-1 min-h-[300px] bg-white border border-slate-300 flex items-center justify-center p-4">
            <img
              src={fileUrl}
              alt="Uploaded Label Artwork"
              className="max-w-full max-h-[500px] object-contain shadow-sm"
            />
          </div>

          {/* Raw OCR Output Panel */}
          <div className="mt-6 bg-white border border-slate-300 p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              Extracted Raw Label Text (OCR Readout)
            </h3>
            <pre className="text-xs font-mono text-slate-600 whitespace-pre-wrap bg-slate-50 p-3 border border-slate-200 max-h-40 overflow-y-auto leading-relaxed select-text">
              {rawOcrText || "[No legible text could be extracted by the OCR engine]"}
            </pre>
          </div>
        </div>

        {/* Right Side: Structured Application Fields Compare */}
        <div className="w-full md:w-1/2 p-6 flex flex-col bg-white overflow-y-auto pb-24">
          <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-3">
            Application Verification Matrix
          </h2>
          
          <div className="space-y-4">
            
            {/* Fuzzy Fields Section */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Fuzzy Matching Fields (Tolerance Allowed)
              </h3>
              
              {/* Brand Name */}
              <div className={`p-4 border ${fields.brand_name.matched ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase block">Brand Name</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Expected (Database)</span>
                        <p className="text-sm font-semibold text-slate-800">{fields.brand_name.expected}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Extracted (Label OCR)</span>
                        <p className={`text-sm font-semibold ${fields.brand_name.matched ? "text-slate-800" : "text-red-700 font-bold"}`}>
                          {fields.brand_name.actual || "[Not Found]"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 uppercase border ${
                    fields.brand_name.matched 
                      ? "bg-green-100 border-green-300 text-green-800" 
                      : "bg-red-100 border-red-300 text-red-800"
                  }`}>
                    {fields.brand_name.matched ? `Match (${fields.brand_name.score}%)` : `Mismatch (${fields.brand_name.score}%)`}
                  </span>
                </div>
              </div>

              {/* Class/Type */}
              <div className={`mt-3 p-4 border ${fields.class_type.matched ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase block">Class/Type Designation</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Expected (Database)</span>
                        <p className="text-sm font-semibold text-slate-800">{fields.class_type.expected}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Extracted (Label OCR)</span>
                        <p className={`text-sm font-semibold ${fields.class_type.matched ? "text-slate-800" : "text-red-700 font-bold"}`}>
                          {fields.class_type.actual || "[Not Found]"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 uppercase border ${
                    fields.class_type.matched 
                      ? "bg-green-100 border-green-300 text-green-800" 
                      : "bg-red-100 border-red-300 text-red-800"
                  }`}>
                    {fields.class_type.matched ? `Match (${fields.class_type.score}%)` : `Mismatch (${fields.class_type.score}%)`}
                  </span>
                </div>
              </div>

              {/* Bottler Name Address */}
              <div className={`mt-3 p-4 border ${fields.bottler_name_address.matched ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase block">Bottler Name & Address</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Expected (Database)</span>
                        <p className="text-sm font-semibold text-slate-800">{fields.bottler_name_address.expected}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Extracted (Label OCR)</span>
                        <p className={`text-sm font-semibold ${fields.bottler_name_address.matched ? "text-slate-800" : "text-red-700 font-bold"}`}>
                          {fields.bottler_name_address.actual || "[Not Found]"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 uppercase border ${
                    fields.bottler_name_address.matched 
                      ? "bg-green-100 border-green-300 text-green-800" 
                      : "bg-red-100 border-red-300 text-red-800"
                  }`}>
                    {fields.bottler_name_address.matched ? `Match (${fields.bottler_name_address.score}%)` : `Mismatch (${fields.bottler_name_address.score}%)`}
                  </span>
                </div>
              </div>

              {/* Country of Origin */}
              <div className={`mt-3 p-4 border ${fields.country_of_origin.matched ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <span className="text-xs font-bold text-slate-500 uppercase block">Country of Origin</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Expected (Database)</span>
                        <p className="text-sm font-semibold text-slate-800">{fields.country_of_origin.expected}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Extracted (Label OCR)</span>
                        <p className={`text-sm font-semibold ${fields.country_of_origin.matched ? "text-slate-800" : "text-red-700 font-bold"}`}>
                          {fields.country_of_origin.actual || "[Not Found]"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 uppercase border ${
                    fields.country_of_origin.matched 
                      ? "bg-green-100 border-green-300 text-green-800" 
                      : "bg-red-100 border-red-300 text-red-800"
                  }`}>
                    {fields.country_of_origin.matched ? `Match (${fields.country_of_origin.score}%)` : `Mismatch (${fields.country_of_origin.score}%)`}
                  </span>
                </div>
              </div>
            </div>

            {/* Exact Fields Section */}
            <div className="pt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                Exact Matching Fields (Strict Verification)
              </h3>
              
              {/* ABV & Net Contents Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* ABV */}
                <div className={`p-4 border ${fields.abv.matched ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase block">Alcohol Content (ABV)</span>
                      <div className="space-y-1">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Expected</span>
                          <p className="text-sm font-semibold text-slate-800">{fields.abv.expected}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Extracted</span>
                          <p className={`text-sm font-semibold ${fields.abv.matched ? "text-slate-800" : "text-red-700 font-bold"}`}>
                            {fields.abv.actual || "[Not Found]"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 uppercase border ${
                      fields.abv.matched 
                        ? "bg-green-100 border-green-300 text-green-800" 
                        : "bg-red-100 border-red-300 text-red-800"
                    }`}>
                      {fields.abv.matched ? "Exact Match" : "Mismatch"}
                    </span>
                  </div>
                </div>

                {/* Net Contents */}
                <div className={`p-4 border ${fields.net_contents.matched ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase block">Net Contents</span>
                      <div className="space-y-1">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Expected</span>
                          <p className="text-sm font-semibold text-slate-800">{fields.net_contents.expected}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">Extracted</span>
                          <p className={`text-sm font-semibold ${fields.net_contents.matched ? "text-slate-800" : "text-red-700 font-bold"}`}>
                            {fields.net_contents.actual || "[Not Found]"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 uppercase border ${
                      fields.net_contents.matched 
                        ? "bg-green-100 border-green-300 text-green-800" 
                        : "bg-red-100 border-red-300 text-red-800"
                    }`}>
                      {fields.net_contents.matched ? "Exact Match" : "Mismatch"}
                    </span>
                  </div>
                </div>

              </div>

              {/* Government Warning Text */}
              <div className={`mt-3 p-4 border ${fields.warning_text.matched ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase">Government Warning Statement</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 uppercase border ${
                    fields.warning_text.matched 
                      ? "bg-green-100 border-green-300 text-green-800" 
                      : "bg-red-100 border-red-300 text-red-800"
                  }`}>
                    {fields.warning_text.matched ? "Exact Match" : "Mismatch"}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Expected (Database)</span>
                    <p className="text-xs leading-relaxed text-slate-700 bg-slate-50 p-3 border border-slate-200 font-mono">
                      {fields.warning_text.expected}
                    </p>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Extracted (Label OCR)</span>
                    <p className={`text-xs leading-relaxed p-3 border font-mono ${
                      fields.warning_text.matched 
                        ? "text-slate-700 bg-slate-50 border-slate-200" 
                        : "text-red-900 bg-red-50 border-red-200 font-bold"
                    }`}>
                      {fields.warning_text.actual || "[Not Found]"}
                    </p>
                  </div>
                </div>

                {fields.warning_text.detail && !fields.warning_text.matched && (
                  <div className="mt-3 text-xs font-bold text-red-800 bg-red-100 border border-red-200 p-2">
                    Verification Failure: {fields.warning_text.detail}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* Sticky Bottom Compliance Action Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-300 py-4 px-6 flex justify-between items-center shadow-lg z-20">
        
        {/* Verification Summary Reason */}
        <div className="text-slate-600 text-sm font-semibold max-w-md truncate">
          <strong>Result Summary:</strong> {reason}
        </div>

        {actionTaken ? (
          <div className="px-6 py-2 bg-slate-900 text-white font-bold text-sm uppercase tracking-wider">
            Decision Registered: {actionTaken}... Returning
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleAction("APPROVED")}
              className="px-5 py-2.5 bg-[#166534] hover:bg-[#114f28] text-white text-sm font-bold uppercase tracking-wider rounded-none cursor-pointer focus-ring"
            >
              Approve Application
            </button>
            <button
              type="button"
              onClick={() => handleAction("REJECTED")}
              className="px-5 py-2.5 bg-[#991b1b] hover:bg-[#7a1515] text-white text-sm font-bold uppercase tracking-wider rounded-none cursor-pointer focus-ring"
            >
              Reject Application
            </button>
            <button
              type="button"
              onClick={() => handleAction("FLAGGED")}
              className="px-5 py-2.5 bg-[#854d0e] hover:bg-[#6b3e0b] text-white text-sm font-bold uppercase tracking-wider rounded-none cursor-pointer focus-ring"
            >
              Flag for Manual Review
            </button>
          </div>
        )}
      </footer>

    </div>
  );
}
