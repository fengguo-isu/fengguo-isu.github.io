# Jason (Feng) Guo — Academic Homepage

Pure HTML, one CSS file, and one small script for the Research page. No build step. No frameworks.

## File Structure

```
fengguo-isu.github.io/
├── index.html              # Home page (name, photos, links, bio, education)
├── research.html           # Publications, working papers, topics, data, teaching, service
├── style.css               # Shared stylesheet; colors are at the top
├── assets/
│   ├── research.js         # Filters, topic chart, timeline on research.html
│   └── band.svg            # Banner behind the "Research" title
├── fonts/                  # Barlow Condensed + Inter, self-hosted (OFL.txt = license)
├── research/index.html     # Forwards the old /research/ address to research.html
├── teaching/index.html     # Forwards the old /teaching/ address to research.html#teaching
└── files/
    ├── portrait.jpg        # Large home-page photo (web-sized copy of update_photo.jpg)
    └── profile.jpg         # Earlier photo, shown next to the bio
```

## Still to do

- **Stats row** — the citation, h-index, and SSRN numbers near the top of
   `research.html` are typed in by hand. Update them, and the "as of"
   date, now and then.

## Adding or updating a paper

Everything on the Research page — the filter counts, topic chart, and
timeline — is built from the paper list in `research.html`.
To add a paper, copy an existing `<li class="item">` block and edit it:

- `data-lists`: `utd24` and/or `ft50`, or leave it empty.
- `data-topics`: one or two of `audit`, `ma`, `gov`, `disc`, `tech`, `labor`.
- `data-year`: the publication year.
- Wrap each coauthor in `<span class="co">…</span>`, spelled the same way
  every time, so clicking a name filters the list.

Working papers go in the list under "Working papers" the same way, without
`data-lists`. Give them the current year as `data-year` (the timeline shows
them as hollow marks), put a status such as R&R or Under review in
`<em class="st">…</em>` after "Working paper", and link the title only when
the public draft is current. Numbering is automatic. Topic names and colors are set at
the top of `assets/research.js`.

## How to Deploy on GitHub Pages (Windows)

### Step 1 — Create a GitHub repo

GitHub Pages will serve a personal site for free if your repository is named
exactly `<username>.github.io`. For example, if your GitHub username is
`jasonfengguo`, name the repo `jasonfengguo.github.io`.

1. Go to <https://github.com/new>.
2. **Repository name:** `<your-username>.github.io` (lowercase, exact).
3. **Visibility:** Public.
4. Don't add a README, .gitignore, or license (you'll push files in the next step).
5. Click **Create repository**.

### Step 2 — Push the files (using GitHub Desktop, easiest on Windows)

1. Install [GitHub Desktop](https://desktop.github.com/) and sign in.
2. **File → Clone repository →** pick the repo you just created.
   Choose a local folder (e.g., `C:\Users\Jason\Documents\GitHub\`).
3. Open that folder in File Explorer. Copy all the files from this `jason-site/`
   folder INTO it (so `index.html` is at the top level of the repo).
4. Add `profile.jpg` to the `files/` subfolder.
5. Back in GitHub Desktop, you'll see all the changes. Type a commit message
   like "Initial site" and click **Commit to main**, then **Push origin**.

### Step 3 — (Usually automatic) Turn on Pages

For a `<username>.github.io` repo, GitHub Pages turns on automatically.
To verify:

1. On GitHub.com, go to your repo → **Settings** → **Pages**.
2. **Source** should be `Deploy from a branch`, branch `main`, folder `/ (root)`.
3. Wait 1–2 minutes, then visit `https://<your-username>.github.io`.

### Step 4 — Update later

Edit the `.html` files locally. In GitHub Desktop, commit the changes and push.
Your site refreshes within a minute or two.

## Optional: Custom Domain

If you own a domain (e.g., `jasonguo.com`):

1. In your repo, create a file named `CNAME` (no extension) with one line:
   `jasonguo.com`.
2. At your domain registrar, add a CNAME DNS record pointing to
   `<username>.github.io`.
3. In **Settings → Pages**, enter the custom domain and tick **Enforce HTTPS**.

## Notes on the Design

- Dark throughout. Iowa State gold (`#F1BE48`) marks links and highlights;
  cardinal (`#C8102E`) is used for bars, rules, and the background glow. All
  colors are variables at the top of `style.css`.
- Both pages sit at the top level of the folder, so they preview correctly
  when opened straight from disk. The old `/research/` and `/teaching/`
  addresses forward to `research.html`.
- Headings and labels use Barlow Condensed; body text uses Inter. Both are
  served from `fonts/` rather than Google Fonts, so the site loads normally
  where Google is blocked.
- The home-page photo fills the right side and fades into the background; on
  phones and tablets (≤900px) it sits at the top and fades down behind the name.
- All content was migrated from your existing Google Site
  (<https://sites.google.com/view/jason-feng-guo/>) — proofread before
  going live in case anything has changed.
