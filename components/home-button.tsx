import Link from "next/link";
import { LogoMark } from "@/components/logo-mark";

export function HomeButton() {
  return (
    <Link
      href="/"
      className="flex h-9 w-9 items-center justify-center rounded-lg transition-opacity hover:opacity-85"
      aria-label="Home"
      title="Home"
    >
      <LogoMark size={36} />
    </Link>
  );
}
