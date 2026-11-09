# PetMeta home integration

The active website is Next.js. Start with `npm run dev -- --port 3001`.
Flow: `/` opening video -> `/login` or `/register` -> `/transition` -> `/home`.

## Live Google Maps
Set environment variables in `.env.local` and restart the development server:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: browser-restricted key with Maps JavaScript API enabled. Allow the actual preview/production origins.
- `NEXT_PUBLIC_GOOGLE_MAP_ID`: optional configured map ID; development falls back to DEMO_MAP_ID.
- `GOOGLE_MAPS_API_KEY`: server key with Places API (New) enabled. Never prefix this key with NEXT_PUBLIC.
Google Cloud billing and API activation must be completed by the account owner. The code cannot issue Google credentials.

`POST /api/places` takes `{lat, lng, kind: "grooming" | "vet"}` and returns real provider details sorted by calculated distance. Missing keys and upstream errors have explicit UI states. Map markers select matching provider cards.

## Booking scope
Pets, favourites, and appointment drafts are stored on this device. Prices and offers are preview examples. Times are preferences, not salon availability. Draft saving does not contact a salon, reserve a slot, take payment, or confirm an appointment. Connect provider inventory and a booking backend before launching paid bookings.

## Verified
TypeScript check; mobile overflow; category/search filters; intro/animation routing; location permission and appointment draft persistence with a simulated provider response. Live Maps and provider booking cannot be verified without their credentials/services.

## Marketplace and realistic imagery
- Generated photorealistic cat hero replaces the 3D cartoon on Home. Pointer-driven CSS perspective, floating accents and card depth respect reduced-motion preferences.
- Cats/dogs: searchable example profiles, sale/adoption filtering, actual-photo upload, persistent local drafts and seller email links.
- Signed-in users can publish a draft through `/api/marketplace`. Firebase ID tokens are verified server-side against the configured project; deletion is restricted to the listing owner.
- Published listings persist in `.local-data/marketplace.json` on this development server. This folder is ignored by Git. Use a managed database and image storage before a multi-instance/serverless deployment.
- Food/accessories have sample inventory with working quantities, persistent cart and order-draft review. No money is collected and no product order is sent.
- Seed pet photos are generated illustrations of profiles, not claims of real animals for sale. User listings require an uploaded pet photo.
- Verified: image loading, category filtering, cart/order draft saving, uploaded-photo listing persistence, mobile overflow, TypeScript, and unauthenticated API rejection. Signed-in publication still needs an account-level live check.
