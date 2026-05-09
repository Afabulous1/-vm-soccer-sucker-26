"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

export type ToastType = "success" | "error" | "info" | "badge" | "lock";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx;
}

const ICONS: Record<ToastType, string> = {
  success: "✅",
  error:   "❌",
  info:    "ℹ️",
  badge:   "🏅",
  lock:    "🔒",
};

const COLORS: Record<ToastType, string> = {
  success: "border-green-500/60 bg-pitch/95",
  error:   "border-red-500/60   bg-red-950/90",
  info:    "border-blue-500/60  bg-pitch/95",
  badge:   "border-gold/60      bg-pitch/95",
  lock:    "border-amber-500/60 bg-pitch/95",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // slide in
    el.style.transform = "translateX(120%)";
    el.style.opacity = "0";
    requestAnimationFrame(() => {
      el.style.transition = "transform 0.3s ease, opacity 0.3s ease";
      el.style.transform = "translateX(0)";
      el.style.opacity = "1";
    });
  }, []);

  return (
    <div
      ref={ref}
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-xl
        text-white text-sm min-w-[240px] max-w-[340px] ${COLORS[toast.type]}`}
    >
      <span className="text-lg leading-none mt-0.5 shrink-0">{ICONS[toast.type]}</span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-white/40 hover:text-white/80 shrink-0 leading-none text-base"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast stack — bottom-right */}
      <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
