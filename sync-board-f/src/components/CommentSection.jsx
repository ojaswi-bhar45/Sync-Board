import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";

export default function CommentSection({ comments, onAddComment, loading }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(text.trim());
    setText("");
  };

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
      >
        <MessageSquare size={14} />
        {comments?.length || 0} comments
      </button>

      {open && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <div
            ref={listRef}
            className="max-h-48 overflow-y-auto space-y-2.5 mb-3 scrollbar-thin"
          >
            {comments && comments.length > 0 ? (
              comments.map((c, i) => (
                <div key={c._id || i} className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-medium text-indigo-300 shrink-0">
                    {(c.user?.username || "U")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-white">
                        {c.user?.username || "Unknown"}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(c.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mt-0.5 break-words">{c.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-2">
                No comments yet. Be the first!
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 disabled:cursor-not-allowed text-white transition-all duration-200"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
