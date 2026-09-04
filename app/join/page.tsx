"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function JoinContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"verifying" | "valid" | "invalid">("verifying");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [groupId, setGroupId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      // In a real app, you would verify against the DB here using an API route 
      // because RLS prevents reading unused tokens unless exposed. 
      // For this implementation, we will assume an API exists or we check it when they auth.
      
      const { data, error } = await supabase
        .from("invitations")
        .select("group_id, is_used, expires_at")
        .eq("invite_token", token)
        .single();
        
      if (error || !data || data.is_used || new Date(data.expires_at) < new Date()) {
        setStatus("invalid");
      } else {
        setStatus("valid");
        setGroupId(data.group_id);
      }
      setLoading(false);
    };

    verifyToken();
  }, [token, supabase]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // We pass the join token to auth so the server can link them in confirm route
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/api/auth/confirm`,
        data: {
          join_token: token,
          group_id: groupId
        }
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the magic link to join!");
    }
    setLoading(false);
  };

  return (
    <main className="flex flex-col min-h-screen items-center justify-center bg-zinc-950 text-zinc-100 p-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 w-full max-w-md shadow-lg text-center">
        {status === "verifying" && <p className="animate-pulse">Verifying secure invitation...</p>}
        
        {status === "invalid" && (
          <div className="flex flex-col gap-4 text-center">
            <h1 className="text-2xl font-bold text-red-500">Invalid Link</h1>
            <p className="text-zinc-400">This single-use invitation link is invalid or has already expired.</p>
          </div>
        )}

        {status === "valid" && (
          <form onSubmit={handleJoin} className="flex flex-col gap-5 animate-in fade-in">
            <h1 className="text-2xl font-bold">You've Been Invited</h1>
            <p className="text-zinc-400 text-sm">Join this private connection group. Enter your email to receive a secure login link.</p>
            
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-zinc-100"
              required
            />
            
            {message && <p className="text-red-400 text-sm">{message}</p>}
            
            <button 
              type="submit" 
              disabled={loading || !email}
              className="w-full py-3 bg-red-900 text-white hover:bg-red-800 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Accept Invitation"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center"><p className="text-zinc-400 animate-pulse">Loading...</p></div>}>
      <JoinContent />
    </Suspense>
  );
}
