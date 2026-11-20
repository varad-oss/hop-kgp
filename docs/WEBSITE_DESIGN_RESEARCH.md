# Hop: website design research

Researched Sat 21 Nov 2026. The live sites were opened in a browser at 1440×900, and their text was read in full where possible. Notes describe patterns; no assets were copied.

## Domain products (same job or adjacent)

| Reference | What was studied | What makes it effective | Relevant to Hop | Avoid |
|---|---|---|---|---|
| [BlaBlaCar India](https://www.blablacar.in/) | Home page and search widget | **The product is the hero**: From / To / Date / Passengers search sits above the fold. Next come three short value lines (travel everywhere, prices, confidence), popular routes, then help answers. | Lead with the real thing: a live departures board and the actual ticket, not marketing art. Show popular routes from real data. | Testimonials and "30 million members" scale claims. We have none, so we show none. |
| [Quick Ride](https://www.quickride.in/) | Home page | An Indian commuter carpool. Mission line, "how it works" in 5 steps, safety framing ("verified professionals", "same company, same gender"). | A step sequence works for a lifecycle product. Verified-community trust is the key objection, mirroring our KGP-only sign-in. | A wall of metrics and a busy, cluttered layout. |
| [Splitwise](https://www.splitwise.com/) | Home page | One sentence carries the value ("Less stress when sharing expenses on trips"), then platforms. | Fare splitting is half of Hop's value; say it in one sentence. | — |
| [Partiful](https://partiful.com/) | Home page at 1440 | Names the enemy: **"No more chaotic group chats."** "One link. Everyone's in." A 3-step create, RSVP, stay-in-sync flow. | Same enemy (the WhatsApp group). Our share link to a plan (`/p/[id]`) is the same growth loop. | Party-photo hero and all-caps shouting; wrong tone for a carriage-ticket brand. |
| [Flighty](https://flighty.com/) | Home page at 1440 | A travel product told **by journey phase** (Preflight, At the airport, After landing) through real notification cards. Product truth over adjectives. | Our story is also time-based: post, room, lock, travel day. Real UI fragments per phase. The ticket aesthetic fits our existing Trip Ticket. | Phone-in-hand photography; we have no photo assets. |
| [Luma](https://luma.com/) | Home page | Two clear doors: Create / Discover. | Two doors: **Try the demo** (judges, outsiders) / **Sign in with KGP Google** (students). | — |

## Website craft references

| Reference | Pattern | Use in Hop |
|---|---|---|
| [Linear](https://linear.app/) | The hero and every feature section show **real product UI fragments** (issue, thread, activity) instead of icons in cards. Headings are short; the UI does the persuading. | Each section on "How it works" renders our real React components (plan card, ticket, captain bubble) with sample data, labelled as a sample. |
| [Awwwards](https://www.awwwards.com/), [Godly](https://godly.website/), [Land-book](https://land-book.com/) | Browsed for editorial travel and transport layouts: asymmetric 12-column grids, oversized serif numerals, generous margins | Big Bodoni numerals for time and fare (already our signature), an asymmetric hero, and full-bleed lacquer-green bands between sections. |
| [GOV.UK Design System](https://design-system.service.gov.uk/patterns/) | Task pages: one thing per page, plain language, step lists | The judge demo page: numbered steps with what to tap and what you'll see. |
| [Apple HIG: tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | Tabs are destinations; actions are buttons | Kept from the previous pass. |

Mobbin, Refero and SaaSFrame need accounts for full flows, so they were not inspected. That limitation is stated here rather than claimed.

## Patterns to avoid (seen often, wrong for Hop)

- Purple-to-blue gradients, glowing orbs, glass cards: off-brand, and they add no information.
- A three-icon feature grid ("Fast. Safe. Cheap."): replaced by real UI fragments.
- Fabricated logos, testimonials or counters. We have 2 real users, so numbers appear only on `/stats`, live and labelled.
- Phone-in-hand stock photography: we have no licensed photos, and it isn't needed.
- An all-caps display face: our Bodoni and Manrope pairing is already distinctive.

## Proposed visual direction

**"The departure hall":** a laptop-first evolution of the existing first-class carriage theme. Kept: lacquer green, brass, stone, Bodoni Moda with Manrope.

- **Layout:** a 12-column grid with a 1200px max container, an asymmetric hero (copy on 5 columns, a live product composition on 7), and section rhythm alternating stone with full-bleed lacquer bands. Headlines sit on the left, never centred.
- **The signature element:** a **departure board** rendered in the hero from real rooms (counts only), set next to the Trip Ticket. A rail-station board is the domain's native visual, and the ticket is already ours.
- **Proof style:** real components with sample data, each labelled "Sample". The WhatsApp scramble is an illustration labelled "Illustration".
- **Type scale:** display 72/64/48, section title 40, lead 20, body 17, meta 14. Bodoni for display and numerals only; Manrope for everything else.
- **Motion:** one hero moment, where the ticket's fare re-splits (₹1,400 → ₹934) when "Meera leaves". It triggers once, on load or on a tap, and respects reduced motion. No scroll-jacking.
- **Icons:** the same thin line SVGs as the app shell. No emoji.
- **Density:** editorial on public pages; a two-pane desktop workspace in the app (room: plans and people / chat; trip: ticket / chat).
