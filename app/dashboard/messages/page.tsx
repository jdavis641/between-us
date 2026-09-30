"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function UserMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('in_app_messages')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (data) setMessages(data);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('in_app_messages').update({ is_read: true }).eq('id', id);
    fetchMessages();
  };

  if (loading) return <div className="p-8 text-zinc-400">Loading inbox...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 pb-32">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="border-b border-zinc-800 pb-8">
          <h1 className="text-3xl font-serif font-medium text-zinc-100 mb-2">Inbox</h1>
          <p className="text-zinc-400">Direct messages from the administration and support team.</p>
        </header>

        {messages.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/30 rounded-xl border border-zinc-800 border-dashed">
            <p className="text-zinc-500">Your inbox is empty.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`p-6 rounded-xl border transition-colors ${msg.is_read ? 'bg-zinc-900/30 border-zinc-800' : 'bg-zinc-900 border-red-900/50 relative shadow-lg'}`}>
                {!msg.is_read && <span className="absolute top-6 right-6 h-2 w-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>}
                <div className="pr-8">
                  <h3 className={`font-medium mb-1 ${msg.is_read ? 'text-zinc-300' : 'text-zinc-100'}`}>{msg.subject}</h3>
                  <p className="text-xs text-zinc-500 mb-4 font-mono tracking-wider">{new Date(msg.created_at).toLocaleString()}</p>
                  <p className={`text-sm whitespace-pre-wrap leading-relaxed ${msg.is_read ? 'text-zinc-400' : 'text-zinc-300'}`}>{msg.message}</p>
                  
                  {!msg.is_read && (
                    <button onClick={() => markAsRead(msg.id)} className="mt-6 text-xs font-semibold text-zinc-400 hover:text-white uppercase tracking-widest transition-colors flex items-center gap-2">
                      <span className="w-4 h-px bg-zinc-600"></span> Mark as Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
