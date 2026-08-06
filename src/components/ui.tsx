import { useState, type ReactNode } from "react";

export function Toast({ message, type = "success" }: { message: string; type?: "success" | "error" | "info" }) {
  const colors = {
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    error: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    info: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  };
  return (
    <div
      className={`fixed bottom-6 right-6 z-[60] rounded-xl border px-4 py-3 text-sm font-medium shadow-lg animate-slide-in ${colors[type]}`}
    >
      {message}
    </div>
  );
}

export function ToastContainer({ toasts }: { toasts: { id: number; message: string; type: "success" | "error" | "info" }[] }) {
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} message={t.message} type={t.type} />
      ))}
    </div>
  );
}

export type ToastFn = (message: string, type?: "success" | "error" | "info") => void;

export function useToastState() {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: "success" | "error" | "info" }[]>([]);
  const toast: ToastFn = (message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };
  return { toasts, toast };
}

export function Spinner({ size = 20 }: { size?: number }) {
  return (
    <div
      className="inline-block animate-spin rounded-full border-2 border-ink-700 border-t-gold"
      style={{ width: size, height: size }}
    />
  );
}

export function Badge({ children, color = "amber" }: { children: ReactNode; color?: string }) {
  const colorMap: Record<string, string> = {
    amber: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    sky: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    rose: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    gold: "bg-gold/15 text-gold border-gold/30",
    gray: "bg-gray-500/15 text-gray-300 border-gray-500/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${colorMap[color] ?? colorMap.amber}`}>
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const variants = {
    primary: "bg-gold text-ink-900 hover:bg-gold-light font-semibold",
    secondary: "bg-ink-700 text-white hover:bg-ink-700/80 border border-ink-700",
    ghost: "text-gray-300 hover:bg-ink-700 hover:text-white",
    danger: "bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-2.5 text-base",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
  disabled = false,
}: {
  label?: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium text-gray-400">{label}</span>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full rounded-lg border border-ink-700 bg-ink-900/50 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-gold/50 focus:ring-1 focus:ring-gold/30 disabled:opacity-60"
      />
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium text-gray-400">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-ink-700 bg-ink-900/50 px-3 py-2 text-sm text-white outline-none transition-colors focus:border-gold/50 focus:ring-1 focus:ring-gold/30 disabled:opacity-60 [&>option]:bg-ink-800"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
