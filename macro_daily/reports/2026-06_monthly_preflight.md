# 2026-06 Monthly Macro Preflight

Generated at: 2026-06-02T01:00:40.928Z
Run date: 2026-06-02
Market date checked: 2026-05-28

## Policy

This preflight runs before dashboard generation on the first run of each month. It validates historical data cache health and produces code-health recommendations. It does not edit production code unless the user confirms a specific change plan.

## Historical Cache Validation

Status: warn

Passes:
- Treasury cache covers the 10-year window from 1962-01-02 to 2026-05-28.
- Public cache contains all configured FRED/public series.
- CFTC Treasury futures positioning is available through 2026-05-12.

Warnings:
- DGS2 latest point is 2026-05-18, more than 7 calendar days behind marketDate 2026-05-28.
- DGS3 latest point is 2026-05-18, more than 7 calendar days behind marketDate 2026-05-28.
- DGS5 latest point is 2026-05-18, more than 7 calendar days behind marketDate 2026-05-28.
- DGS10 latest point is 2026-05-18, more than 7 calendar days behind marketDate 2026-05-28.
- DGS30 latest point is 2026-05-18, more than 7 calendar days behind marketDate 2026-05-28.
- DFII5 latest point is 2026-05-18, more than 7 calendar days behind marketDate 2026-05-28.
- DFII10 latest point is 2026-05-18, more than 7 calendar days behind marketDate 2026-05-28.
- DFII30 latest point is 2026-05-18, more than 7 calendar days behind marketDate 2026-05-28.
- T5YIE latest point is 2026-05-19, more than 7 calendar days behind marketDate 2026-05-28.
- T10YIE latest point is 2026-05-19, more than 7 calendar days behind marketDate 2026-05-28.
- MOVE_PROXY_RATES_VOL latest point is 2026-05-18, more than 7 calendar days behind marketDate 2026-05-28.
- VIXCLS latest point is 2026-05-18, more than 7 calendar days behind marketDate 2026-05-28.
- BAMLH0A0HYM2 latest point is 2026-05-18, more than 7 calendar days behind marketDate 2026-05-28.
- DTWEXBGS latest point is 2026-05-15, more than 7 calendar days behind marketDate 2026-05-28.
- DCOILWTICO latest point is 2026-05-11, more than 10 calendar days behind marketDate 2026-05-28.
- GOLD_PROXY_COMEX latest point is 2026-05-15, more than 7 calendar days behind marketDate 2026-05-28.
- Public cache has 1 fetch errors from the last update.
- DNS lookup for fred.stlouisfed.org failed: ENOTFOUND: getaddrinfo ENOTFOUND fred.stlouisfed.org.
- Direct IP connectivity test failed: curl: (7) Failed to connect to 1.1.1.1 port 443 after 0 ms: Couldn't connect to server.

Issues:
- None

## Network Diagnostics

- checkedAt: 2026-06-02T00:45:30.855Z
- DNS fred.stlouisfed.org: ENOTFOUND: getaddrinfo ENOTFOUND fred.stlouisfed.org
- direct IP connectivity: curl: (7) Failed to connect to 1.1.1.1 port 443 after 0 ms: Couldn't connect to server

## Script Size

- macro_daily/scripts/generate_daily_dashboard.js: 2069 lines, 83 functions, 97 unavailable mentions
- macro_daily/scripts/update_public_data_cache.js: 679 lines, 32 functions, 3 unavailable mentions
- macro_daily/scripts/monthly_preflight.js: 387 lines, 16 functions, 11 unavailable mentions

## Suggested Optimizations

- P1 Split dashboard generation into data, analytics, narrative, and report modules: generate_daily_dashboard.js now owns cache IO, calculations, narrative scoring, action rules, and Markdown rendering. That makes monthly changes riskier than necessary.
- P1 Create one feed registry for required sources and dataGaps: Missing-source strings are currently assembled in several places. A registry would prevent contradictions such as a feed appearing in cross-asset signals while still being listed as missing.
- P2 Separate external marketReaction from rule-based narrative scoring: The code already keeps these conceptually separate, but the function signatures pass marketReaction into scoring without using it consistently. Make that boundary explicit.
- P2 Move report prose templates out of analytics functions: Markdown generation embeds several English and Chinese explanations beside calculation logic. A small report renderer would make wording changes less likely to alter analytics.
- P3 Add fixture-based tests for the six fixed narratives and duration index: Current verification is mostly post-run validation. A small fixture test would catch score drift before a dashboard file is written.

## Possible Logic Conflicts

- Public data cache can say VIX exists while Technical Exhaustion still says MOVE is unavailable: This is acceptable as a proxy distinction, but the report wording should stay precise: VIX is not MOVE, and VIX should not silently replace MOVE.
- Auction evidence currently lives in marketReaction rather than a structured auction cache: The market narrative can cite auctions, but duration rules still cannot use tail/bid-to-cover mechanically until auction data has a first-class schema.
- FRED-augmented Treasury history and Treasury XML history may overlap: The merge prefers FRED for overlapping dates. That is fine for standard DGS series, but it should be documented because Treasury XML remains the freshest controlling source intramonth.
