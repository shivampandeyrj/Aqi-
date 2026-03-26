# Implementation Plan - Backend Fix & Search Suggestions

Addressing the compilation errors in the Java backend and adding a new autocomplete feature for location search to improve usability.

## Proposed Changes

### Java Backend

#### [MODIFY] [LocationAqiController.java](file:///home/shivam/Downloads/meet-main/java-backend/src/main/java/com/aqicalculator/controller/LocationAqiController.java)
- **Fix Syntax**: Add missing closing brace for `getAqiByLocation` method.
- **New Endpoint**: Add `GET /api/aqi/suggestions?query={q}` to provide city name suggestions.

#### [MODIFY] [LocationAqiService.java](file:///home/shivam/Downloads/meet-main/java-backend/src/main/java/com/aqicalculator/service/LocationAqiService.java)
- **New Method**: `getSuggestions(query)` to fetch city suggestions from an external API (Teleport or WAQI).

### Frontend (Next.js)

#### [MODIFY] [app/page.tsx](file:///home/shivam/Downloads/meet-main/app/page.tsx)
- **Autocomplete UI**: Add a dropdown list of suggestions as the user types in the search bar.
- **Debounced Search**: Implement debouncing for the suggestion API calls to prevent overwhelming the server.

## Verification Plan

### Automated Tests
- Run `mvn clean compile` to ensure the project builds successfully.

### Manual Verification
- Type in the search bar and verify that city suggestions appear.
- Select a suggestion and verify that it triggers the AQI fetch for that location.
- Verify that the "Precision Fetch" still works correctly.
