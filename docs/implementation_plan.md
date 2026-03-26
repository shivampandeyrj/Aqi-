# Implementation Plan: UI Regressions & Data Visibility Fix

This plan addresses the missing cigarette counter, the disappearing sidebar in the technical explorer, and missing city information.

## Proposed Changes

### Frontend (UI Fixes)

#### [MODIFY] [page.tsx](file:///home/shivam/Downloads/meet-main/app/page.tsx)
- **Cigarette Visualization Fix**:
    - Correct the malformed `animation` string by removing invalid spaces in `ease-out`.
    - Fix invalid keyframe percentages (e.g., `0 %` -> `0%`) in the `<style>` block.
- **Location Data Flow**:
    - Update `calculateCigarettes` to accept an optional `locationName` parameter.
    - Pass the location name from `detectLocation` into `calculateCigarettes` to ensure the city card renders.
- **SVG Compatibility**: Update `AnimatedNumber` component to return a React fragment `<>` instead of `<span>`.

### Java Backend (Data Consistency)

#### [MODIFY] [CalculationResponse.java](file:///home/shivam/Downloads/meet-main/java-backend/src/main/java/com/aqicalculator/model/CalculationResponse.java)
- Add a `location` field (String) to ensure the unified response can carry city names when enriched.


## Verification Plan

### Automated Verification
- `curl` backend to verify the city info endpoint with known and unknown cities.
- Check that `placeInfo` is never `null`.

### Manual Verification
- Verify the large cigarette counter is visible in the gauge.
- Click every file in the explorer to ensure the sidebar remains visible.
- Verify the city name appears even for small localities without Teleport urban areas.
