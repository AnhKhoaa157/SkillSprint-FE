---
title: FE Agent — SkillSprint UI Map
version: 1.0
author: GitHub Copilot
---

# Agent Tasks

This agent file describes tasks an automated agent can run to understand and change the frontend.

tasks:
  - id: read-structure
    title: Read project structure
    steps:
      - list files under `src/`
      - read `src/main.tsx`, `src/app/App.tsx`, `src/app/routes.ts`
  - id: centralize-nav
    title: Centralize navigation
    steps:
      - create `src/app/config/nav.ts`
      - export `APP_NAV` and `ADMIN_NAV`
      - update `DashboardLayout.tsx` and `AdminDashboard.tsx` to import nav from config
  - id: open-user-mgmt
    title: Open user management from sidebar
    steps:
      - add event listener `openAdminUserMgmt` in `AdminDashboard.tsx`
      - implement `loadMgmt`, `openMgmtDetail`, `saveMgmtStatus`, `saveMgmtRoles`
  - id: ui-polish
    title: Polish user management UI
    steps:
      - add search, filters, add-user modal
      - render pill tags for roles

# How to run
1. Read this file. 2. Pick a task id and follow the steps. 3. Use git to stage changes.

# Notes
- Centralized nav is created at `src/app/config/nav.ts`.
- Admin user management functions live in `AdminDashboard.tsx` (can be refactored to separate module).

