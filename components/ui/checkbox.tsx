import { Check } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

export function Checkbox({ children, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }) {
  return (
    <label className={`flex min-h-10 cursor-pointer items-center gap-2.5 text-sm ${className}`}>
      <span className="relative flex shrink-0">
        <input
          type="checkbox"
          className="peer size-5 cursor-pointer appearance-none rounded-sm border-[1.5px] border-muted-foreground transition-colors checked:border-primary checked:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50"
          {...props}
        />
        <Check
          className="pointer-events-none absolute inset-0 m-auto size-3 text-primary-foreground opacity-0 peer-checked:opacity-100"
          strokeWidth={3.5}
          aria-hidden="true"
        />
      </span>
      {children}
    </label>
  );
}
