# Demo video script (about 2:30)

**How to record:**
- Record the screen at 1440×900 in Chrome. Use your own voice, with no music and no copyrighted audio.
- Turn on auto-captions in YouTube or Loom.
- Before recording, open https://hop-kgp.vercel.app/demo and press **Start over** so the room is fresh.

| Time | On screen | Say (roughly) |
|---|---|---|
| 0:00–0:15 | Home page, hero. Scroll to "The scramble" section. | “Every vacation, thousands of KGP students go to the same stations on the same days. Today we find co-passengers in hall WhatsApp groups. Posts get buried, our numbers go to hundreds of strangers, and nobody knows who’s actually in.” |
| 0:15–0:30 | Hero ticket re-split, then the departures board. | “Hop puts everyone going to the same station on the same day in one room, built on Nexconn group channels, and the room ends in a decision: one locked plan and a fare that splits itself.” |
| 0:30–1:30 | `/demo`. Follow the steps in the embedded app: the room, **I’m in** (2 → 3 in, ₹1,400 → ₹934), then **Lock trip**. | “This is the real app. A plan is a custom Nexconn message. When I tap I’m in, our server updates the card’s message metadata and every phone sees 3 in and ₹934 live. With two or more in, anyone can lock. Locking opens a private trip, another group channel, with a ticket and everyone’s numbers. Numbers are never shared before this.” |
| 1:30–1:50 | In the trip: **Demo: Meera leaves**, so the ticket shows ₹1,400. Then try typing a phone number in a room. | “If someone leaves, the fare re-splits for everyone. And phone numbers typed into a public room are blocked by a Nexconn pre-messaging webhook before they’re delivered.” |
| 1:50–2:10 | **Catch me up**: the captain streams in. | “Catch me up asks Gemini for a summary and streams it into the trip as a Nexconn streaming message, labelled as AI and never given anyone’s number.” |
| 2:10–2:25 | `/built-on-nexconn` SDK table, then `/stats`. | “Every SDK feature is listed with its code. These are our live numbers from real students, with demo guests excluded.” Show the Nexconn Console MAU here if you have it. |
| 2:25–2:35 | Home page, "Two ways in". | “Any campus with a semester-end exodus can use this. Hop: the ride home, sorted in one room.” |

**After recording:**
- Set the video to "anyone with the link".
- Rebuild the PDF with the video link:

```bash
VIDEO_URL=https://your-link PW_DIR=<playwright-core node_modules> node submission/build-writeup.mjs
```
