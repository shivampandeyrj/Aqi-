# Implementation Plan: UI Regressions & Data Visibility Fix

This plan addresses the missing cigarette counter, the disappearing sidebar in the technical explorer, and missing city information.

## Proposed Changes

### Frontend (UI Fixes)

#### [MODIFY] [page.tsx](file:///home/shivam/Downloads/meet-main/app/page.tsx)
- **SVG Compatibility**: Update `AnimatedNumber` component to return a React fragment `<>` instead of `<span>`. This ensures the text renders correctly inside the SVG `<text>` element.
- **Sidebar Visibility**:
    - Ensure the sidebar `div` has consistent width and visibility on desktop.
    - Change `w-full md:w-72` to a more stable layout if needed.
    - Fix potential layout shifts when a file is selected.
- **City Info Fallback**:
    - If `result.placeInfo` is null, still show the city name from `result.location` in a simplified badge at the top.
    - Update "Read more on Wikipedia" to "Teleport Urban Area Insights".
    - Update footer methodology text to mention "Teleport API".

### Java Backend (Data Reliability)

#### [MODIFY] [CityInfoService.java](file:///home/shivam/Downloads/meet-main/java-backend/src/main/java/com/aqicalculator/service/CityInfoService.java)
- **Robust Search**: Add a fallback to the search if the exact cityName fails.
- **Generic Fallback**: If no urban area is found, return a `PlaceInfo` object with a generic summary and the city name, rather than returning `null`.
- **Improved Logging**: Add detailed logs for each step of the Teleport fetch.

## Verification Plan

### Automated Verification
- `curl` backend to verify the city info endpoint with known and unknown cities.
- Check that `placeInfo` is never `null`.

### Manual Verification
- Verify the large cigarette counter is visible in the gauge.
- Click every file in the explorer to ensure the sidebar remains visible.
- Verify the city name appears even for small localities without Teleport urban areas.
