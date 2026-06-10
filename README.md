# StatLock

StatLock is a lightweight sports analytics dashboard built with vanilla JavaScript, ES Modules, and modern CSS. It surfaces football and basketball fixtures using API-SPORTS, and it features a cache-first data strategy to reduce API calls and improve performance.

## Project Overview

StatLock is designed as a modular frontend app with a clean separation of concerns:

- `ExternalServices.mjs` handles data fetching, caching, and API normalization
- `UIController.mjs` manages DOM rendering, loading states, and user interactions
- `AccumulatorSlip.mjs` persists selected match slip data to `localStorage`

The app fetches fixtures from API-SPORTS, normalizes sport-specific responses, and displays confidence scores on each match card.

## Tech Stack

- JavaScript (ES Modules)
- Vite for local development and bundling
- Modern CSS with responsive grid layouts
- API-SPORTS for football and basketball data
- `localStorage` cache-first persistence
- Render-compatible environment setup

## Features

- Football and basketball fixture browsing
- Cache-first API strategy with 1-hour stale tolerance
- Normalized match cards with confidence badges
- Add/remove selections in an accumulator slip
- Loading and empty-state handling
- Responsive layout for mobile screens

## How to Run Locally

1. Install dependencies

```bash
npm install
```

2. Create a `.env` file in the project root with your API key:

```bash
VITE_SPORTS_API_KEY=your_api_sports_key_here
```

3. Start the dev server

```bash
npm run dev
```

4. Open the local URL shown in the terminal.

## Environment Variables

- `VITE_SPORTS_API_KEY` — used for local Vite development
- `API_SPORTS_KEY` — supported for deployment environments like Render

The app uses defensive environment detection so the key is never hardcoded in source.

## Build for Production

```bash
npm run build
```

Then preview the production bundle locally:

```bash
npm run preview
```

## Deployment Notes

For Render or similar static-hosting platforms, configure the environment variable `API_SPORTS_KEY` in the service dashboard.

If you need a production-ready Render setup, the build command is `npm run build` and the publish directory is the Vite build output.

## Future Enhancements

- User authentication and saved team preferences so signed-in users can track favorite teams and keep their accumulator slip across devices.
- Real-time match alerts and push notifications for live score updates, lineup changes, or game-day reminders.
- Expanded analytics with team comparison charts, H2H visualizations, and personalized performance trends.

## File Structure

- `index.html`
- `package.json`
- `src/css/style.css`
- `src/js/main.js`
- `src/js/modules/ExternalServices.mjs`
- `src/js/modules/UIController.mjs`
- `src/js/modules/AccumulatorSlip.mjs`
- `src/js/modules/MatchDetails.mjs`

## Notes

This app is built to be resilient against API schema changes, to minimize rate-limit risk with caching, and to keep the frontend modular and easy to maintain.
