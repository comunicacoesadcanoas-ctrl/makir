

## Diagnosis

The preview is stuck on the loading spinner because the `AuthContext` has no error handling around `fetchProfile`. When the profile fetch fails (network timeout, RLS error, etc.), the `await fetchProfile()` call throws an exception, and `setLoading(false)` is never reached. The `loading` state stays `true` forever, causing an infinite spinner.

Additionally, there's a race condition: both `onAuthStateChange` and `getSession` run concurrently and both call `fetchProfile`, which can cause conflicts.

## Plan

### 1. Fix AuthContext error handling and race condition
In `src/contexts/AuthContext.tsx`:
- Wrap `fetchProfile` in a try/catch so errors don't prevent `setLoading(false)`
- Add a timeout (5 seconds) to `fetchProfile` so it doesn't hang forever
- If fetching fails, set `profile` to `null` and still set `loading = false` (user will see login page)
- Prevent double initialization by using a ref to track if initial load already completed

### 2. Fix vite.config.ts indentation (minor)
The `VitePWA` plugin has misaligned indentation from the previous edit, which could cause subtle issues. Will clean up.

### Technical Details

**AuthContext changes:**
```typescript
const fetchProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    setProfile(data);
    return data;
  } catch (e) {
    console.error("Failed to fetch profile:", e);
    setProfile(null);
    return null;
  }
};
```

The `useEffect` will also use an `initialLoadDone` ref to prevent the race condition between `onAuthStateChange` and `getSession`.

