"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getUserProfile, getUserBadges, getBadge } from "@/lib/genlayer/reads";
import type { UserProfile } from "@/lib/types/profile";
import type { Badge } from "@/lib/types/badge";
import ReputationCard from "@/components/badges/ReputationCard";
import BadgeCard from "@/components/badges/BadgeCard";
import LoadingState from "@/components/shared/LoadingState";
import ErrorState from "@/components/shared/ErrorState";
import EmptyState from "@/components/shared/EmptyState";
import Link from "next/link";
import { toChecksum } from "@/lib/utils/address";

export default function ProfilePage() {
  const params = useParams();
  // EIP-55 normalise the URL wallet param — the contract stores keys under the
  // checksummed form and lookup is case-sensitive (see WalletContext for the
  // full explanation).
  const wallet = useMemo(() => toChecksum(params.wallet as string), [params.wallet]);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [p, badgeIds] = await Promise.all([
          getUserProfile(wallet),
          getUserBadges(wallet),
        ]);
        setProfile(p);

        const badgeDetails = await Promise.all(
          badgeIds.map((id: string) => getBadge(id).catch(() => null))
        );
        setBadges(badgeDetails.filter(Boolean) as Badge[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [wallet]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-16"><LoadingState message="Loading profile…" /></div>;
  if (error) return <div className="mx-auto max-w-4xl px-4 py-16"><ErrorState message={error} /></div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
      <Link href="/events" className="text-sm text-muted hover:text-gp-text">
        ← Back to Events
      </Link>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-1">
          {profile && <ReputationCard profile={profile} />}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gp-text">Verified Badges</h2>
            <p className="text-sm text-muted">
              Each badge below was earned by submitting verified proof.
            </p>
          </div>

          {badges.length === 0 ? (
            <EmptyState
              title="No badges yet"
              message="Attend events and submit proof to earn verified soulbound badges."
              action={
                <Link href="/events" className="text-sm text-primary hover:underline">
                  Browse Events
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {badges.map((badge) => (
                <BadgeCard key={badge.badge_id} badge={badge} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
