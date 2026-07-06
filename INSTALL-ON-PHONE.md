# LifeOS on your phone — install once, update forever 📱

This sets up LifeOS so you:
- get **one permanent web address**,
- **install it once** on your phone (it gets an icon and runs full-screen, offline),
- and whenever the app changes, you just **reopen it and it updates itself** — no reinstalling, exactly like a normal app.

There are two parts: a **one-time setup** (about 10 minutes), then you're done for good.

---

## Part 1 — One-time setup: your permanent address (do this once)

The goal: put LifeOS online at a fixed link that updates automatically when the files change. The friendliest way is **GitHub (stores the app) + Netlify (publishes it)**. Both are free.

### Step 1 — Install GitHub Desktop
1. Go to **https://desktop.github.com** → download and install.
2. Open it and **sign in** (create a free GitHub account if you don't have one — just an email + password).

### Step 2 — Turn your LifeOS folder into a repository
1. In GitHub Desktop: **File → Add Local Repository**.
2. Choose the folder **`LifeOS-v2`** (this folder).
3. It will say "this isn't a Git repository — create one?" → click **Create a repository** → **Create Repository**.
4. Click **Publish repository** (top bar). Untick "Keep this code private" if you want (either is fine) → **Publish**.

Your app now lives in a GitHub repository. ✅

### Step 3 — Publish it with Netlify
1. Go to **https://app.netlify.com** → **Sign up** → choose **"Sign up with GitHub"** (one click).
2. Click **Add new site → Import an existing project → Deploy with GitHub**.
3. Authorise, then pick your **LifeOS-v2** repository.
4. On the settings screen, leave everything default:
   - **Build command:** *(leave blank)*
   - **Publish directory:** *(leave as is / `/`)*
5. Click **Deploy**.

After ~30 seconds you'll get a permanent link like **`https://your-lifeos.netlify.app`**.
(You can rename it under **Site settings → Change site name** to something like `moha-lifeos`.)

**That's the setup done — forever.** 🎉

---

## Part 2 — Install on your phone (once)

1. On your phone, open your Netlify link in the browser.
2. Add it to your home screen:
   - **iPhone (Safari):** tap **Share** → **Add to Home Screen** → **Add**.
   - **Android (Chrome):** tap **⋮** menu → **Install app** (or **Add to Home screen**).
3. Tap the new **LifeOS** icon. Full-screen, offline, yours. Do the quick onboarding once here.

You never install it again.

---

## Part 3 — How updates work now (automatic)

Whenever the app changes (I edit the files in your `LifeOS-v2` folder):

1. **Double-click `update.bat`** in the `LifeOS-v2` folder.
   *(Or: open GitHub Desktop → type a summary → **Commit to main** → **Push origin**.)*
2. Netlify rebuilds your same link automatically in ~30 seconds.
3. **Open (or reopen) LifeOS on your phone** — it detects the new version, refreshes once, and you're on the latest. No reinstalling, no new icon, nothing to do.

That's it. It behaves like a normal mobile-app update. The offline service worker handles the version-swap for you.

> First time you run `update.bat`, Windows may ask you to install **Git** — if so, get it from **https://git-scm.com/download/win** (defaults are fine), then double-click `update.bat` again.

---

## Simpler alternative (no GitHub, but you upload to update)

If you'd rather not use GitHub Desktop:

1. Create a free **Netlify** account.
2. Go to **https://app.netlify.com/drop** and drag the `LifeOS-v2` folder in → it creates a site.
3. **Site settings → Change site name** to fix a permanent URL, then install on your phone (Part 2).
4. **To update:** open your site → **Deploys** tab → drag the `LifeOS-v2` folder onto the page. Same URL, and your phone auto-updates on reopen.

This keeps one URL and one install — you just drag the folder to publish an update, instead of double-clicking `update.bat`.

---

## Good to know
- **Private & offline:** your data lives only on your phone. It is not uploaded anywhere.
- **Sync across devices** (same data on phone *and* PC) would need the optional cloud backend in `ARCHITECTURE.md` — a later step if you ever want it.
- **If an update ever doesn't show:** fully close the app and reopen it once more; the new version swaps in.
