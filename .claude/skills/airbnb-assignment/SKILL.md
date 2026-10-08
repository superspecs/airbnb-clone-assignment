---
name: airbnb-assignment
description: Plan, implement, review, and prepare deployment of the Airbnb-style full-stack assignment using its required stack, workflows, and originality constraints.
---

# Airbnb Assignment Workflow

Use this skill when working on the Airbnb marketplace assignment. Read the root `CLAUDE.md` first and follow its stack, scope, and integrity requirements.

## Before coding

1. Read the assignment brief and inspect the repository structure and Git status.
2. Confirm Next.js/TypeScript, Python FastAPI or Django, and SQLite. Preserve a valid existing setup.
3. If a reference repository URL is present in `CLAUDE.md` or provided by the user, inspect its license and provenance. Treat it as architecture/concept reference only unless specific reuse is clearly licensed and allowed. Never copy an assignment clone implementation.
4. Write a concise milestone plan and list assumptions. Continue useful independent work if a reference URL is missing.
5. Inspect the reference website in the browser and produce page/interaction notes before implementation.

## Implementation order

1. Define data model, API contract, seed strategy, and backend validation rules.
2. Implement listing search/detail and a visually coherent explore page.
3. Implement availability and booking with persistent storage and overlap checks.
4. Implement My Trips and prove the booking remains after reload.
5. Implement host listing CRUD and persistence.
6. Refine responsive states, errors, loading, empty states, and visual quality.
7. Document, deploy, and prepare final evidence.

Keep every milestone reviewable. Explain intended changes before broad edits. Avoid adding optional systems before core workflows are working.

## Required domain rules

- Backend is authoritative for booking validation and price totals.
- Check-out is exclusive; reject overlaps with confirmed bookings.
- Prevent invalid dates, past check-in, and guests above listing capacity.
- Use mock checkout only; do not request or store card information.
- Use SQLite persistence for listings and bookings; browser storage alone is insufficient.
- Authentication may be simplified, but host/guest roles and assumptions must be visible and documented.

## Browser review

Check at desktop and mobile widths. Review Explore, filters, a listing detail, date selection, mock booking, My Trips after reload, host CRUD, and visible errors/empty states. Compare screenshots with `docs/reference-notes.md`. Report actual evidence and unresolved gaps; never claim a check happened if it did not.

## Handoff

Ensure README explains setup, architecture, schema, API, seed data, assumptions, and deployment. Summarize changed areas, commands run, verified flows, deployed URL if available, and remaining limitations.
