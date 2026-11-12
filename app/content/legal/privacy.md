Semestria is a study workspace for organising assignments, course materials, notes, and deadlines. This policy explains what personal data we collect, why we collect it, who processes it, and what you can do about it.

We wrote it to be read, not to hide behind. If anything is unclear, email us.

## 1. Who we are

Semestria ("Semestria", "we", "us") is operated by **Ridha Arlian**, an individual based in Indonesia. We are the controller of the personal data described in this policy.

Contact for privacy questions and requests: **contact@semestria.my.id**

<!-- [REVIEW] Confirm whether a registered business entity will replace the individual controller before launch. -->

## 2. Scope

This policy covers **semestria.my.id** and the application served from it, including demo sessions. It does not cover third-party websites you open from your materials, or Google's own handling of your Google account.

## 3. Data we collect

**Account data from Google.** When you sign in with Google we receive your email address, your display name, and your profile photo. We use the email address as your account identity. We check your Google account identifier during sign-in, but we do not store that identifier, and we do not store OAuth access or refresh tokens.

**Profile data.** Your display name, your avatar (either the copy we import from Google or an image you upload), and whether you have hidden your avatar.

**Content you create.** Workspaces, tasks, checklists, submission links, materials, rich notes, tags, material links, and files you upload (PDFs, slides, books, videos). For files we also store the file name, size, and content type.

**Activity history.** When a material changes we record an entry with a label, a timestamp, and sometimes a file name or URL, so you can see what changed.

**Usage timestamps.** When a workspace, task, or material was created or updated, when a material was last opened, and when you marked it reviewed.

**Preferences.** Theme, accent colour, week start, default landing page, last active workspace, and notification toggles.

**Demo data.** If you start a demo, we create a disposable account. To rate-limit demo sessions we store an HMAC-SHA256 hash of your IP address. We do not store the raw IP address for this purpose.

**Technical logs.** Our hosting provider, Cloudflare, processes request metadata such as IP address, user agent, and requested path as part of running the service. These logs are controlled by Cloudflare's platform settings.

**What we do not collect.** We do not collect your precise location, contacts, calendar, payment details (the service is free and has no payments), advertising identifiers, or biometric data. We do not use third-party analytics, advertising, or tracking scripts.

## 4. How we use your data

- To create and secure your account and keep you signed in.
- To store, display, sync, and back up your workspaces, tasks, materials, and files.
- To enforce access rules so that only you can read your own data.
- To prevent abuse, including demo rate limits and protection against unauthorised access.
- To respond to support and privacy requests.
- To comply with legal obligations.
- To decide what to build next, using aggregated, non-identifying information only.

We do not sell your personal data. We do not use your content to train machine-learning models. We do not send marketing email.

## 5. Legal bases

Under Indonesia's Personal Data Protection Law (UU PDP No. 27/2022) we rely on:

- **Performance of a contract** — to provide the workspace you signed up for.
- **Legitimate interests** — to keep the service secure, prevent abuse, and fix failures. We balance these against your rights.
- **Consent** — where we ask for it, for example importing your Google profile photo, which you can undo by removing your avatar.
- **Legal obligation** — where a law requires us to keep or disclose data.

## 6. Sharing and processors

We share personal data only with providers that help us run Semestria, and only as needed:

- **Google** — sign-in via Google OAuth, and downloading your Google profile photo when you sign in.
- **Cloudflare** — application hosting, file storage in R2, database connection pooling through Hyperdrive, and platform logs.
- **Neon** — managed PostgreSQL database hosting.

These providers process data on our instructions under their own terms and data protection commitments. We do not authorise them to use your data for their own advertising.

We may also disclose data if required by law, to respond to a valid legal request, or to protect the rights and safety of users. If Semestria is transferred to another operator, data may transfer as part of that operation, and we will notify you before a new policy applies.

## 7. International transfers

Our database is hosted by Neon in the **Singapore** region, and Cloudflare processes and stores data across its global network, which may include locations outside Indonesia.

Where data leaves Indonesia, we rely on the providers' contractual data protection terms and on your agreement to these terms when you use the service. We do not claim that Indonesia has issued an adequacy decision for these locations.

<!-- [REVIEW] Lawyer to confirm the cross-border transfer mechanism and wording under UU PDP. -->

## 8. Cookies and local storage

We use a small number of cookies, all of them functional. We do not use advertising or cross-site tracking cookies, so we do not show a cookie consent banner.

**Cookies**

| Name | Purpose | Lifetime | Notes |
| --- | --- | --- | --- |
| `semestria-session` | Keeps you signed in | 7 days (1 day for demo) | HttpOnly, SameSite=Lax |
| `oauth-state` | Protects the Google sign-in redirect against forgery | 10 minutes | HttpOnly, SameSite=Lax |
| `oauth-redirect` | Remembers where to send you after sign-in | 10 minutes | HttpOnly, SameSite=Lax |
| `sidebar_state` | Remembers whether the sidebar is open | 7 days | Set by the browser, not HttpOnly |

**Browser storage**

| Key | Storage | Purpose |
| --- | --- | --- |
| `semestria-settings` | localStorage | Caches your theme so the page paints correctly before loading |
| `semestria-theme-css` | localStorage | Stores the generated theme CSS |
| `nuxt-color-mode` | localStorage | Remembers light, dark, or system mode |

You can clear these at any time in your browser settings. Clearing the session cookie signs you out.

## 9. Retention

- **Account data** is kept while your account exists.
- **Content and files** are deleted when you delete them, when you delete the workspace they belong to, or when you delete your account. File objects are removed from storage at the same time.
- **Account deletion** removes your database rows immediately. Residual copies in provider backups are purged within **30 days**. Backups are not used to restore individual accounts.
- **Demo accounts** are deleted after **7 days**. Cleanup runs when a new demo starts, so an expired demo may persist slightly longer than 7 days. A demo account is deleted immediately when you sign in with Google.
- **Platform logs** are retained according to Cloudflare's settings, which we do not control.

<!-- [REVIEW] Confirm the 30-day backup window with Neon and Cloudflare before publishing. -->

## 10. Security

We protect your data with:

- HTTPS for all traffic.
- Server-side checks that scope every workspace, task, material, and file request to the signed-in owner.
- Private file storage: files are served only through a session-authenticated endpoint, and uploads use short-lived presigned URLs.
- Provider-managed encryption at rest for the database and file storage.
- A sealed, HttpOnly session cookie.

**Files are stored as uploaded. We do not scan them for malware.** Do not upload anything illegal, and be careful with files from sources you do not trust.

No system is perfectly secure. If we become aware of a breach affecting your data, we will notify you and the relevant authority as required by law.

## 11. Your rights

Subject to applicable law, you may:

1. **Access** the personal data we hold about you.
2. **Correct** inaccurate data, such as your display name or avatar.
3. **Delete** your account and its content.
4. **Obtain a copy** of your data in a usable format.
5. **Withdraw consent** where processing relies on consent.
6. **Object to or request restriction of** processing based on legitimate interests.
7. **Complain** to the Indonesian data protection supervisory authority (Komdigi).

To exercise any of these, email **contact@semestria.my.id** from the address linked to your account. We respond within **30 calendar days** and may extend once by another 30 days with notice.

## 12. Account deletion and copies

You can delete your account yourself from **Settings → Profile → Delete account**. This removes your workspaces, tasks, materials, notes, files, activity history, and avatar, and signs you out.

If you prefer email, or want a copy of your data first, contact us at **contact@semestria.my.id**. We will verify that the request comes from the account owner.

## 13. Demo mode

Demo sessions are disposable accounts. They are clearly marked in the app, changes are temporary, and the account is deleted when the demo expires or when you sign in with Google. We store only a hashed IP address for rate limiting, plus the sample content the demo creates. Do not enter sensitive personal data in a demo.

## 14. Age

Semestria does not knowingly collect personal data from children without parental consent. If you believe a child has created an account, contact us and we will delete it.

## 15. Changes to this policy

When we make a material change, we show an in-app notice at least **14 days** before it takes effect, and we update the version and date at the top of this page. If we later add email notifications, we may also email you. Continuing to use Semestria after a change takes effect means you accept the updated policy.

## 16. Contact

Privacy questions, requests, and complaints: **contact@semestria.my.id**

If you are not satisfied with our response, you may contact Komdigi, the Indonesian ministry responsible for personal data protection.
