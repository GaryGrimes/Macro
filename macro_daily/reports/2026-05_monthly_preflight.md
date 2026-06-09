# 2026-05 Monthly Macro Preflight

Generated at: 2026-05-19T01:44:24.678Z
Run date: 2026-05-19
Market date checked: 2026-05-18

## Policy

This preflight runs before dashboard generation on the first run of each month. It validates historical data cache health and produces code-health recommendations. It does not edit production code unless the user confirms a specific change plan.

## Historical Cache Validation

Status: warn

Passes:
- Treasury cache covers the 10-year window from 1962-01-02 to 2026-05-18.

Warnings:
- Public cache is missing GOLDAMGBD228NLBM.
- Public cache has 1 fetch errors from the last update.

Issues:
- None

## Network Diagnostics

- checkedAt: 2026-05-19T01:43:35.448Z
- DNS fred.stlouisfed.org: 198.18.0.20
- direct IP connectivity: ok

## Script Size

- macro_daily/scripts/generate_daily_dashboard.js: 1981 lines, 79 functions, 95 unavailable mentions
- macro_daily/scripts/update_public_data_cache.js: 352 lines, 18 functions, 0 unavailable mentions
- macro_daily/scripts/monthly_preflight.js: 379 lines, 13 functions, 11 unavailable mentions

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
