import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, footer, maxWidth = "max-w-2xl" }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 shadow-2xl animate-scale-in flex flex-col`}
      >
        <div className="flex items-center justify-between border-b border-ink-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-ink-700 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        {footer && (
          <div className="border-t border-ink-700 px-6 py-4 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
