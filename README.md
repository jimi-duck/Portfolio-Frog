# James Ciclitira — Portfolio

Product designer portfolio. Hosted via GitHub Pages.

## Hosting on GitHub Pages

### First time setup

1. **Create a new GitHub repo** at github.com → New repository
   - Name it `jciclitira.github.io` (replace with your GitHub username)
   - Set it to **Public**
   - Don't initialise with a README

2. **Upload these files**
   - Drag all files from this folder into the repo (or use the steps below)
   - Make sure `index.html` is at the root level

3. **Enable GitHub Pages**
   - Repo → Settings → Pages
   - Source: `Deploy from a branch`
   - Branch: `main` / `(root)`
   - Save

4. **Your site will be live at:**
   `https://jciclitira.github.io` (or your chosen name)

---

### Uploading via command line (faster for updates)

```bash
git init
git add .
git commit -m "Portfolio launch"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jciclitira.github.io.git
git push -u origin main
```

### Updating the site later

```bash
git add .
git commit -m "Update"
git push
```

GitHub Pages rebuilds automatically — changes are live within ~60 seconds.

---

## Custom domain (optional)

If you have a domain (e.g. `jciclitira.com`):

1. Create a file called `CNAME` in this folder containing just:
   ```
   jciclitira.com
   ```
2. Point your domain's DNS to GitHub:
   - A record → `185.199.108.153`
   - A record → `185.199.109.153`
   - A record → `185.199.110.153`
   - A record → `185.199.111.153`
3. In GitHub Pages settings, enter your custom domain

---

## File structure

```
index.html          ← Homepage (start here)
cv.html             ← Résumé
coup.html           ← Coup Mobility case study
cooler-future.html  ← Cooler Future case study
vivy.html           ← Vivy case study
crowdscores.html    ← CrowdScores case study
yunojuno.html       ← YunoJuno case study
quidco.html         ← Quidco case study
about.html          ← About page
```

## EmailJS (contact form)

The contact form is already wired up. It uses your EmailJS credentials:
- Service: `service_rwv0n4u`
- Template: `template_0zf917w`

If emails stop working, log in to emailjs.com to check your monthly quota (200/month free).
