# PetMeta Website — Setup

## Requirements
Node.js 20 or later and npm.

## Run locally
1. Extract this ZIP.
2. Open a terminal in the extracted PetMeta-Website directory.
3. Run `npm ci`.
4. Copy `.env.example` to `.env.local` and configure any services you use.
5. Run `npm run dev -- --port 3001`.
6. Open http://127.0.0.1:3001/ to start with the intro video.

## Checks and production build
- `npm run typecheck`
- `npm run build`
- `npm run start -- --port 3001`

## Included
Next.js/React source, public images and supplied videos, configuration, lockfile, scripts and documentation.

## Service status
- Authentication uses Firebase. Configure your Firebase project and authorized domains for your deployment.
- Checkout and payment-success simulation are demonstrations, not live payment collection.
- Order history and appointment drafts are stored in the browser on this device.
- The visible provider directory contains clearly marked sample providers. Appointment confirmation does not contact real businesses.
- Optional Google Maps/Places integration needs its own keys.
- Public pet listings use local server file storage; production needs durable storage and operational review.

Installed dependencies, build output, local data, private environment files, test screenshots and the legacy Flutter project are excluded.
