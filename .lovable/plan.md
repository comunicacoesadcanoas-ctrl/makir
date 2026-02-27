

## Problem

Every time the user opens the app, they must:
1. Wait for auth initialization (up to 5 seconds timeout)
2. See the full hero animation (scatter → line → circle → scroll)
3. Scroll down to reveal the login button
4. Click "Entrar com Google"

If they already have an active session, they still see the animation before being redirected.

## Plan

### 1. Reduce auth timeout from 5s to 2s
In `AuthContext.tsx`, change the fallback timeout from 5000ms to 2000ms. This cuts the worst-case loading wait significantly.

### 2. Skip hero animation for returning users
In `Login.tsx`, if there's an active session detected (even during loading), show only the loading spinner and redirect immediately -- never render the ScrollMorphHero. This avoids forcing authenticated users through the animation.

### 3. Skip scroll requirement for login button
The current `ScrollMorphHero` requires scrolling to reveal the content area (login button). Change the Login page so the login button is visible immediately without scrolling:
- Add a direct login button overlaid at the bottom of the hero that's always visible (not gated behind scroll progress)
- Keep the hero animation as a visual background, but the "Entrar com Google" button should be accessible from the start with a subtle "scroll to explore" hint above it

### 4. Auto-skip animation on revisit
Store a flag in `sessionStorage` after the first visit. On subsequent visits within the same browser tab, skip the intro animation phases (scatter → line → circle) and go directly to the final state with the login button visible.

### Technical Details

**AuthContext.tsx**: Change timeout `5000` → `2000`

**Login.tsx**: 
- Check `sessionStorage.getItem("makir_visited")` 
- If visited before, render a simple login page without ScrollMorphHero
- If first visit, show hero but with login button always visible at bottom
- Set `sessionStorage.setItem("makir_visited", "true")` on mount

**ScrollMorphHero.tsx**:
- Add prop `skipAnimation?: boolean` that jumps directly to final phase
- Move children (login button) to always be visible with `pointer-events-auto`, not gated behind `contentOpacity`

