"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./SignOutButton";

interface SidebarProps {
  displayName: string;
  username: string;
  email: string;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Pages" },
  { href: "/settings/profile", label: "Profile" },
  { href: "/settings/account", label: "Account" },
];

export function Sidebar({ displayName, username, email }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen border-r border-rule px-6 py-8 fixed left-0 top-0">
        {/* Logo */}
        <Link href="/" className="mb-12 block">
          <img src="/brand/logo-light.svg" alt="Slant Hour" className="h-7 w-auto" />
        </Link>

        {/* Nav */}
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[10px] uppercase tracking-wide py-2 transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-rule pt-6">
          <p className="font-heading text-sm italic text-foreground truncate">
            {displayName}
          </p>
          <p className="text-[9px] tracking-wide text-muted truncate mb-3">
            {email}
          </p>
          <p className="text-[9px] tracking-wide text-muted/50 truncate mb-4">
            slanthour.com/{username}
          </p>
          <SignOutButton />
        </div>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 pl-4 pr-4 py-3 bg-background/90 backdrop-blur-md border-b border-rule">
        <Link href="/" className="block shrink-0">
          <img src="/brand/icon.svg" alt="Slanthour" className="h-7 w-7" />
        </Link>
        <nav className="flex items-center gap-3.5 min-w-0">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 text-[9px] uppercase tracking-wide transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <span className="shrink-0">
            <SignOutButton />
          </span>
        </nav>
      </header>
    </>
  );
}
