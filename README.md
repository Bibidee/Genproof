# GenProof

> **Proof you were really there.**
> GenLayer-powered intelligent proof-of-attendance and proof-of-participation platform.

GenProof issues soulbound event credentials only after attendees submit meaningful proof that they actually attended, participated, or understood the event. A GenLayer intelligent contract scores each submission for relevance, understanding, specificity, originality, and supporting evidence — and rejects generic, copied, or low-effort proofs before any badge is ever issued.

## Why this exists

Normal POAP-style badges are easy to farm: anyone with a claim link can mint one. GenProof badges mean more than *"I had the link"* — they mean *"I showed up and proved it."*

## Stack

- **Frontend:** Next.js 16 (Turbopack) · TypeScript · Tailwind CSS
- **Smart contract:** GenLayer Intelligent Contract (Python) on **GenLayer Studionet**
- **SDK:** `genlayer-js@1.2`
- **Icons:** lucide-react

## Architecture

The deployed `GenProofRegistry` contract is the **single source of truth** for events, submissions, badges, and user reputation. The frontend never fakes core state in local memory — every read/write goes through the contract.

```
┌────────────────┐    reads + writes via genlayer-js     ┌────────────────────────┐
│  Next.js app   │  ─────────────────────────────────►   │  GenLayer Studionet     │
│                │                                       │  GenProofRegistry       │
│  /             │                                       │  ──────────────────     │
│  /events       │                                       │  create_event           │
│  /create       │                                       │  submit_proof           │
│  /event/[id]   │                                       │  review_submission (AI) │
│  /review/[id]  │                                       │  issue_badge            │
│  /profile/[w]  │                                       │  manual_review          │
│  /badge/[id]   │                                       │  close_event            │
│  /dashboard    │                                       │  + platform reads       │
│  /platform     │                                       │                         │
└────────────────┘                                       └────────────────────────┘
```

## Routes

| Route | Audience | Purpose |
|---|---|---|
| `/` | Public | Landing page — problem/solution, scoring, badge levels |
| `/events` | Public | Browse all public events (via `get_all_events`) |
| `/create` | Connected user | Create a new event (organiser) |
| `/event/[eventId]` | Public + connected | Event details, claim form, verified attendees list |
| `/review/[submissionId]` | Submitter | Trigger AI review, see verdict, claim badge if approved |
| `/profile/[wallet]` | Public | Reputation profile + badge gallery for a wallet |
| `/badge/[badgeId]` | **Public, no wallet** | Public credential verification page |
| `/dashboard` | Connected (organiser view) | Manage your events, manual review queue |
| `/platform` | **Platform owner only** | Platform-wide stats, all events, all badges, all users |

## Roles

- **Public / non-users** — can verify any badge or browse public events without connecting a wallet.
- **Users / attendees** — can submit proof, see their own badges, build reputation.
- **Event organisers** — can create events, close them, and manual-review borderline submissions for their own events.
- **Platform owner** — the deployer wallet. Sees aggregated stats across the whole platform.

## AI verification

When `review_submission` is called for a pending submission, the contract calls `gl.eq_principle.prompt_non_comparative` with:

- a **callable** that returns the full event + proof context as a string
- a **task** describing what the judge should do
- **criteria** defining the JSON output schema and scoring rules

The verdict must satisfy:

| Score | Verdict |
|---|---|
| 0–39 | `rejected` |
| 40–59 | `needs_manual_review` |
| 60–79 | `approved`, badge level `attendee` |
| 80–89 | `approved`, badge level `participant` |
| 90–100 | `approved`, badge level `contributor` |

For hackathons/technical events with a project link, the AI may assign `builder` level.

## Anti-farming

Contract-level guards (all enforced on chain):

- One submission per wallet per event
- Duplicate proof hash blocked across all submissions
- Reflection must be ≥ 20 characters
- Per-event claim limit enforced
- `event_secret_hash` requires attendees to know the event code
- `claim_deadline` (Unix timestamp) blocks late submissions

Plus AI-level risk flags: `generic_response`, `copied_response`, `event_mismatch`, `low_effort`, `wrong_quiz_answer`, `irrelevant_proof`, `unsupported_claim`, `possible_farming`, `weak_supporting_evidence`.

## Setup

```bash
npm install
cp .env.local.example .env.local
# edit .env.local — set NEXT_PUBLIC_GENPROOF_CONTRACT_ADDRESS to your deployed address
npm run dev
```

Environment:

```env
NEXT_PUBLIC_GENPROOF_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_GENLAYER_RPC=https://studio.genlayer.com/api
```

## Acceptance tests

The repo includes an end-to-end test runner that drives the live contract directly through `genlayer-js`:

```bash
node scripts/acceptance-test.mjs
```

It covers all 13 contract functions plus permission checks — currently **23/23 pass** against the deployed contract on Studionet.

## Contract

The Python intelligent contract source lives in [`contract/GenProofRegistry.py`](contract/GenProofRegistry.py).

It is a GenLayer credential registry — **not** an ERC-721 NFT contract. Badges are on-chain records (`badge_id`, `owner`, `event_id`, `proof_hash`, `verification_score`, `badge_level`, `verification_summary`), and they are soulbound by design. An optional ERC-721 mirror layer can be added later.

## Project structure

```
GenProof/
├── app/                          # Next.js App Router routes
│   ├── badge/[badgeId]/          # Public credential verification
│   ├── create/                   # Event creation form
│   ├── dashboard/                # Organiser dashboard
│   ├── event/[eventId]/          # Event details + claim
│   ├── events/                   # Public event list
│   ├── platform/                 # Platform-owner-only dashboard
│   ├── profile/[wallet]/         # Reputation + badge gallery
│   └── review/[submissionId]/    # AI review result + claim badge
├── components/                   # Reusable UI components
├── contract/
│   └── GenProofRegistry.py       # GenLayer intelligent contract
├── lib/
│   ├── context/                  # Wallet provider
│   ├── genlayer/                 # SDK wrapper (reads, writes, client)
│   ├── types/                    # Shared TypeScript types
│   └── utils/                    # Format / validation / constants
├── scripts/
│   └── acceptance-test.mjs       # End-to-end test runner
└── .env.local                    # Contract address + RPC URL
```

## Demo

The canonical demo event is *"GenLayer Intelligent Contracts Workshop"* with event code `GENPROOF2026`.

- **Good proof** *(approved at participant)*: a 3-sentence reflection mentioning that intelligent contracts judge natural language and off-chain context, unlike normal smart contracts.
- **Bad proof** *(rejected)*: `"Nice event. I attended. Give me badge."` — earns 5 risk flags.

## License

Private — built for the GenLayer demo track.
