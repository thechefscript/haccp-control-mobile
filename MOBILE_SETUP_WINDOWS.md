# HACCP Control Mobile 1.0 — Android baseline

This project packages HACCP Control v3.9.2.1 inside Capacitor 8. It uses the SAME Supabase project, Auth users, RLS policies, Storage buckets, RPCs, and HACCP records as the web version.

## 1. Install the development tools

Install on Windows:

- Node.js 22 LTS or newer
- Android Studio Otter (2025.2.1) or newer for Capacitor 8
- Android SDK Platform 36 / Android 16 SDK
- Android SDK Platform-Tools

Android Studio includes an appropriate JDK for normal Android development.

## 2. Extract this project

Use a simple local path, for example:

`C:\HACCP\haccp-control-mobile`

Open that folder in VS Code.

## 3. Copy your EXISTING Supabase config

Do not type your keys again if your web app already works.

From PowerShell in the project root:

```powershell
.\scripts\use-existing-config.ps1 -ConfigPath "C:\path\to\your\web-deploy\config.js"
```

For QR labels generated inside the mobile app, also provide your deployed HTTPS web address:

```powershell
.\scripts\use-existing-config.ps1 `
  -ConfigPath "C:\path\to\your\web-deploy\config.js" `
  -PublicAppUrl "https://YOUR-WEB-HACCP-ADDRESS"
```

`PUBLIC_APP_URL` is used for generated QR links only. Do not use `https://localhost`.

Never put Supabase `service_role`, secret keys, database passwords, SMTP passwords, or other server credentials in `www/config.js`.

## 4. Create the Android project

Run:

```powershell
.\scripts\setup-android.ps1
```

The script will:

1. verify Node.js 22+
2. run `npm install`
3. create the native `android/` project if needed
4. run `npx cap sync android`
5. run `npx cap doctor`

## 5. Open Android Studio

```powershell
npm run android:open
```

Android Studio will open the generated native project.

## 6. Test on your physical Android phone

On the phone:

1. Enable Developer Options.
2. Enable USB debugging.
3. Connect the phone to the PC by USB.
4. Approve the debugging prompt on the phone.

In Android Studio, select the phone in the device selector and press **Run**.

## 7. First mobile smoke test

Do not change HACCP data structures yet. Test the same account you already use on web:

- Sign in / sign out
- Dashboard
- Storage Temperature
- Receiving Control
- Thawing Control
- Food Process Control
- Corrective Actions
- Calibration
- Cleaning & Sanitation
- Allergen Control
- My Training / Assessments
- HACCP Records
- Management Review
- Notifications
- EN / Bahasa Indonesia

Then create ONE harmless test record and confirm it appears in the web app immediately. That proves Android and web are sharing the same Supabase backend.

## 8. Updating web code later

After changing files in `www/`, run:

```powershell
.\scripts\sync-android.ps1
```

Then Run again from Android Studio.

## Important Mobile 1.0 limitations

This first release intentionally keeps the current web behavior.

- Internet is required for Supabase operations.
- Supabase JS and QRCode JS are still loaded from their existing CDN references, so the first screen also expects internet connectivity.
- Browser-style Print/PDF behavior may differ inside Android WebView; native PDF sharing is planned for Mobile 1.3.
- Password recovery/invite links continue to use the existing web flow; native deep links are planned after the baseline is proven.
- Photo inputs use the current web file-picker flow; native Camera integration is the next feature phase.
- QR scanning is not yet native; only existing QR-label generation is preserved. Native scanning comes after Camera.
- No offline write queue is included in Mobile 1.0.

## Planned native phases

- Mobile 1.1 — Camera / photo evidence
- Mobile 1.2 — Native QR scanner
- Mobile 1.3 — PDF/file share sheet
- Mobile 1.4 — Native notifications
- Mobile 1.5 — mobile polish, deep links, network handling
- Mobile 2.0 — iOS
