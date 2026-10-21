# Interviewest

A one-page marketing site for **Interviewest**, a tutoring business run by current
Bergen County Academies (BCA) students that helps 8th graders prepare for the BCA
admissions **interview** and, separately, the BCA application **essay**.

The site has two tracks the visitor can switch between with a toggle at the top:

- **Interview** (green) — mock interview diagnostic, weekly programs, a "High Rigor"
  intensive course, standalone mock-interview packs, and a live price calculator.
- **Essay** (blue) — essay consultation, weekly draft-review programs, a High Rigor
  essay course, standalone review packs, and the same kind of price calculator.

Both tracks share one pricing engine (see `script.js`), so a change to the discount
or pricing rules applies to both automatically.

There is **no backend and no database**. Every "submit" button is a `https://wa.me/...`
WhatsApp deep link or a `mailto:` link that opens the visitor's own WhatsApp/email app
with a pre-filled message — nothing is sent anywhere until the visitor presses send
themselves. The one external integration is a link to a Google Form (for the longer
student-intake questionnaire) and a link to a Google Calendar booking page.

## Files

```
index.html     the page shell (loads fonts + script.js)
script.js      all content, pricing logic, and rendering — edit this to change anything
README.md      this file
LICENSE        MIT license
```

There's no build step. `index.html` loads `script.js`, which renders the entire page
into `<div id="app">` with plain JavaScript (template strings + `innerHTML`). No
framework, bundler, or `npm install` is required.

## Editing the content

Almost everything you'd want to change as the site owner lives in one place: the
`CONFIG` object at the top of `script.js`.

```js
const CONFIG = {
  accent: '#17714A',       // Interview track color
  accentBlue: '#1D5FC4',   // Essay track color

  whatsapp: '732-692-7042',
  email: 'ssaavirs123@gmail.com',
  instagram: '',           // without the @, leave '' to hide the Instagram button
  bookingUrl: 'https://calendar.app.google/...',
  intakeFormUrl: 'https://forms.gle/...',

  priceDiagnostic: 20,
  priceClass: 10,
  priceMock: 25,
  priceExtremeClass: 12,

  priceEConsult: 10,
  priceEClass: 8,
  priceEReview: 12,
  priceEHighClass: 10,

  discountMid: 5,
  discountHigh: 10,
};
```

Change a value and save — no other code needs to change. Prices are in whole
dollars, discounts are percentages.

**Things that are *not* in `CONFIG`** (edit the markup directly in `script.js`
because they're prose, not data):

- The "Head leaders" section still has `[NAME]` / `[ACADEMY]` / `[YEAR]` placeholders
  and a dashed "Photo goes here" box, once for each of the 3 coach cards, in
  `renderInterview()` and `renderEssay()`. Replace the placeholder text and swap
  the placeholder `<div>` for an `<img>` tag pointing at a real photo.
- FAQ questions/answers (the `faq` array inside each render function).
- Hero headline/subhead copy, "How it works" steps, and section descriptions.

## Running it locally

This is a static site — just open `index.html` in a browser, or serve the folder
with any static file server, e.g.:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying with GitHub Pages

1. Push this folder to a new GitHub repository (as the repo root, or into a
   `docs/` folder — either works).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to "Deploy from a branch",
   pick your branch (e.g. `main`) and the folder (`/ (root)` or `/docs`).
4. Save. GitHub will give you a URL like
   `https://<your-username>.github.io/<repo-name>/` within a minute or two.

No further configuration, secrets, or build step is needed — it's one HTML file
and one JS file.

## Important: this is a draft, not legal advice

The site's copy already tries to be careful (no promises of admission, honest
"we can't guarantee you'll get in" language, no real interview questions given
away, Zelle payment details only shared privately over WhatsApp rather than
posted publicly). If you have separate "Program rules," "Parent service
agreement," or "Coach and partner agreement" documents for this business,
treat those — not this README — as the source of truth for policies, and have
them reviewed by an attorney licensed in your state before relying on them,
especially anything involving collecting payment from and working directly
with minors.
