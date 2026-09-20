"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Target, FolderKanban, LogOut, Home, Users, Boxes } from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Teams first among the building blocks - a team is where work starts
// (its main dashboard and tier boards are created from inside it), not
// something set up after the fact.
const NAV = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/teams", label: "Teams", icon: Boxes },
  { href: "/dashboards", label: "Dashboards", icon: LayoutDashboard },
  { href: "/hoshin", label: "Planning", icon: Target },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/team", label: "Team", icon: Users },
];

export default function AppShell({ children }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Middleware only checks that an auth cookie is present (it can't verify the
  // JWT in the Edge runtime) - if it turns out to be invalid/expired, this is
  // the real check, and it kicks back to /login instead of rendering a shell
  // with no user in it.
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const initials = user?.name?.split(" ").map((n) => n[0]).slice(0, 2).join("") || "U";

  return (
    <div className="flex h-screen" style={{ background: "var(--color-bg)" }}>
      <aside className="w-56 flex-shrink-0 flex flex-col text-white" style={{ background: "var(--color-primary)" }}>
        <div className="px-4 py-4 border-b border-white/10">
          <p className="text-lg font-black tracking-tight">Vecta</p>
          <p className="text-[10px] uppercase tracking-widest text-white/40 mt-0.5">{user?.role || ""}</p>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-white/15 text-white" : "text-white/55 hover:bg-white/8 hover:text-white/90"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-2 py-3 border-t border-white/10 space-y-1">
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2">
            <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/80 truncate">{user?.name}</p>
              <p className="text-[10px] text-white/35 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2 text-xs text-white/50 hover:bg-white/8 hover:text-white/80 transition"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
