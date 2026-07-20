import { XIcon } from "lucide-react";
import { useEffect } from "react";
import type { ReactNode } from "react";

const SHORTCUT_ROWS: { keys: string[]; label: string }[] = [
  { keys: ["O"], label: "Open structure files" },
  { keys: ["R"], label: "Reset view" },
  { keys: ["1", "2", "3"], label: "Display / Style / Export tab" },
  { keys: ["←", "→"], label: "Previous / next frame" },
  { keys: ["?"], label: "Show this sheet" },
];

/** Quiet modal listing the app's single-key shortcuts. */
export function ShortcutSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-foreground/25 animate-in fade-in-0 duration-200 motion-reduce:animate-none"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="relative w-[300px] rounded-xl border border-foreground/10 bg-card p-4 shadow-xl shadow-foreground/10 animate-in fade-in-0 zoom-in-95 duration-200 ease-out motion-reduce:animate-none"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">Keyboard shortcuts</h2>
          <button
            type="button"
            aria-label="Close keyboard shortcuts"
            className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            onClick={onClose}
          >
            <XIcon aria-hidden="true" className="size-3.5" />
          </button>
        </div>
        <ul className="flex flex-col gap-2">
          {SHORTCUT_ROWS.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{row.label}</span>
              <span className="flex shrink-0 items-center gap-1">
                {row.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md border bg-muted px-1 font-mono text-2xs text-muted-foreground">
      {children}
    </kbd>
  );
}
