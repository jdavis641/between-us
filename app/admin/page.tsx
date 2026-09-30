"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function AdminDashboard() {
  const [ratings, setRatings] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [improvements, setImprovements] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);

  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyUserId, setReplyUserId] = useState("");
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  const [supabase] = useState(() => createClient());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: ratingData } = await supabase.from('scenario_ratings').select('*').order('rating', { ascending: false }).limit(50);
    if (ratingData) setRatings(ratingData);

    const { data: suggData } = await supabase.from('scenario_suggestions').select('*').order('created_at', { ascending: false });
    if (suggData) setSuggestions(suggData);

    const { data: impData } = await supabase.from('app_improvements').select('*').order('created_at', { ascending: false });
    if (impData) setImprovements(impData);

    const { data: errData } = await supabase.from('error_logs').select('*').order('created_at', { ascending: false });
    if (errData) setErrors(errData);
  };

  const handlePushToQA = async (logId: string) => {
    await supabase.from('error_logs').update({ status: 'assigned_to_qa' }).eq('id', logId);
    fetchData();
  };

  const openReply = (userId: string, contextSubject: string) => {
    if (!userId) {
      alert("No User ID associated with this feedback.");
      return;
    }
    setReplyUserId(userId);
    setReplySubject(`Re: ${contextSubject}`);
    setReplyMessage("");
    setReplyModalOpen(true);
  };

  const sendReply = async () => {
    if (!replyUserId || !replySubject || !replyMessage) return;
    setReplyLoading(true);
    try {
      const res = await fetch("/api/admin/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: replyUserId, subject: replySubject, message: replyMessage })
      });
      if (!res.ok) throw new Error("Failed to send");
      setReplyModalOpen(false);
      alert("Message sent successfully.");
    } catch (e) {
      console.error(e);
      alert("Error sending message.");
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Panel 1: Top Rated */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-[400px] flex flex-col">
        <h2 className="text-xl font-medium text-zinc-100 mb-4 shrink-0">Top 50 Rated Stories</h2>
        <ul className="space-y-3 overflow-y-auto pr-2 flex-1">
          {ratings.map(r => (
            <li key={r.id} className="text-sm text-zinc-300 flex justify-between items-center bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
              <span className="truncate pr-4">{r.title || r.scenario_title || 'Unknown Title'}</span>
              <span className="text-red-400 font-bold shrink-0">{r.rating}/5</span>
            </li>
          ))}
          {ratings.length === 0 && <p className="text-zinc-500 text-sm">No ratings found.</p>}
        </ul>
      </div>

      {/* Panel 2: Suggestions */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-[400px] flex flex-col">
        <h2 className="text-xl font-medium text-zinc-100 mb-4 shrink-0">Story Suggestions</h2>
        <ul className="space-y-3 overflow-y-auto pr-2 flex-1">
          {suggestions.map(s => (
            <li key={s.id} className="text-sm text-zinc-300 bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
              <p className="mb-3 leading-relaxed">{s.suggestion || s.scenario_text}</p>
              <div className="flex justify-end">
                <button onClick={() => openReply(s.user_id, 'Your Story Suggestion')} className="text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded transition-colors">Reply to User</button>
              </div>
            </li>
          ))}
          {suggestions.length === 0 && <p className="text-zinc-500 text-sm">No suggestions found.</p>}
        </ul>
      </div>

      {/* Panel 3: Improvements */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-[400px] flex flex-col">
        <h2 className="text-xl font-medium text-zinc-100 mb-4 shrink-0">App Improvements</h2>
        <ul className="space-y-3 overflow-y-auto pr-2 flex-1">
          {improvements.map(i => (
            <li key={i.id} className="text-sm text-zinc-300 bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
              <p className="mb-3 leading-relaxed">{i.feedback_text}</p>
              <div className="flex justify-end">
                <button onClick={() => openReply(i.user_id, 'Your App Improvement Suggestion')} className="text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded transition-colors">Reply to User</button>
              </div>
            </li>
          ))}
          {improvements.length === 0 && <p className="text-zinc-500 text-sm">No improvements found.</p>}
        </ul>
      </div>

      {/* Panel 4: Error Logs */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-[400px] flex flex-col">
        <h2 className="text-xl font-medium text-zinc-100 mb-4 shrink-0">Error Logs</h2>
        <ul className="space-y-3 overflow-y-auto pr-2 flex-1">
          {errors.map(e => (
            <li key={e.id} className="text-sm bg-zinc-950 p-4 rounded-lg border border-zinc-800/50">
              <p className="mb-3 font-mono text-xs text-red-400 break-all">{e.error_message}</p>
              <div className="flex justify-between items-center">
                <span className={`text-xs px-2 py-1 rounded font-medium ${e.status === 'assigned_to_qa' ? 'bg-orange-900/20 text-orange-400 border border-orange-900/30' : 'bg-red-900/20 text-red-400 border border-red-900/30'}`}>
                  {e.status || 'pending'}
                </span>
                {e.status !== 'assigned_to_qa' && (
                  <button onClick={() => handlePushToQA(e.id)} className="text-xs font-medium bg-red-900 hover:bg-red-800 px-3 py-1.5 rounded text-white transition-colors">Push to QA Agent</button>
                )}
              </div>
            </li>
          ))}
          {errors.length === 0 && <p className="text-zinc-500 text-sm">No error logs found.</p>}
        </ul>
      </div>

      {/* Reply Modal */}
      {replyModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-serif font-medium text-zinc-100 mb-6">Dispatch In-App Message</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Subject</label>
                <input
                  type="text"
                  value={replySubject}
                  onChange={(e) => setReplySubject(e.target.value)}
                  placeholder="Message Subject"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-100 focus:outline-none focus:border-red-900 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Message Body</label>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Write your response..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 h-40 resize-none focus:outline-none focus:border-red-900 transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setReplyModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">Cancel</button>
              <button onClick={sendReply} disabled={replyLoading || !replySubject || !replyMessage} className="px-6 py-2.5 text-sm font-medium bg-red-900 hover:bg-red-800 text-white rounded-lg disabled:opacity-50 transition-colors">
                {replyLoading ? 'Dispatching...' : 'Dispatch Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
