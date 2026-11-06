# SafeSpace (simple version)

A plain HTML, CSS, and JavaScript version of SafeSpace. It has no server, no database, and no build step. Everything is saved in the browser's `localStorage`.

## How to start it

Double-click `index.html` to open it in your browser. That's all.

If something doesn't load, run a small local server from this folder and open http://localhost:8000:

```sh
python -m http.server 8000
# or
npx serve .
```

## Accounts

- **Participants:** click **Take part** on the home page and register.
- **Researcher (admin):** sign in at `login.html` with the email and password in `js/config.js`. The defaults are `admin@safespace.local` / `change-me-please`. Change them before you use the app.

## Optional AI replies

Put a Claude API key in `ANTHROPIC_API_KEY` in `js/config.js` to turn on AI replies. Leave it empty to keep them off.

Only do this on your own computer. In a plain HTML site, anyone who opens the page can read the key.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Landing page |
| `privacy.html` | Privacy notice and informed consent |
| `register.html` / `login.html` | Create an account (18+) / sign in |
| `onboarding.html` | Four profile questions, consent, AI opt-in |
| `entries.html` | Your entries, newest first |
| `write.html` | Write a new entry (`write.html?id=...` edits one) |
| `entry.html?id=...` | One entry, with edit, delete, and the AI reply |
| `account.html` | Edit your profile, turn AI replies on or off, erase your account |
| `admin.html` | Researcher dashboard: combined tables only, with counts under 3 hidden |

## Folders

```
css/style.css        all the styles
js/config.js         admin login and the optional API key
js/options.js        every answer choice (age ranges, themes, feelings, …)
js/store.js          saving and loading data in localStorage
js/ui.js             header, page guards, and form helpers
js/ai.js             the optional Claude reply
js/analytics.js      totals for the admin dashboard
js/pages/*.js        the script for each page
```

## How it differs from the full version

- Data is stored only in this browser on this device. It isn't shared between computers or browsers, and clearing your browser data deletes it.
- Researchers only see data from people who used the same browser, so this version works for demos and class presentations, not for a real study.
- Passwords are hashed with SHA-256 in the browser. That's weaker than the server-side Argon2 in the full version.
- There is no notification bell. The AI reply is written while the entry page is open.
