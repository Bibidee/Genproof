"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Shield, Menu, X, ShieldCheck } from "lucide-react";
import { useWallet } from "@/lib/context/WalletContext";
import { shortenAddress } from "@/lib/utils/format";
import { getPlatformOwner } from "@/lib/genlayer/reads";
import { isSameAddress, toChecksum } from "@/lib/utils/address";

export default function Navbar() {
  const { address, connecting, connect, disconnect } = useWallet();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [platformOwner, setPlatformOwner] = useState<string | null>(null);

  // Fetch platform owner once at mount so we can selectively show /platform link
  useEffect(() => {
    let cancelled = false;
    getPlatformOwner()
      .then((o) => {
        if (!cancelled) setPlatformOwner(o);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const isPlatformOwner = isSameAddress(address, platformOwner);
  const profileHref = address ? `/profile/${toChecksum(address)}` : "/";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <span className="font-bold text-gp-text tracking-wide">GenProof</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 sm:flex">
          <Link href="/events" className="text-sm text-muted hover:text-gp-text transition-colors">
            Events
          </Link>
          <Link href="/create" className="text-sm text-muted hover:text-gp-text transition-colors">
            Create Event
          </Link>
          {address && (
            <>
              <Link
                href={profileHref}
                className="text-sm text-muted hover:text-gp-text transition-colors"
              >
                My Profile
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-muted hover:text-gp-text transition-colors"
              >
                Dashboard
              </Link>
              {isPlatformOwner && (
                <Link
                  href="/platform"
                  className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
                  title="Platform owner only"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Platform
                </Link>
              )}
            </>
          )}
        </div>

        {/* Right: wallet + mobile toggle */}
        <div className="flex items-center gap-2">
          {address ? (
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs text-muted">{shortenAddress(address)}</span>
              <button
                onClick={disconnect}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:border-danger hover:text-danger transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={connecting}
              className="hidden sm:block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            className="sm:hidden rounded-lg border border-border p-2 text-muted hover:text-gp-text transition-colors"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border bg-background px-4 py-4 space-y-3">
          <Link href="/events" className="block text-sm text-muted hover:text-gp-text" onClick={() => setMobileOpen(false)}>Events</Link>
          <Link href="/create" className="block text-sm text-muted hover:text-gp-text" onClick={() => setMobileOpen(false)}>Create Event</Link>
          {address && (
            <>
              <Link href={profileHref} className="block text-sm text-muted hover:text-gp-text" onClick={() => setMobileOpen(false)}>My Profile</Link>
              <Link href="/dashboard" className="block text-sm text-muted hover:text-gp-text" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              {isPlatformOwner && (
                <Link href="/platform" className="block text-sm text-primary" onClick={() => setMobileOpen(false)}>
                  Platform
                </Link>
              )}
            </>
          )}
          <div className="pt-2 border-t border-border">
            {address ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">{shortenAddress(address)}</span>
                <button onClick={() => { disconnect(); setMobileOpen(false); }} className="text-xs text-danger">
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => { connect(); setMobileOpen(false); }}
                disabled={connecting}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {connecting ? "Connecting…" : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
