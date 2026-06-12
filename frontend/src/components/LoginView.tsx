"use client";

import React, { useState } from "react";

interface LoginViewProps {
  onLoginSuccess: (email: string) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    if (!agreed) {
      setError("You must acknowledge the terms of access before logging in.");
      return;
    }
    
    // Accept any credentials as per mock authentication requirement
    onLoginSuccess(email);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
      {/* Government SSO Container */}
      <div className="w-full max-w-lg bg-white rounded-none border border-slate-300 shadow-md p-8">
        
        {/* Department Logo Header */}
        <div className="text-center border-b border-slate-300 pb-6 mb-6">
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
            United States Government
          </p>
          <h1 className="text-xl font-bold text-slate-800 uppercase mt-1">
            Department of the Treasury
          </h1>
          <h2 className="text-sm font-semibold text-blue-900 mt-1">
            Alcohol and Tobacco Tax and Trade Bureau (TTB)
          </h2>
          <div className="mt-4 inline-block bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 uppercase tracking-wider border border-slate-300">
            Authorized Personnel Only
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1">
              Federal Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="e.g., agent.smith@ttb.gov"
              className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-slate-900 text-base focus-ring"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-1">
              Single Sign-On (SSO) Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-slate-900 text-base focus-ring"
              required
            />
          </div>

          {/* Government Warning Banner */}
          <div className="p-4 bg-red-50 border border-red-200 text-xs text-red-900 space-y-2">
            <p className="font-bold uppercase tracking-wider">
              *** WARNING: U.S. GOVERNMENT SYSTEM ***
            </p>
            <p className="leading-relaxed">
              This system contains Government information. By logging in, you consent to monitoring, recording, and auditing of all system activities by authorized federal officials. Unauthorized access or use of this system is strictly prohibited and subject to criminal and civil penalties under 18 U.S.C. § 1030.
            </p>
            <label className="flex items-start gap-2 pt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked);
                  setError("");
                }}
                className="mt-0.5 rounded-none border-slate-400 focus:ring-0 focus-ring"
              />
              <span className="font-semibold">
                I agree to the Terms of Access and system monitoring policies.
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-300 text-sm text-red-800 font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#0f2d59] hover:bg-[#081e3d] text-white text-base font-bold uppercase tracking-wider rounded-none cursor-pointer focus-ring"
          >
            Authenticate & Enter
          </button>
        </form>

        <div className="text-center mt-6 text-xs text-slate-400">
          TTB Compliance Portal Version 1.0.0 (Prototype)
        </div>
      </div>
    </div>
  );
}
