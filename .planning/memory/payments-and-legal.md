---
name: payments-and-legal
description: Paddle is the store (later); buy buttons are mailto until then; legal links on every page
---

- Paddle will be the merchant of record for all products. Lemon Squeezy no longer takes new sellers.
- Until the owner's Paddle account exists, the paid buttons say "Contact us to buy" and open a mailto to
  hassan93radi@gmail.com.
- Paddle reviews the domain. Every page footer links Terms, Privacy and Refunds and shows the contact
  email. The legal page is `/razov-db/legal.html`, and the root hub links to it too.
- The site presents only the three products.

**Why:** the owner decided this on 2026-11-25; the DataPilot session relayed it.

**How to apply:**
- When the store exists, set `STORE_URL` in `assets/js/site.js` to
  `https://hasanradi93.github.io/razov-db/datapilot/#pricing`. It must start with `https://`.
- Show "Secure checkout by Paddle" only then.
