# Nexconn Build Challenge 2026 — hackathon brief (source of truth)

## 0. Mission and stance

You are my lead engineer, product designer and hackathon strategist. Our goal is to **finish in the top 3, ideally 1st ($2,000)**, of the **Nexconn Build Challenge 2026** (https://reskilll.com/hack/nexconn, rules at /rules).

There are **5 overall winners, not per-track winners**, so we compete against every entry on one scale.

**Time is the constraint.** It is Wed 18 Nov, about 23:45 IST. Submissions close **Sun 22 Nov, 11:59 PM IST**. That is roughly 96 hours.

- Every decision must favour **a polished, working product with real users** over feature breadth.
- Submit early (submissions can be edited until the deadline) and keep improving.
- Install whatever tools, CLIs, libraries or MCP servers help. **Do not limit yourself to what is on this machine.** Say in one line what you installed and why.

I am a student at **IIT Kharagpur**, so I can reach thousands of real students this week. **Real users are our unfair advantage.** Plan the product around getting them.

---

## 1. Verified facts from every page of the hackathon site

### Format and dates

- Fully online and free.
- Teams of 1–4. The **team leader selects the track and submits**, on the Reskilll dashboard.
- Timeline:
  - Registration and submissions opened Oct 23.
  - **Deadline is Nov 22, 11:59 PM IST.**
  - Judging runs Nov 23–27.
  - Results are announced Dec 1.

### Prizes ($5,000 cash across 5 winners)

- Cash: 1st $2,000 · 2nd $1,250 · 3rd $750 · 4th $500 · 5th $500.
- Every winner also gets an extra year of the Nexconn Free Chat Plan (2 years total, "worth $20,640"). That plan can be used only for the challenge project.
- Every winner also gets a discounted AWS or Alibaba Cloud account (only for an email address not already registered with them).

### Hard rules (breaking one means disqualification or not being judged)

- The app **must use the Nexconn Chat SDK and show real, measurable SDK usage.** Chat UI counts as Chat SDK usage. **Judges disqualify projects that do not use the Chat SDK.**
- The Call SDK is optional.
- Platforms: Web, iOS, Android or Flutter only.
- AI coding tools are explicitly welcome.
- Harassment, plagiarism, cheating, or interfering with the site causes disqualification.
- An existing project is allowed only if a real Nexconn integration is added during the challenge, and the write-up says which parts are new.

### What to submit

1. **Project write-up (PDF).** It must cover why we built the app, which problem it solves, which features use the Nexconn SDK, and **our Nexconn App Key**. The App Key also goes in the submission form. Judges use it to verify SDK usage and count active users.
2. **Demo video** on YouTube, Vimeo, Loom or Google Drive, viewable by anyone with the link. It must show the main features working.
3. **Runnable app**: a live URL, or a direct download link.
4. **Public GitHub repo.**
5. **Bonus: user traction proof.** The rules say *"Traction gives a significant bonus in judging."* **Judges count the active users on our Nexconn app** (the App Key's MAU), plus any proof we give, such as analytics screenshots or user feedback.

### Judging (Nexconn judges; their decisions are final)

| Weight | Criterion | What the rules say judges look for |
|---|---|---|
| **50%** | Completeness & user experience | "Does it work?" The demo works fully from start to end and runs smoothly; the interface is clean; the interaction is clear and easy to understand. |
| **30%** | Innovation & scenario value | A new idea that solves a **real communication problem**, or adds a **new, interesting interaction**. |
| **20%** | Business & growth potential | **Traction and viability.** Early users count as active users on Nexconn. Can the app become a real product? |

### Tracks

The tracks are suggestions only: *"Use the other tracks as ideas, not as limits."* The leader picks one when submitting.

| Track | Focus | Example ideas |
|---|---|---|
| Social & Community | Group messaging and topic-based channels | Watch-party room, interest group chat, creator fan channel |
| Gaming & Live Streams | Squad chat and live-stream interactive chatroom | Squad room, in-match quick chat, spectator overlay |
| Workplace & Collaboration | Direct messaging and team project threads | Team DMs, project threads, shift-handover channel |
| Marketplace & Support | Buyer-seller chat and customer service | Buyer-seller 1-on-1, human-agent dispatch centre, multi-language translated chat |
| Humanitarian & Social Good | Accessible text chat for seniors and communities | Large-font and voice-to-text chat, volunteer dispatch rooms, peer-support check-ins |
| Open Innovation | Any interactive chat idea | — |

### Support

- Open GitHub issues at https://github.com/NexconnAI-Dev/hackathon, using the template `[Platform] - [Version]: [Brief description]`, with integration package, current behaviour, device and logs. Replies come within 12 hours. **Never post the App Key or user IDs publicly.**
- Private questions go to hackathon@nexconn.ai.

### Implications we derive from this (use them)

- **Overall winners only.** The track label barely matters; **quality, completeness, traction and depth of SDK usage decide.** Pick the track that frames our app most naturally, and avoid Open Innovation unless nothing else fits, because it reads as unfocused.
- **50% is "it works".** One flawless core journey beats ten half-features. Zero dead buttons, no lorem ipsum, real empty, loading and error states, fast loads, and it works on a phone.
- **MAU is literally scored.** Every real person who connects with our App Key is a counted active user. Design for **instant onboarding** (under 30 seconds to the first message) and for a **reason to come back this week.**
- **Never fake traction.** No bot or seeded accounts, no inflated MAU. That is cheating and grounds for disqualification. Demo or test accounts must be clearly labelled and excluded from the traction numbers.
- **"Real, measurable SDK usage"** rewards depth. Use many Chat SDK capabilities meaningfully (see the feature map in section 2) and **name each one in the write-up.**

---

## 2. Nexconn technical facts (verified against the docs; re-verify while building)

### Docs and AI integration

- Docs: https://docs.nexconn.ai. An LLM index is at https://docs.nexconn.ai/llms.txt (about 165 KB). **Every page has a `.md` version**, for example `https://docs.nexconn.ai/chatsdk-web.md`.
- The official AI skill: `npx skills add https://github.com/NexconnAI-Dev/nexconn-skills.git --skill nexconn-chat`. It reads llms.txt, generates SDK and Chat UI code, and **generates server-side token issuance that keeps the App Secret out of the client.** Its repo has an `example/web`.
- There is also an optional **Nexconn Console MCP server**, covering users, messages, groups, friends, push, open channels and community channels. Read `/chatsdk-web/build-with-ai/configure-mcp-server.md` and set it up if it works.

### Web SDK packages (npm only; there is no CDN build)

- `npm i @nexconn/engine @nexconn/chat`, plus `@nexconn/chatui` for prebuilt UI. ChatUI uses Web Components with `nc-*` tags built on Lit.
- Example versions: engine and chat 26.2.1, chatui 26.2.5. Keep all three on matching versions.
- **ChatUI for Web is not tuned for portrait mobile browsers**, supports only Chrome 68+, Safari 13+ and Edge 100+, and doesn't work in the WeChat browser.
- **Campus users will mostly be on phones.** So build our own mobile-first UI on the **Chat SDK**. Use ChatUI only where it fits a desktop view.

### Flow

1. Call `NCEngine.initialize({ appKey })` **once**. Pick the data-centre `areaCode` that matches the Console setting; India users likely mean Singapore, so verify.
2. Register handlers: `addConnectionStatusHandler` and `addMessageHandler`.
3. Have **our server** register the user and get a token via the Platform Chat API, signed with the App Secret. Read "API request signature", "Base URL" and "Register a user".
4. Call `NCEngine.connect({ token })` once; the SDK handles reconnection.
5. Use channel classes: `DirectChannel`, `GroupChannel`, `OpenChannel`, `CommunityChannel` / `CommunitySubChannel`.

### Feature map (use the ones that serve the product; each one used meaningfully raises the SDK-usage score)

- **Messages:** text, image, file and voice; **custom message types**; edit, recall and delete; **read receipts**; **typing indicators**; **@mentions**; history and search; **message metadata (KV)**; drafts; unread counts; pinned channels; do-not-disturb; multi-device sync.
- **Presence:** subscribe to online status; user profiles; friends.
- **Group channels:** create, join and manage members, plus admin, mute and freeze controls.
- **Open channels** (live rooms with metadata KV) and **community channels** (with subchannels and user groups).
- **Streaming messages (`RC:StreamMsg`)**, sent via the Server API to a direct or group channel in chunks with `seq` and `complete`. On the client, handle `onStreamMessageRequestInit`, `onStreamMessageRequestDelta` and `onStreamMessageRequestComplete`. **This is the natural path for an AI assistant streaming replies into a chat.**
- **Built-in translation** (`NCEngine.translateModule`; enable it in Console under Chat settings → Messages → Translation). ⚠️ The Free plan allows only **10,000 characters**, after which it needs a card. Use it sparingly or behind a toggle.
- **Moderation:** profanity filter, plus auto-moderation (which may be billed; check).
- **Webhooks:** pre-messaging, message sent, user connection status, group changes, and more.
- **Broadcast and system messages.**
- **Call SDK for Web (optional):** 1-to-1 and group voice and video. It needs HTTPS, the Call service enabled in Console, and a card for the 10,000 free minutes. Note its separate **dev and prod App Keys**, whose data is isolated.

### Plans

- Sign up via the hackathon link https://www.nexconn.ai/free-chat-api?utm_source=hackathon to get the **Free Chat Plan**: 10K MAU, unlimited messages, full webhooks, 180-day history and no card. The default Console Free plan in the docs is only 1 month and 2,000 MAU, so **confirm which plan our app is on.**
- ⚠️ The campaign rule is **"one app per organization, and the choice can't be changed later."** Create **one** app for this project and use that App Key everywhere: dev, prod, write-up and form. Otherwise our MAU splits across keys and judges see fewer users.
- Full benefits require completing the SDK integration and **sending at least one message.**
- Peak concurrent connections (PCC) allowance is about 5% of the MAU tier. Watch it during a launch spike, and handle "connection unavailable" errors gracefully.

---

## 3. What to build: concept, track and why it wins

Spend **at most 30 minutes** on a time-boxed `superpowers:brainstorming` session with me. Score each candidate with the Concept Rubric in section 6.1. My recommendation is below. Confirm it or beat it, then lock it.

### Recommended concept A: "Hop", real-time trip-pooling rooms for students (Track: **Social & Community**)

**The real communication problem (named audience).** At IIT Kharagpur, every vacation, end-semester exam and festival starts the same scramble. Students travelling to Kolkata airport (CCU), Howrah, Kharagpur station or Santragachi try to find co-passengers to split a cab. Today this happens in chaotic WhatsApp and Facebook posts ("anyone going to CCU on the 28th?"). Those posts get buried, phone numbers get exposed to strangers, and nobody knows who has actually committed. **Verify with me which travel wave is coming up (end-sems or winter break), because that is our launch moment.**

**Core loop (must be flawless; this is our 50%):**

1. **Onboard in under 30 seconds.** Sign in with an institute-email OTP for trust (confirm the exact domain with me), then add a display name and hall.
2. **Post a trip intent:** from, to, date, departure window, seats and luggage.
3. **Instant match.** The server finds overlapping intents and **auto-creates or joins a group channel** for that trip window, using the Server API.
   - The UI shows a live roster with **online presence**, **typing indicators** and **read receipts**.
   - **No phone numbers are shared until the trip is locked.**
4. **Decide in-chat, not in free text.** Use **custom message types**:
   - "Proposal" cards (leave 6:30 AM from the Main Building gate, cab ₹2,400 total) with **tap-to-vote**, where votes are stored in **message metadata**;
   - a "Lock trip" card that freezes the roster;
   - an auto **fare split**;
   - an **@mention** nudge for people who haven't voted.
5. **Trip day:** quick-reply chips ("at the gate", "running 5 min late", "cab number is…"). An optional one-tap group **voice call** (Call SDK) is P2.
6. **Room auto-archives** after the trip.

**Innovation hooks (our 30%):**

- **Chat that self-organizes.** People state an intent and the right room forms around them. That beats searching posts.
- **Structured decisions inside chat:** proposal, vote, lock and split, built on custom messages plus metadata.
- **An AI "trip captain"** (P1) that **streams** a summary of what was decided and who still needs to confirm, via `RC:StreamMsg` from our server.
- **Trust and safety by design:** a verified-campus badge, an optional women-only room, report and block, and the profanity filter.

**Business and growth (our 20%):**

- **Traction:** campus launch through hall groups, societies and travel-season posts, with a live public counter. Real MAU appears on the App Key.
- **Viability:** the same engine generalizes to any campus (India has 40,000+ colleges), corporate shuttles and event travel. Revenue could come from B2B (institutes, companies) or from cab-operator partnerships and referrals.
- **The write-up shows** a growth loop (each trip invites 2–3 new users), retention (every vacation recurs), and the cost (free up to 10K MAU on Nexconn).

**Why this beats typical entries:** most teams will ship a generic chat clone or an AI-bot demo with zero users. We ship a real tool that students use during the judging window, with measurable MAU and genuine testimonials.

### Backup concepts (score them too; switch only if A scores clearly lower)

- **B. "Crunch", live exam doubt rooms (Social & Community / Workplace).** One open channel per course for the exam week. An AI tutor streams answers; doubts are pinned; answers are upvoted via metadata. Traction works only if exams are happening right now.
- **C. "Relay", a multilingual AI-plus-human support desk (Marketplace & Support).**
  - An AI agent streams first answers and hands off to a human agent queue (a dispatch centre built on group channels).
  - Built-in translation for buyers and sellers.
  - Moderation and pre-messaging webhooks.
  - Very high SDK depth and an obvious B2B story for Nexconn, but **weak traction in 4 days**.
- **D. "Lantern", accessible family check-ins for seniors (Humanitarian).** Large font, voice notes, voice-to-text, one-tap "I'm OK" check-ins. Strong scenario value, but hard to get users quickly.

**Track rule of thumb:** choose the track whose examples look most like our app. For A, that's **Social & Community** (group messaging plus topic-based channels). Tell me before the team leader selects it on the dashboard.

---

## 4. Setup and tools (start immediately, in parallel with brainstorming)

- Check for and install **Node 22+**, **pnpm**, git, `gh`, and the **Vercel CLI** (frontend plus serverless functions) or Cloudflare `wrangler`. Use **Supabase** (Postgres plus email-OTP auth) or an equivalent for the trip intents and matching store.
- Install the official skill:
  ```bash
  npx skills add https://github.com/NexconnAI-Dev/nexconn-skills.git --skill nexconn-chat
  ```
  Verify it loaded: ask yourself which docs to read before a Web Chat SDK connection flow. The answer should reference llms.txt, the Web SDK docs and server-side token issuance. If the skill didn't land in `.claude/skills/`, copy `skills/nexconn-chat` there manually.
- Add MCP servers if they are missing:
  - **Playwright MCP** for real-browser end-to-end tests with **two separate user contexts chatting**: `claude mcp add playwright -- npx @playwright/mcp@latest`
  - **Context7** for current library docs: `claude mcp add --transport http context7 https://mcp.context7.com/mcp`
  - The **Nexconn Console MCP** if the docs page gives a working configuration.
- Fetch and save the key docs locally into `docs/nexconn/`, using the `.md` URLs:
  - `chatsdk-web.md`, `chatsdk-web/init.md`, `connection/connect.md`, `connection/reconnect-kick.md`;
  - `group-channel/*`, `message/send.md`, `message/customize.md`, `message/read-receipt.md`, `message/stream-msg.md`;
  - `channel/typing-status.md`, `user/subscribe_online.md`;
  - the Platform Chat API pages on signature, base URL, user registration, group create/join, `send-group-stream` and webhooks;
  - `guides/realtime-chat/intro-chat/pricing-plans.md`.
- Secrets go **only** in server env vars (`NEXCONN_APP_SECRET`) and in `.env.local`, which is git-ignored. Add a pre-commit secret scan (gitleaks). **The App Key goes in the write-up and form, but never commit the App Secret.**

---

## 5. Workflow: skills, tool calls and a 96-hour plan

Announce each skill as you use it. Process skills come first, then implementation skills.

| When | Skill or tool |
|---|---|
| Idea lock (≤30 min) | `superpowers:brainstorming`, time-boxed. Then write a **short** design doc and get my OK. |
| Plan (≤30 min) | `superpowers:writing-plans`, cut into P0 / P1 / P2 |
| Build | `nexconn-chat` (SDK integration); `superpowers:subagent-driven-development` or `superpowers:dispatching-parallel-agents` for independent pieces (token server, UI, matching, write-up); `superpowers:test-driven-development` **only for the critical logic** (token issuance, matching, vote tallying, fare split) |
| UI | `frontend-design:frontend-design` + `anthropic-skills:design-taste-frontend`: a distinctive, clean, **mobile-first PWA**, not a template look |
| Bugs | `superpowers:systematic-debugging`. If blocked more than 30 minutes on an SDK issue, file a GitHub issue on NexconnAI-Dev/hackathon with the template, keeping secrets out. |
| Before saying "done" | `superpowers:verification-before-completion`: run it, test with Playwright using 2–3 users, take screenshots |
| Reviews | `superpowers:requesting-code-review` with a fresh subagent at each gate |
| Traction dashboard | `dataviz` for the stats page and the charts in the write-up |
| Write-up PDF | `anthropic-skills:pdf` (or HTML to PDF) |
| Demo video assets | `anthropic-skills:video-making` for title cards, captions and b-roll. I record the screen and narrate. |

**Tool-calling rules:**

- Look things up with WebFetch or Context7 on the `.md` docs. **Never guess SDK method names.** Use `gh` for repos and issues.
- Verify in a real browser with Playwright, including mobile viewport emulation.
- Deploy previews constantly.

### Timeline (IST; shift it if I say so)

| Window | Goal | Exit check |
|---|---|---|
| **Wed 23:45 – Thu 03:00** | Idea locked; Nexconn account and app created via the hackathon link; skill installed; scaffold (Vite + React or Next.js, TypeScript); **token endpoint plus the first real message between two users, deployed** | Two browsers exchange messages on the live URL |
| **Thu** | P0 core loop: OTP onboarding → post intent → match → group channel → chat with presence, typing and read receipts → proposal, vote and lock cards → fare split. Mobile-first UI. **Soft launch to 10–20 friends tonight.** | A full journey on a phone with no dead ends; first real MAU |
| **Fri** | Polish (empty, loading and error states; reconnect handling; push or in-app badges); safety (report, block, profanity filter); P1 AI trip captain with streaming; public stats page; **broad campus launch**; fix bugs from real users | 50+ real users; zero P0 bugs |
| **Sat** | Traction push and feedback (a 2-question in-app form plus testimonials); iterate on top complaints; **record the demo video**; draft the write-up; **submit a complete early version tonight** | A valid submission exists |
| **Sun until 18:00** | Final polish, a fresh judge-panel review, re-record if needed, final PDF with the latest traction numbers, update the submission. **Feature freeze at 18:00. Final submit by 21:00.** | Everything is submitted with a 3-hour buffer |

**Scope:**

- **P0 is the core loop only.**
- P1: the AI streaming captain; women-only rooms; stats page; quick-reply chips.
- P2: Call SDK group voice; built-in translation; desktop ChatUI view.
- **Cut P2 without regret.**

---

## 6. Self-reflection protocol and rubrics

At every gate (after the design, after P0, before launch, before submit), dispatch a **fresh reviewer subagent that has not seen the build**. Have it score against these rubrics in `docs/reviews/<time>-<gate>.md`, then fix the lowest scores first. Be harsh.

### 6.1 Concept Rubric (1–10 each; weights mirror the judging)

- **Can it be flawless in 72 hours?** (×5)
- **Is it a new idea or interaction that solves a real communication problem for a named audience?** (×3)
- **Can we get real MAU by Sunday, and is there a believable product path?** (×2)
- Tie-breakers: depth of meaningful Chat SDK usage, and how well the demo story lands in 2 minutes.

### 6.2 Disqualification gate (must be all ✅)

- [ ] The Chat SDK is visibly and measurably used (connect, channels, messages); the same App Key runs in production
- [ ] The App Key is in both the PDF and the form; the App Secret appears nowhere public (run a repo-wide secret scan)
- [ ] The live URL works for a brand-new user on mobile Chrome and Safari and on desktop
- [ ] The public GitHub repo has a README with setup steps, architecture and an **SDK feature list with file references**
- [ ] The demo video is viewable by anyone with the link, shows the main features working, and is about 2–3 minutes
- [ ] The write-up states what is new versus pre-existing (all of it is new)
- [ ] No fake users or seeded MAU; demo accounts are labelled

### 6.3 Judge Rubric (score as a **Nexconn product judge**, 1–10 per criterion, then compute the weighted total)

- **Completeness & UX (50%).** A 10 looks like this:
  - a new user goes from link to first message in under 30 seconds;
  - the full journey works first try on a phone;
  - no dead buttons and no console errors;
  - graceful reconnects and offline handling;
  - clear empty, loading and error states;
  - accessible (contrast, tap targets of 44 px or more, labels);
  - fast (Lighthouse mobile performance of 90 or more).
- **Innovation & scenario value (30%).** A 10 looks like this:
  - a judge immediately sees a real communication pain solved better than WhatsApp groups;
  - at least one interaction they haven't seen before (self-forming rooms; vote, lock and split cards; a streaming AI captain).
- **Business & growth (20%).** A 10 looks like this:
  - real MAU visible on the App Key;
  - analytics screenshots, quotes from real users and retention signals;
  - a clear market, monetization and growth loop.

**Bar to submit:** a weighted total of **8.5 or more**, and no criterion below 7. If it's below the bar, cut scope and polish rather than add features.

### 6.4 Engineering and security checks

- Token issuance happens only server-side, with signed Server API calls.
- Rate-limit the token and intent endpoints.
- Validate input; sanitize message rendering (no XSS in custom cards).
- Handle Nexconn status codes (see each `code.md`) with user-friendly messages.
- Handle device conflict and kick events.
- Never expose personal data such as phone numbers before a trip is locked.
- Minimal data retention; a privacy note.

### 6.5 Reflection loop (after each work block)

1. Does the core loop work end-to-end in production right now? Show proof: a Playwright run and screenshots.
2. Score 6.3 and name the 3 weakest items.
3. For each, find the smallest fix with the biggest score gain.
4. Re-plan, then update `docs/STATUS.md` with the scores, the MAU count and the next steps.

---

## 7. Submission assets (start drafting on Friday, not Sunday)

### Demo video (about 2:30, my own voice)

| Time | Shot |
|---|---|
| 0:00–0:15 | The pain: a screenshot of chaotic WhatsApp travel posts (blur the names) |
| 0:15–1:45 | Live on a phone: onboard → post a trip → instant match → typing and read receipts → proposal, vote, lock → fare split → AI captain summary streaming in |
| 1:45–2:15 | Traction: the live counter, the Nexconn Console MAU, two user quotes |
| 2:15–2:30 | Vision: any campus, any commute |

Include captions. Use no copyrighted music.

### Write-up PDF (4–6 pages)

1. Problem and audience.
2. Solution and the core flow, with screenshots.
3. **A table of Nexconn SDK features used, each with where and why.**
4. Architecture diagram (client, our server, the Nexconn Server API, webhooks).
5. Innovation.
6. Traction: MAU, messages, trips formed, testimonials, analytics screenshots.
7. Business model and growth plan.
8. What is new during the challenge.
9. **The App Key.**
10. Links: live app, repo, video.

### Repo

- README with a hero GIF, a live link, a feature list mapped to the SDK, setup steps (`.env.example`), architecture and a licence.
- Screenshots in `/docs/media`.

### Traction kit

- A launch post template for hall and society groups, plus a QR-code poster.
- An in-app share link ("invite your co-passengers").
- A 2-question feedback prompt shown after a trip locks.
- Daily MAU screenshots from the Console.

---

## 8. Ask me these immediately, in one batch, then keep working while I answer

1. Am I solo, or who is on my team, and what are their roles? Who is the team leader on Reskilll?
2. Confirm concept A (or pick B, C or D). **Which travel wave or exam period is happening at KGP this week?** Is the institute-email domain right? Which groups can I post in for launch?
3. Have I created the Nexconn account via the hackathon Free Chat Plan link yet? (I will paste the App Key into `.env.local` myself; the App Secret never goes in chat.)
4. Do I have an LLM API key for the AI captain (P1)? If not, skip it or use a free tier.
5. Hosting preference: Vercel + Supabase (recommended), or something else?

Then **start section 4 setup right away.**
