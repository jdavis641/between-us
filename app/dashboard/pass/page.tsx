"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function PassHub() {
  const [loading, setLoading] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  
  // Mock active passes
  const [activePasses, setActivePasses] = useState([
    { id: 1, type: "Guest Pass", status: "Active", expires: "2026-09-04 12:00 PM" },
    { id: 2, type: "Couple Pass", status: "Used", expires: "2026-09-01 08:00 AM" }
  ]);

  const supabase = createClient();

  const handleGenerateGuestPass = async () => {
    setLoading(true);
    try {
      // Get the user's current group_id from auth metadata or state.
      // We'll mock the UUID here for the UI demonstration
      const mockGroupId = "123e4567-e89b-12d3-a456-426614174000"; 
      
      const res = await fetch("/api/invite/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: mockGroupId, inviteType: "single" })
      });
      const data = await res.json();
      if (data.token) {
        setInviteToken(data.token);
      }
    } catch (e) {
      console.error("Failed to generate pass", e);
    }
    setLoading(false);
  };

  const handleRevoke = (id: number) => {
    setActivePasses(prev => prev.map(p => p.id === id ? { ...p, status: "Revoked" } : p));
  };

  return (
    <main className="p-6 md:p-10 w-full max-w-4xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Between Us Pass</h1>
        <p className="text-zinc-400">Manage your connection groups, temporary guest passes, and shared intimacy boundaries.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Pass Generation Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Generate Pass</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Create a single-use "Guest Pass" to securely invite a new partner. The AI will compute a safe intersection of mutual boundaries without ever exposing your "Off-Limits" topics.
          </p>
          
          <button 
            onClick={handleGenerateGuestPass}
            disabled={loading}
            className="w-full py-3 bg-red-900 text-white hover:bg-red-800 rounded-lg font-medium transition-colors disabled:opacity-50 mb-4"
          >
            {loading ? "Generating..." : "Generate Guest Pass"}
          </button>

          {inviteToken && (
            <div className="mt-4 p-4 bg-zinc-950 border border-red-900/50 rounded-lg animate-in fade-in">
              <p className="text-xs text-red-400 uppercase tracking-wider mb-2 font-semibold">Single-Use Link Ready</p>
              <code className="text-sm text-zinc-300 break-all select-all block mb-2">
                {typeof window !== 'undefined' ? location.origin : ''}/join?token={inviteToken}
              </code>
              <p className="text-xs text-zinc-500 italic">This link expires in 24 hours or immediately upon use.</p>
            </div>
          )}
        </section>

        {/* Public Preference Quiz Section */}
        <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-4">Public Preferences</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Your boundaries are strictly protected. When a partner uses your Between Us Pass, they complete their own blind quiz. The engine only reveals the "Definitely" and "Curious" themes you both share.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              <span className="text-sm font-medium">Your Masked Identity</span>
              <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-300">Protected</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-lg border border-zinc-800">
              <span className="text-sm font-medium">Shared Curiosity Engine</span>
              <span className="text-xs bg-green-900/50 text-green-400 border border-green-900/50 px-2 py-1 rounded">Active</span>
            </div>
          </div>
        </section>

      </div>

      {/* Active Passes Management Table */}
      <section className="mt-10 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 overflow-hidden">
        <h2 className="text-xl font-semibold mb-6">Active Passes</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50 border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {activePasses.map((pass) => (
                <tr key={pass.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                  <td className="px-4 py-4 font-medium text-zinc-200">{pass.type}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold ${
                      pass.status === 'Active' ? 'bg-green-950 text-green-400 border border-green-900/50' : 
                      pass.status === 'Used' ? 'bg-zinc-800 text-zinc-400' : 
                      'bg-red-950 text-red-400 border border-red-900/50'
                    }`}>
                      {pass.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-zinc-400">{pass.expires}</td>
                  <td className="px-4 py-4 text-right">
                    {pass.status === "Active" && (
                      <button 
                        onClick={() => handleRevoke(pass.id)}
                        className="text-red-400 hover:text-red-300 text-xs uppercase tracking-wider font-semibold transition-colors"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {activePasses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">No active passes found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

    </main>
  );
}
