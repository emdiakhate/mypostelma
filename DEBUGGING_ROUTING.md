# Debugging Routing Issue

## Problem
- Clicking on `/dashboard` or `/calendar` from other pages redirects to `http://localhost:8080/` (landing page)
- Need uniform layout for all pages

## Current Routing Structure

### App.tsx Routes
- `/` → LandingPage (NO Layout)
- `/dashboard` → Dashboard (WITH Layout)
- `/calendar` → Index (WITH Layout)
- `/analytics` → Analytics (WITH Layout)
- `/hashtags` → HashtagTracker (WITH Layout)
- `/queue` → QueuePage (WITH Layout)
- `/archives` → ArchivesPage (WITH Layout)
- `/competitors` → CompetitiveIntelligence (WITH Layout)

## Debugging Steps

1. Open browser console (F12)
2. Navigate to any page (e.g., /analytics)
3. Click on "Dashboard" or "Calendrier" in sidebar
4. Check console logs for:
   - Navigation events
   - URL changes
   - Any redirects

## Possible Causes

1. **Landing Page Redirect**: Landing page might be redirecting to dashboard
2. **Layout Navigation Logic**: Issue in `Layout.tsx` handlePageChange
3. **Page-Level Redirects**: Pages might have useEffect with redirects
4. **Router Configuration**: React Router might not be configured correctly

## How to Fix

### Option 1: Check if pages have redirects
Look for `useEffect` with `navigate('/') in:
- src/pages/Dashboard.tsx
- src/pages/Index.tsx

### Option 2: Check if Layout has issues
In `src/components/Layout.tsx`, verify:
- `activePage` detection is correct
- `handlePageChange` navigates to correct routes

### Option 3: Add temporary logging
Add console.logs in:
- `Layout.tsx` handlePageChange
- `App.tsx` routes
- Page components useEffect

## Expected Behavior

1. User clicks "Dashboard" in sidebar
2. URL changes to `/dashboard`
3. Layout stays visible
4. Dashboard component renders
5. No redirect to `/`

## Test Plan

1. Start on `/analytics`
2. Click "Dashboard" → should go to `/dashboard`
3. Click "Calendrier" → should go to `/calendar`
4. Click "Analytics" → should go to `/analytics`
5. All navigation should maintain Layout

