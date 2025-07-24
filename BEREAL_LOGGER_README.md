# BeReal Logger Feature

A comprehensive local storage and viewing system for BeReal posts with automatic saving capabilities.

## Features

### 1. Custom Save Directory
- **Directory Selection**: Users can choose a specific folder where BeReal images will be stored
- **Organized Storage**: Images are automatically organized by username in subdirectories
- **Persistent Settings**: Save directory preference is stored locally and persists between sessions

### 2. Selective Friend Logging
- **Friend Selection**: Users can select which friends' BeReals should be saved automatically
- **Visual Interface**: Checkboxes with profile pictures for easy selection
- **Batch Management**: Select/deselect multiple friends at once

### 3. Automatic Saving
- **Auto-Save Toggle**: Enable/disable automatic saving functionality
- **Smart Detection**: Only saves posts from selected friends when auto-save is enabled
- **Background Processing**: Automatic saving happens seamlessly without user intervention

### 4. Built-in Viewer
- **Organized Display**: Browse saved posts organized by date and person
- **Dual Camera View**: View both primary and secondary camera images
- **Search & Filter**: Search by username or caption content
- **Image Modal**: Full-screen image viewing with camera switching
- **Post Management**: Delete individual posts with confirmation

## Implementation Details

### Backend (Rust/Tauri)

#### Core Functions
- `get_bereal_logger_settings()` - Load user settings
- `save_bereal_logger_settings()` - Save user settings  
- `select_save_directory()` - File picker for directory selection
- `save_bereal_post()` - Download and save BeReal images locally
- `get_saved_posts()` - Retrieve all saved posts
- `delete_saved_post()` - Remove saved post and files
- `get_saved_posts_stats()` - Get statistics about saved posts

#### Data Structures
```rust
struct BeRealLoggerSettings {
    save_directory: String,
    selected_friends: Vec<String>, // user IDs
    auto_save_enabled: bool,
}

struct SavedBeRealPost {
    id: String,
    user_id: String,
    username: String,
    moment_id: String,
    primary_image_path: String,
    secondary_image_path: String,
    caption: Option<String>,
    taken_at: String,
    saved_at: String,
    location: Option<SavedLocation>,
}
```

#### File Organization
```
[Selected Directory]/
├── [Username1]/
│   ├── 20241201_143022_uuid_primary.jpg
│   ├── 20241201_143022_uuid_secondary.jpg
│   └── ...
├── [Username2]/
│   └── ...
└── App Data/
    ├── bereal_logger_config.json
    └── saved_posts_index.json
```

### Frontend (SolidJS/TypeScript)

#### Components
- `BeRealLoggerSettings` - Configuration interface
- `BeRealLoggerViewer` - Saved posts browser
- `SaveButton` - Manual save button for posts
- `BeRealLoggerView` - Main tabbed interface

#### Store Management
- Reactive store using SolidJS createStore
- Async operations with error handling
- Optimistic updates for better UX
- Auto-loading of settings and posts

#### Integration Points
- Added to main routing (`/bereal-logger`)
- Integrated into settings menu
- Save buttons added to feed posts
- Auto-save hooks in post components

## Usage

### Initial Setup
1. Navigate to Settings → "Manage BeReal Logger"
2. Select a save directory using the "Browse" button
3. Choose friends whose posts you want to save automatically
4. Enable auto-save if desired
5. Save settings

### Manual Saving
- A "Save" button appears on each BeReal post in the feed
- Click to manually save any post to your configured directory
- Button shows loading state and success confirmation

### Automatic Saving
- When enabled, posts from selected friends are saved automatically
- Happens transparently when posts load in the feed
- No user interaction required

### Viewing Saved Posts
1. Go to BeReal Logger → "Saved Posts" tab
2. Browse posts organized by date and username
3. Use search bar to filter by username or caption
4. Click any image to view full-screen
5. Switch between primary/secondary camera views
6. Delete posts using the delete button

### File Management
- Images are saved as high-quality JPEG files
- Filenames include timestamp and unique ID
- Metadata stored in JSON index for fast browsing
- Manual file management possible in save directory

## Security & Privacy

### Local Storage Only
- All data stored locally on user's device
- No cloud storage or external services
- User has full control over saved files

### Permission-Based
- Requires user to explicitly select save directory
- User chooses which friends to save
- Manual opt-in for auto-save functionality

### Data Integrity
- Atomic save operations prevent corrupted files
- JSON index maintains consistency
- Graceful error handling for network issues

## Error Handling

### Robust Error Management
- Network failures during image download
- Disk space and permission issues
- Corrupted index file recovery
- Invalid file path handling

### User Feedback
- Toast notifications for success/error states
- Loading indicators during operations
- Clear error messages with suggested actions
- Graceful degradation when features unavailable

## Future Enhancements

### Potential Features
- Export functionality (ZIP archives)
- Bulk operations (select multiple posts)
- Advanced filtering (date ranges, location)
- Post statistics and analytics
- Cloud backup integration (optional)
- Sharing capabilities
- Custom naming schemes
- Duplicate detection

### Performance Optimizations
- Lazy loading for large collections
- Image thumbnails for faster browsing
- Background sync for auto-saves
- Incremental index updates
- Memory usage optimization

## Technical Requirements

### System Dependencies
- Tauri 2.x framework
- Rust 1.70+ with tokio, reqwest, serde
- SolidJS 1.9+ with TypeScript
- Modern web browser with File System API

### Permissions
- File system read/write access
- Network access for image downloads
- Local storage for settings and index

## Installation

The BeReal Logger feature is integrated into the main StayReal application. No separate installation required.

### Development Setup
1. Install dependencies: `pnpm install`
2. Build internal API: `cd internal-api && pnpm build`
3. Run development server: `pnpm dev:web`
4. For full Tauri build: `pnpm tauri build`

## Contributing

When contributing to the BeReal Logger feature:

1. Follow existing code patterns and structure
2. Add proper error handling for all operations
3. Include TypeScript types for new interfaces
4. Test both manual and automatic saving scenarios
5. Ensure proper cleanup of resources and files

## License

This feature is part of the StayReal project and follows the same GPL-3.0-or-later license.