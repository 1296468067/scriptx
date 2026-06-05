"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "工作台", href: "/" },
  { label: "模板库", href: "/templates" },
  { label: "历史记录", href: "/history" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-[var(--border)] px-6 h-14 flex items-center">
      <Link href="/" className="flex items-center mr-10">
        <span className="font-[family-name:var(--font-display)] font-extrabold text-xl text-[var(--primary)] tracking-[-0.5px]">
          ScriptX
        </span>
        <span className="text-[11px] text-[var(--muted)] font-normal ml-1.5">
          × 即梦提示词
        </span>
      </Link>
      <div className="flex gap-0">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-5 py-[15px] text-sm transition-all border-b-2 ${
              pathname === tab.href
                ? "text-[var(--primary)] border-[var(--primary)] font-semibold"
                : "text-[var(--text-secondary)] border-transparent hover:text-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
