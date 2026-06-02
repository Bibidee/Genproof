import Link from "next/link";
import {
  Zap,
  CalendarDays,
  PenLine,
  BrainCircuit,
  BadgeCheck,
  XCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-24 text-center">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Zap className="h-3.5 w-3.5" />
            Powered by GenLayer Intelligent Contracts
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-gp-text sm:text-6xl">
            Proof you were{" "}
            <span className="text-primary">really there.</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg text-muted">
            GenProof issues intelligent event badges only after attendees submit meaningful proof
            of attendance, participation, or understanding.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/events"
              className="rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Explore Events
            </Link>
            <Link
              href="/create"
              className="flex items-center gap-1.5 rounded-xl border border-border px-8 py-3 text-sm font-semibold text-gp-text hover:border-primary/50 transition-colors"
            >
              Create Event
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-danger/20 bg-danger/5 p-6 space-y-3">
            <XCircle className="h-6 w-6 text-danger" strokeWidth={1.5} />
            <h3 className="font-semibold text-gp-text">The Problem With Normal Badges</h3>
            <p className="text-sm text-muted">
              Normal event badges are easy to farm. Anyone with a claim link can mint a badge,
              even if they never attended, never listened, or never contributed. They mean
              nothing.
            </p>
          </div>
          <div className="rounded-xl border border-success/20 bg-success/5 p-6 space-y-3">
            <CheckCircle2 className="h-6 w-6 text-success" strokeWidth={1.5} />
            <h3 className="font-semibold text-gp-text">The GenProof Difference</h3>
            <p className="text-sm text-muted">
              GenProof uses GenLayer to review attendance proof before issuing badges.
              Attendees submit reflections, quiz answers, event codes, or project links — and
              GenLayer&apos;s intelligent contract judges them.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold text-gp-text">How It Works</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "01",
              Icon: CalendarDays,
              title: "Create Event",
              desc: "Organiser creates an event and sets the proof requirements and badge details.",
            },
            {
              step: "02",
              Icon: PenLine,
              title: "Submit Proof",
              desc: "Attendee submits a reflection, quiz answers, or project link as proof of participation.",
            },
            {
              step: "03",
              Icon: BrainCircuit,
              title: "AI Review",
              desc: "GenLayer reviews the proof for relevance, understanding, originality, and farming risk.",
            },
            {
              step: "04",
              Icon: BadgeCheck,
              title: "Earn Badge",
              desc: "If approved, a soulbound badge is issued and updates the attendee's reputation profile.",
            },
          ].map(({ step, Icon, title, desc }) => (
            <div key={step} className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                <span className="text-xs text-muted font-mono">{step}</span>
              </div>
              <h4 className="font-semibold text-gp-text">{title}</h4>
              <p className="text-sm text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Scoring */}
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-gp-text">How Proof Is Scored</h2>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          {[
            { label: "Attendance Relevance", pts: 30, color: "bg-primary" },
            { label: "Understanding", pts: 25, color: "bg-secondary" },
            { label: "Specificity", pts: 20, color: "bg-success" },
            { label: "Originality", pts: 15, color: "bg-warning" },
            { label: "Supporting Evidence", pts: 10, color: "bg-danger" },
          ].map(({ label, pts, color }) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gp-text">{label}</span>
                <span className="text-muted">{pts} pts</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pts}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Badge levels */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-gp-text">Badge Levels</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { level: "Attendee", score: "60+", color: "text-secondary", bg: "bg-secondary/10", desc: "Basic proof of attendance." },
            { level: "Participant", score: "80+", color: "text-primary", bg: "bg-primary/10", desc: "Clear understanding or engagement." },
            { level: "Contributor", score: "90+", color: "text-success", bg: "bg-success/10", desc: "Meaningful contribution proven." },
            { level: "Builder", score: "80+", color: "text-warning", bg: "bg-warning/10", desc: "Hackathon or project evidence." },
          ].map(({ level, score, color, bg, desc }) => (
            <div key={level} className="rounded-xl border border-border bg-card p-5 text-center space-y-2">
              <div className={`mx-auto inline-flex rounded-full ${bg} px-4 py-1.5 text-sm font-semibold ${color}`}>
                {level}
              </div>
              <p className="text-xs text-muted">Score: {score}</p>
              <p className="text-xs text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl space-y-4">
          <h2 className="text-3xl font-bold text-gp-text">
            Ready to earn a badge that means something?
          </h2>
          <p className="text-muted">
            GenProof badges mean more than &quot;I had the link&quot;. They mean{" "}
            <span className="text-gp-text font-medium">&quot;I showed up and proved it.&quot;</span>
          </p>
          <Link
            href="/events"
            className="inline-block rounded-xl bg-primary px-10 py-3.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Browse Events
          </Link>
        </div>
      </section>
    </div>
  );
}
