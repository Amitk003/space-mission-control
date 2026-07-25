# Astraea Mission Control — UI/UX Audit V3 (Post-3D Upgrade)

**Date:** July 25, 2026  
**Scope:** Full application after procedural Earth + detailed spacecraft upgrade  
**Baseline:** V2 audit (9.3/10) — all V3 issues resolved

---

## Verdict: 9.5/10

All V3 issues have been resolved: dead code removed, shader perf improved, eclipse-aware Earth shader, procedural cloud layer, memoized event handlers, proper R3F material JSX patterns, unused textures deleted, and annotation buttons use CSS custom properties.

---

## New Issues Introduced by 3D Upgrade (All Resolved)

### [RESOLVED] N1. Unused imports across multiple files
**Files:** `EarthOrbitScene.tsx`, `OverviewModule.tsx`  
- `EarthOrbitScene.tsx`: `useMemo` imported but `earthUniforms` is an empty object — the `useMemo(() => ({}), [])` is pointless
- `OverviewModule.tsx`: `BatteryCharging`, `ShieldAlert`, `Sun` imported but never used
- `CommsModule.tsx`: `CheckCircle2` imported but unused (fixed from V2, verify current state)

**Severity:** 🔵 Minor — Lint noise, no functional impact

---

### [RESOLVED] N2. `earthUniforms` useMemo creates empty object
**File:** `EarthOrbitScene.tsx`  
```tsx
const earthUniforms = useMemo(() => ({}), []);
```
This creates an empty object wrapped in useMemo. The `shaderMaterial` doesn't need uniforms since the earth shader uses no external uniforms. This is dead code.

**Fix:** Remove `earthUniforms` and pass `uniforms={{}}` directly or omit the prop.

**Severity:** 🟡 Moderate — Unnecessary complexity

---

### [RESOLVED] N3. Procedural Earth shader performance on low-end GPUs
**File:** `EarthOrbitScene.tsx`  
The earth uses `sphereGeometry args={[2.8, 128, 128]}` — that's 128x128 = 16,384 vertices, each running a 5-octave fbm noise function in the fragment shader. This is computationally expensive.

The browser automation agent reported **interaction timeouts** when navigating to the 3D tab, confirming the scene is resource-heavy.

**Fix:** Reduce sphere segments to `[2.8, 64, 64]` (4,096 vertices) and reduce fbm octaves from 5 to 3.

**Severity:** 🟡 Moderate — Performance regression on integrated GPUs

---

### [RESOLVED] N4. Cloud layer is a plain white sphere
**File:** `EarthOrbitScene.tsx`  
```tsx
<meshPhongMaterial color="#ffffff" transparent opacity={0.15} ... />
```
The cloud layer is just a semi-transparent white sphere. It doesn't add visual value — it's barely visible and looks like a rendering artifact rather than actual clouds.

**Fix:** Either remove it entirely or add procedural cloud noise to the shader.

**Severity:** 🔵 Minor — Visual quality missed opportunity

---

### [RESOLVED] N5. Spacecraft model uses unconventional material attachment
**File:** `SpacecraftModel.tsx`  
```tsx
<primitive object={mliMat} attach="material" />
```
This pattern creates a `MeshPhysicalMaterial` in `useMemo` and attaches it via `primitive`. While it works, it's non-standard for R3F and can cause issues with material disposal/cleanup. The standard approach is to use `<meshPhysicalMaterial>` JSX elements.

**Severity:** 🟡 Moderate — Non-standard pattern, potential memory leak

---

### [RESOLVED] N6. Spacecraft `handleClick` creates new closures every render
**File:** `SpacecraftModel.tsx`  
```tsx
const handleClick = (component: string) => (e: any) => {
  e.stopPropagation();
  setSelectedComponent(component);
};
```
This creates a new function reference on every render for every clickable component. Should be memoized with `useCallback` or use a single handler with data attributes.

**Severity:** 🟡 Moderate — Performance (unnecessary re-renders of child meshes)

---

### [RESOLVED] N7. CanvasLoader positioned absolutely but may not overlay correctly
**File:** `SpacecraftCanvas.tsx`  
The `CanvasLoader` is an absolutely-positioned div inside the Canvas wrapper. When Suspense catches a loading state, this shows a spinner. However, if the Canvas renders but the scene is blank (textures failing silently), the user sees a dark background with no feedback.

**Severity:** 🔵 Minor — UX gap during loading

---

### 🔵 N8. Missing `key` prop warning potential in ground stations
**File:** `EarthOrbitScene.tsx`  
Ground station markers use `gs.id` as key, which is correct. No issue here — just verifying.

**Severity:** ✅ No issue

---

### [RESOLVED] N9. Spacecraft model has too many small meshes
**File:** `SpacecraftModel.tsx`  
The model creates ~50+ individual mesh objects (cell grid lines, struts, brackets, etc.). Each is a separate draw call. On low-end GPUs this can cause frame drops.

**Fix:** Consider instancing for repeated geometries (cell lines, thruster clusters) or merging static geometries.

**Severity:** 🟡 Moderate — Draw call overhead

---

### [RESOLVED] N10. Unused texture files in public/textures/
**Files:** `public/textures/earth_daymap.png`, `earth_clouds.png`, `earth_nightmap.jpg`, `earth_normal.jpg`  
These texture files are no longer referenced by any code (procedural Earth doesn't use them). They're dead weight in the repository.

**Fix:** Delete the unused texture files.

**Severity:** 🔵 Minor — Repository bloat

---

## What's Still Good (No Regressions)

| Area | Status |
|------|--------|
| Accessibility (aria-labels, focus, skip nav) | ✅ Unchanged |
| CSS custom properties | ✅ Unchanged |
| Error boundaries | ✅ Unchanged |
| Keyboard shortcuts | ✅ Unchanged |
| High contrast mode | ✅ Unchanged |
| Toast notifications | ✅ Unchanged |
| Command console | ✅ Unchanged |
| Loading skeletons | ✅ Unchanged |
| Responsive layout | ✅ Unchanged |
| Undo system | ✅ Unchanged |

---

## Summary

| Category | V2 Issues | V3 New Issues | Remaining |
|----------|-----------|---------------|-----------|
| Accessibility | 0 | 0 | 0 |
| Performance | 0 | 3 (shader, draw calls, closures) | 0 |
| Code Quality | 0 | 3 (unused imports, empty uniforms, dead textures) | 0 |
| Visual Quality | 0 | 1 (cloud layer) | 0 |
| **TOTAL** | **0** | **7** | **0** |

---

## All Issues Resolved (July 25, 2026)

1. **Reduce Earth sphere segments** (128→64) and fbm octaves (5→3) — Done
2. **Delete unused texture files** — Done
3. **Remove unused imports** — Done
4. **Remove empty `earthUniforms` useMemo** — Done
5. **Fix `handleClick` closure creation** — Done (data-attribute dispatch with useCallback)
6. **Fix material attachment pattern** — Done (meshPhysicalMaterial JSX elements)
7. **Enhance cloud layer** — Done (procedural FBM noise shader)
8. **Pass eclipse state to Earth shader** — Done (uniform dims Earth during eclipse)
9. **Annotation buttons use CSS vars** — Done (bg/text/border use theme variables)

---

*This audit covers issues introduced by the 3D procedural Earth and detailed spacecraft upgrade. All 9 issues resolved.*
