# Gateway Growth — St. Louis Window Market Dashboard

An interactive territory-planning dashboard for a St. Louis replacement-window business. It helps compare selected neighborhoods and municipalities using housing stock, owner occupancy, home value, demographic distributions, estimated custom-window fit, prospect counts, and total addressable market (TAM).

**Live dashboard:** https://gateway-growth-stl-map.mihiranagamm.chatgpt.site/

## What the dashboard includes

- Interactive St. Louis map with neighborhood and municipal boundaries
- Map color modes for opportunity, home value, custom-fit share, and older owners
- Neighborhood selection linked to territory metrics and distributions
- Owner-home value segments: all, under $500K, and $500K+
- Housing-age histogram with territory drill-down
- Buyer audience profiles covering age, income, and owner-home value
- Printable territory briefs for individual markets

## Data and modeling notes

The dashboard works at an aggregated territory level, not at an individual parcel or household level. Prospect counts, custom-window fit, priority scores, and TAM are directional planning estimates. They should not be interpreted as verified household-level facts or exact sales forecasts.

Boundary layers are based on City of St. Louis neighborhood and St. Louis County municipal GIS sources. Market inputs use public demographic and housing indicators, including ACS-derived measures, supplemented by documented modeling assumptions in the dashboard methodology section.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal.

## Validate the project

```bash
npm run lint
npm test
```

## Main source files

- `app/Dashboard.tsx` — dashboard data, calculations, and interactions
- `app/globals.css` — primary visual design and responsive behavior
- `app/city-market-boundaries.json` — selected city neighborhood geometry
- `app/county-market-boundaries.json` — selected county municipality geometry
- `app/studio/` — alternate visual exploration

## Technology

React, TypeScript, vinext, Vite, and Cloudflare-compatible deployment tooling.

