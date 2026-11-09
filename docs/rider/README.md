# PetMeta Rider

A separate, video-free Rider experience inside the existing Next.js website. Consumer, business, Flutter and Android sources have not been replaced.

## Open

- `/rider`: interactive design workspace, starting on the offline dashboard.
- `/rider/screens`: all 28 mobile frames, grouped and numbered in the requested rider journey order.
- `/rider/frame/welcome`: full-screen mobile app preview.
- `/rider/<screen>`: workspace for an individual screen. Valid screen IDs are in `components/rider/data.ts`.

Each frame is 390 × 844 in the desktop review gallery. The standalone frame adapts to the viewport with safe-area-aware bottom actions and navigation. Content scrolls independently of fixed actions. All screens are explicitly marked as design previews with sample data.

## Implemented

All 28 requested screens, from static splash and welcome through authentication, registration, documents, bank setup, application status, offline/online readiness, offers, pickup, medicine handling, issues, delivery, OTP handover, cash collection, completion, history, earnings, payouts, notifications, support and profile.

Transitions, animated earnings bars, spring bottom sheets, tactile button feedback, route drawing, online status pulse, gentle rider illustration motion and restrained success animation. Reduced-motion preferences are respected. There are no videos in Rider.

Email and password authentication uses Firebase Auth signInWithEmailAndPassword, createUserWithEmailAndPassword and sendPasswordResetEmail. Login requires successful Firebase authentication. Passwords are cleared after authentication and never saved by the app. Email/password provider must be enabled in the existing Firebase project. Live credentials were not used in validation; the browser test verifies rejected credentials with a mocked Firebase response.

## Honest design boundaries

The gallery is a design review tool, not an authenticated rider portal. Opening a screen preview never signs in a user or changes Firebase identity. The sample rider is Rahul Kumar; the connected main order remains PM-2048, Happy Paws in Madhapur to Ananya R. in Kondapur, prepaid, 1.2 km pickup + 2.8 km delivery, ₹45 estimated earnings. Pharmacy PM-2056 and cash order PM-2062 are separate examples.

- Operations, dispatch, document review, bank verification, calls, customer chat, support messages, delivery OTP verification and payments require a rider backend. They are not falsely reported as live.
- Pickup confirmation is gated on item, condition and matching-label checks. Medicine confirmation remains disabled while merchant clearance is pending.
- Delivery OTPs cannot complete a live order without a verification service. The success frame is separately inspectable in the gallery.
- Cash collection requires a review sheet; digital confirmation is a labeled visual state, never derived from a screenshot.
- Sensitive form inputs and image previews remain in component memory and are not sent to servers or written to browser storage. Upload previews mask identity details. Object URLs are revoked when released.
- The map is an explicitly illustrative route diagram, not a live map. Open navigation uses Google Maps directions to the named Hyderabad addresses. Readiness can request browser location/notification permissions.
- Dates and earnings are illustrative October 2026 data. Date/status filters work against sample records. Preferences and draft messages last for the current visit only.

## Validation

`npm run typecheck`, `npm run build` and `node scripts/check-rider.mjs` (requires dev server on port 3005 and installed Microsoft Edge).

The browser check visits all 28 routes, verifies no video or horizontal overflow at 390 px, and exercises email validation, password visibility and rejected credentials, expired offers, gated pickups, live-service requirement for handover, pending pharmacy clearance, cash review, bank validation, and earnings period changes. Screenshots are saved in ignored `test-results/rider/`.

## Assets

`public/logo.jpg` is the supplied PetMeta logo. `public/rider/rider-hero.png` was created with the built-in image generation tool for this task. Its saved prompt is in `docs/rider/asset-prompt.md`. No external rider stock photos or video assets are referenced.
