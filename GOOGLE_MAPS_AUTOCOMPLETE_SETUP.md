# Google Maps Places Autocomplete Setup

## Implementation Summary

I've successfully implemented Google Maps Places Autocomplete for the Birth Place field. The autocomplete dropdown appears after typing 3 characters and displays location suggestions in "City, State, Country" format.

## Changes Made

### Backend (C# / ASP.NET Core)

1. **Configuration (AstroAiSettings.cs)**
   - Added `GoogleMapsApiKey` property to store the API key

2. **Configuration (appsettings.json)**
   - Added `"GoogleMapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY_HERE"` to the AstroAI section
   - **IMPORTANT**: You need to replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual Google Maps API key

3. **API Controller (GeoController.cs)**
   - Added new `/api/geo/autocomplete?input=xxx` GET endpoint
   - Calls Google Maps Places Autocomplete API
   - Filters for city-level results using `types=(cities)`
   - Returns array of `PlaceSuggestion` objects with `description` and `placeId`

### Frontend (Angular)

1. **Service (horoscope.service.ts)**
   - Added `PlaceSuggestion` interface
   - Added `getPlaceSuggestions(input: string)` method to call the API

2. **Component (birth-chart.component.ts)**
   - Added RxJS imports: `Subject`, `debounceTime`, `distinctUntilChanged`, `switchMap`, `filter`, `takeUntil`
   - Added autocomplete state properties: `placeSuggestions`, `showSuggestions`, `destroy$`
   - Set up subscription to `birthPlace` form control changes with:
     - 300ms debounce to reduce API calls
     - Only triggers after 3+ characters
     - Automatically updates suggestions list
   - Added `onPlaceSuggestionSelected()` method to populate the field
   - Added `hideSuggestions()` method with 200ms delay for blur handling

3. **Template (birth-chart.component.html)**
   - Wrapped birth place input in `position-relative` container
   - Added autocomplete dropdown with `*ngIf` for conditional display
   - Added `*ngFor` to render suggestions
   - Added click handler for selection
   - Added blur handler to hide dropdown
   - Added `autocomplete="off"` to prevent browser autocomplete

4. **Styles (birth-chart.component.scss)**
   - Added `.place-autocomplete-dropdown` with absolute positioning
   - Added `.place-suggestion-item` with hover effects
   - Styled scrollbar for long suggestion lists

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Places API** (New)
4. Create credentials → API key
5. Restrict the API key:
   - Application restrictions: HTTP referrers (websites)
   - Add your domain (e.g., `https://yourdomain.com/*`)
   - API restrictions: Select "Places API (New)"

### 2. Update Configuration

Replace the placeholder in `server/AstroAI.Api/appsettings.json`:

```json
"AstroAI": {
  "GoogleMapsApiKey": "YOUR_ACTUAL_API_KEY_HERE"
}
```

### 3. Test Locally

1. Start the backend:
   ```bash
   cd server/AstroAI.Api
   dotnet run
   ```

2. Start the frontend:
   ```bash
   cd astroai-ui
   ng serve
   ```

3. Navigate to the birth chart form
4. Type at least 3 characters in the Birth Place field
5. Verify that location suggestions appear

### 4. Deploy to Azure

Update the application settings in your Azure Web App:

1. Go to Azure Portal → Your Web App → Configuration
2. Add or update: `AstroAI__GoogleMapsApiKey` = `your_actual_key`
3. Save and restart the app

## Features

✅ **3-Character Trigger**: Autocomplete only activates after typing 3 characters
✅ **Debounced Input**: 300ms delay prevents excessive API calls
✅ **City-Level Results**: Filters to show only cities (not addresses)
✅ **Click Selection**: Click any suggestion to populate the field
✅ **Keyboard Friendly**: Field remains editable for manual entry
✅ **Non-Breaking**: All existing features (chart generation, payments) remain intact
✅ **Error Handling**: Gracefully handles API failures

## API Costs

Google Maps Places Autocomplete API charges per request:
- First 1,000 requests/month: Free (as of 2024)
- Additional requests: ~$2.83 per 1,000 requests

The 300ms debounce and 3-character minimum help reduce unnecessary API calls.

## Troubleshooting

**No suggestions appear:**
1. Check browser console for errors
2. Verify API key is set correctly in appsettings.json
3. Ensure Places API is enabled in Google Cloud Console
4. Check API key restrictions

**API errors:**
- Check if API key is valid
- Verify Places API is enabled
- Check for billing issues in Google Cloud Console

**Dropdown doesn't hide:**
- Check that blur handler is working (200ms delay is intentional)
- Verify z-index in CSS isn't conflicting with other elements
