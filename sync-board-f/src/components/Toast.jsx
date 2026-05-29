import { useState, useEffect, useCallback } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

let toastId = 0;
let addToastFn = null;

export function toast(message, type = "success") {
  const entry = { id: ++toastId, message, type };
  addToastFn?.(entry);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
  }, []);

  useEffect(() => {
    addToastFn = addToast;
    return () => { addToastFn = null; };
  }, [addToast]);

  const remove = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (toasts.length === 0) return;
    const last = toasts[toasts.length - 1];
    const timer = setTimeout(() => remove(last.id), 3000);
    return () => clearTimeout(timer);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-xl border text-sm min-w-[300px] animate-slide-in-right ${
            t.type === "success"
              ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/20 border-red-500/30 text-red-300"
          }`}
        >
          {t.type === "success" ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="opacity-60 hover:opacity-100 transition-opacity">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
