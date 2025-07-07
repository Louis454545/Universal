# Balance Download Feature

This feature allows users to download and track balance information from specific people in the StayReal application.

## Overview

The balance download feature consists of:

1. **Settings Configuration** - Configure which users' balances to download and set download folder
2. **Balance History Viewer** - View all previously downloaded balances
3. **Download Integration** - Download balance data from user profiles
4. **File Management** - Organized storage of balance files in JSON format

## Components Added

### Frontend (SolidJS)

#### New Routes
- `/settings/balance` - Main balance settings page
- `/settings/balance/history` - Balance download history viewer

#### New Components
- `src/stores/balance.ts` - Balance state management store
- `src/views/settings/balance.tsx` - Balance settings page
- `src/views/settings/balance-history.tsx` - Balance history viewer
- `src/components/balance-download-button.tsx` - Reusable download button component

#### Updated Components
- `src/views/settings.tsx` - Added balance downloads entry
- `src/index.tsx` - Added new routes

### Backend (Rust/Tauri)

#### New Tauri Commands
- `get_balance_settings()` - Load balance settings
- `save_balance_settings(settings)` - Save balance settings
- `download_user_balance(user_id, username, fullname, balance_data)` - Download balance
- `get_balance_history()` - Get download history

#### Dependencies Added
- `serde` - JSON serialization
- `chrono` - Date/time handling
- `dirs` - System directory access
- `tokio` - Async runtime
- `reqwest` - HTTP client (for future API integration)

## Usage

### 1. Configure Balance Downloads

1. Go to **Settings** > **Balance Downloads**
2. Select the **Download Folder** where balance files will be saved
3. Enable users whose balances you want to download by toggling the checkboxes
4. Files will be saved in the format: `username_YYYYMMDD_HHMMSS_balance.json`

### 2. Download Balances

When viewing a user's profile, if they're enabled for balance downloads and have balance data available, a "Download Balance" button will appear. Clicking it will:

1. Verify the user is enabled for downloads
2. Create a timestamped JSON file with their balance data
3. Save it to the configured download folder
4. Add an entry to the download history

### 3. View Download History

1. Go to **Settings** > **Balance Downloads** > **View Download History**
2. See all previously downloaded balances with:
   - User information (name, username, profile picture)
   - Download timestamp
   - File actions (open file, re-download)

## File Format

Balance files are saved as JSON with the following structure:

```json
{
  "id": "user123_20240315_143022",
  "user_id": "user123",
  "username": "john_doe",
  "fullname": "John Doe",
  "balance_data": "{\"balance\": 1000, \"currency\": \"USD\"}",
  "downloaded_at": "2024-03-15T14:30:22Z",
  "file_path": "/path/to/StayReal Balances/john_doe_20240315_143022_balance.json"
}
```

## Storage Locations

### Configuration Files
- **Settings**: `~/.config/stayreal/balance_settings.json`
- **History**: `~/.config/stayreal/balance_history.json`

### Download Files
- **Default Location**: `~/Downloads/StayReal Balances/`
- **Customizable**: Users can select any folder through the settings

## Integration Points

### Adding to User Profiles

To add the download button to a user profile page:

```tsx
import BalanceDownloadButton from "~/components/balance-download-button";

// In your user profile component
<BalanceDownloadButton
  userId={user.id}
  username={user.username}
  fullname={user.fullname}
  balanceData={user.balanceData} // JSON string of balance data
/>
```

### Automatic Downloads

The feature is designed to integrate with existing user profile data. When balance data is available (from your API), the download button will automatically appear for enabled users.

## UI Design

The feature follows the existing StayReal design patterns:

- **Consistent styling** with other settings pages
- **Dark theme** with proper contrast ratios
- **Mobile-friendly** responsive design
- **Accessibility** with proper ARIA labels and keyboard navigation
- **Toast notifications** for user feedback
- **Loading states** during downloads

## Future Enhancements

1. **Automatic Downloads** - Background downloading when balance data updates
2. **Export Options** - CSV, Excel export from history
3. **Sync Integration** - Cloud backup of downloaded balances
4. **Advanced Filtering** - Filter history by date, user, or amount
5. **Notifications** - Alerts when new balance data is available
6. **Bulk Operations** - Download multiple users' balances at once

## Development Notes

- The feature uses SolidJS reactive primitives for state management
- File operations are handled securely through Tauri's filesystem APIs
- All user data is stored locally with configurable locations
- The feature gracefully handles missing data and API failures
- TypeScript is used throughout for type safety

## Testing

To test the feature:

1. Build the app: `pnpm build:web`
2. Run in development: `pnpm tauri dev`
3. Navigate to Settings > Balance Downloads
4. Configure settings and test downloads

The feature includes comprehensive error handling and user feedback for all operations.