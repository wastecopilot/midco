# Midco Authorized Retailer: static HTML site

Plain HTML, CSS and JavaScript. No framework or build step is needed to host it.

## Deploy

**Vercel:** choose *Add New → Project*, import this repository, keep every default
setting and click *Deploy*. There's nothing to install or build. `vercel.json` adds
caching and security headers, and `404.html` is used for missing pages. Every push
to `main` redeploys automatically.

**Anywhere else** (cPanel, Netlify, S3, GitHub Pages): upload all files in this folder.

**Locally:** double-click `index.html` (unzip first if you received a zip), or run
`python -m http.server 8000` here and open http://localhost:8000.

## Structure
```
index.html                 Home page (all sections)
legal/*.html               8 legal pages
404.html                   Not-found page
favicon.ico
vercel.json                Vercel headers (caching + security)
assets/css/styles.css      Compiled utility classes + Midco theme (colors, fonts)
assets/css/effects.css     Animation & interaction styles (hand-written)
assets/css/lenis.css       Smooth-scroll base styles
assets/css/src/tailwind.css  Source for styles.css (theme colors, fonts)
assets/js/main.js          All interactions (vanilla JS)
assets/js/vendor/lenis.min.js
assets/images/             Photos: WebP at several widths + JPG fallback
```

## Common edits
- **Phone number:** search and replace `(800) 555-0199` and `+18005550199` in every `.html` file.
- **Prices, plans, copy:** edit the text directly in `index.html`. Each section is marked
  with a comment such as `<!-- 01 · Midco Fiber -->`.
- **Legal entity name:** search for `Independent Authorized Retailer of Midco` in the footer and legal pages.
- **ZIP checker states:** see the `STATES` list in `assets/js/main.js`.
- **Swap a photo:** replace the files in `assets/images/` and keep the same filenames.

## If you add new styling classes
`styles.css` only contains the utility classes the pages already use. If you add a new
class (for example `mt-20`) that has no effect, rebuild the stylesheet from this folder
(needs Node.js; installs into a git-ignored `node_modules` without adding a package.json):

```
npm i --no-save --no-package-lock tailwindcss@4 @tailwindcss/cli@4
npx tailwindcss -i assets/css/src/tailwind.css -o assets/css/styles.css
```

Brand colors and fonts live in `assets/css/src/tailwind.css`; animations live in
`assets/css/effects.css` (plain CSS, edit directly).

## Animations included
**Hero:** staggered load-in · slow Ken Burns zoom on the photo · drifting colour
glows and dot grid · floating glass stat chips · animated gradient pill ·
shimmering "Midco Fiber" headline · flowing purple offer ribbon with light sweep.
**Offer box:** rotating gradient border with breathing glow · flowing header bar
with light sweep · pulsing "Live offer" dot · price count-up to $39 · CTA shine.
**Every section:** slow-moving brand-colour gradient backgrounds (paused
automatically while off-screen) · flowing marquee and closing-CTA bands.

Plus: Lenis smooth scrolling · headline word reveals · clip-path section wipes · parallax
backgrounds and photos · magnetic call buttons · 3D tilt plan cards with glare ·
staggered "Why Midco" grid · infinite trust marquee · sliding nav highlight ·
animated FAQ accordion and mobile menu. All motion is disabled automatically for
visitors who prefer reduced motion.
