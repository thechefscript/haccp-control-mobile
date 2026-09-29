# HACCP Control Mobile

Android/Capacitor baseline for HACCP Control v3.9.2.1.

Start with **MOBILE_SETUP_WINDOWS.md**.

## Source mapping

- `www/index.html` — current HACCP UI
- `www/app.js` — v3.9.2 app logic + v3.9.2.1 timezone fix + mobile QR-base safety
- `www/styles.css` — current minimalist responsive design
- `www/mobile-shell.js` — minimal native-shell detection only
- `www/config.js` — intentionally NOT included; copy your current working file locally
- `capacitor.config.ts` — Android native shell configuration
- `database/` — reference migrations only; do NOT rerun if your current Supabase is already on v3.9.2.1

The mobile app uses the same Supabase backend as the web app. There is no second database and no second user system.
