# James Ciclitira — Portfolio

Personal product design portfolio for James Ciclitira. A set of static, hand-coded HTML pages — no framework, no build step. Live at [www.jciclitira.com](https://www.jciclitira.com).

## Structure

```
index.html          Homepage
cv.html              Résumé

enter.html           Case study — Enter (energy tech)
coup.html            Case study — Coup Mobility
cooler-future.html   Case study — Cooler Future
vivy.html            Case study — Vivy
crowdscores.html     Case study — CrowdScores
yunojuno.html        Case study — YunoJuno
quidco.html          Case study — Quidco (not currently linked from the homepage grid)

img/                 Case study screenshots and image assets
CNAME                Custom domain config for GitHub Pages
.nojekyll            Disables Jekyll processing so assets serve as-is
```

## Running locally

Serve the folder with any static file server, e.g.:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploying

Hosted on GitHub Pages, deployed from the `main` branch. Pushing to `main` triggers an automatic rebuild — changes are usually live within a minute or two.

```bash
git add .
git commit -m "Update"
git push
```

## Custom domain

Already configured — the `CNAME` file points at `www.jciclitira.com`, with DNS records pointed at GitHub Pages. No action needed unless the domain changes.

## Contact form

The homepage contact form sends via EmailJS:
- Service: `service_rwv0n4u`
- Template: `template_0zf917w`

If it stops working, check the account's monthly send quota at emailjs.com (200/month on the free tier).
