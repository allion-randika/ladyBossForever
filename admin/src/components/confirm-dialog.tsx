"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Red/destructive styling for irreversible actions (delete, reject). */
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((result: boolean) => {
    setOptions(null);
    resolver.current?.(result);
    resolver.current = null;
  }, []);

  useEffect(() => {
    if (!options) return;
    confirmButtonRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") settle(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="confirm-overlay fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          onClick={() => settle(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            className="confirm-panel w-full max-w-sm rounded-xl border border-line bg-paper-raised p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                options.danger ? "bg-danger-bg text-danger" : "bg-plum/10 text-plum"
              }`}
            >
              {options.danger ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
            </div>

            <h2 id="confirm-dialog-title" className="mt-4 text-base font-semibold text-ink">
              {options.title}
            </h2>
            {options.description && <p className="mt-1.5 text-sm text-ink-soft">{options.description}</p>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => settle(false)}
                className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper"
              >
                {options.cancelLabel ?? "Cancel"}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={() => settle(true)}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white transition ${
                  options.danger ? "bg-danger hover:opacity-90" : "bg-plum hover:bg-plum-deep"
                }`}
              >
                {options.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
