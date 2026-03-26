# Implementation Plan: UI Regressions & Data Visibility Fix

This plan addresses the missing cigarette counter, the disappearing sidebar in the technical explorer, and missing city information.

## Proposed Changes

### Frontend (UI Fixes)

- **Cigarette Visualization Fix**: Correct the malformed `animation` string and keyframe percentages.
- **Location Data Flow**: Ensure city name is passed to the result state.
- **SVG Compatibility**: Use React fragment `<>` in `AnimatedNumber`.
- **Explorer Sidebar Stabilization**:
    - Add `md:shrink-0` to the sidebar to prevent it from being pushed out by long code lines.
    - Add `min-w-0` to the code area to properly contain the `pre` tag and its overflow.
    - Ensure `h-full` or consistent height for the container.
- **Wikipedia Text Replacement**:
    - Global search and replace of "Wikipedia" or "WikipediaService" with "Teleport" or "CityInfoService" in the "MAGIC" section description.

### Java Backend (Compilation Fixes)

#### [MODIFY] [LocationAqiController.java](file:///home/shivam/Downloads/meet-main/java-backend/src/main/java/com/aqicalculator/controller/LocationAqiController.java)
- Add missing import for `CalculationResponse`.

#### [MODIFY] [LocationAqiService.java](file:///home/shivam/Downloads/meet-main/java-backend/src/main/java/com/aqicalculator/service/LocationAqiService.java)
- Add missing `logger` variable declaration.

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
