import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";

export default function CommentSection({ comments, onAddComment, loading }) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments, open]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAddComment(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div className="feed-card-comments">
      <button
        onClick={() => setOpen(!open)}
        className="feed-card-comments-trigger"
      >
        <MessageSquare size={16} />
        {comments?.length || 0} comments
      </button>

      {open && (
        <div className="feed-card-comments-body">
          <div
            ref={listRef}
            className="feed-card-comments-list"
          >
            {comments && comments.length > 0 ? (
              comments.map((c, i) => (
                <div key={c._id || i} className="feed-card-comment-item">
                  <div className="feed-card-comment-avatar">
                    {(c.user?.username || "U")[0].toUpperCase()}
                  </div>
                  <div className="feed-card-comment-content">
                    <div className="feed-card-comment-header">
                      <span className="feed-card-comment-author">
                        {c.user?.username || "Unknown"}
                      </span>
                      <span className="feed-card-comment-date">
                        {new Date(c.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="feed-card-comment-text">{c.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="feed-card-comments-empty">
                No comments yet. Be the first!
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="feed-card-comments-form">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment..."
              rows={1}
              className="feed-card-comments-input"
            />
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="feed-card-comments-submit"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
