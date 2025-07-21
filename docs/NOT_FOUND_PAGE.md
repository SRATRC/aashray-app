# Not Found Page Implementation

This document explains the implementation of the not-found page that handles unmatched routes and deeplink failures in the Aashray app.

## Overview

The not-found page is designed to provide a user-friendly experience when:
- A deeplink doesn't match any known routes
- A user navigates to a non-existent page
- There's an error in route navigation

## Files Created/Modified

### 1. `app/+not-found.tsx`
- **Purpose**: Main not-found screen component
- **Features**: 
  - Clean, user-friendly interface
  - Navigation options (Go Home, Go Back)
  - Support contact information
  - Consistent styling with the app

### 2. `components/ErrorFallback.tsx`
- **Purpose**: Reusable error handling component
- **Features**:
  - Configurable title, message, and actions
  - Customizable icons and colors
  - Flexible button configurations
  - Can be used throughout the app for various error scenarios

### 3. `app/_layout.tsx` (Modified)
- **Changes**:
  - Enhanced deeplink handling logic
  - Added support for `/utsav/` routes
  - Unmatched routes now redirect to `+not-found`
  - Better error logging and handling
  - Added the not-found screen to Stack configuration

## How It Works

### Deeplink Processing Flow

1. **URL Reception**: App receives a deeplink (e.g., `aashray://some-invalid-route`)
2. **Path Extraction**: URL is processed to extract the path
3. **Route Matching**: System checks if path matches known patterns:
   - `/adhyayan/{id}` → Navigate to adhyayan details
   - `/event/{id}` → Navigate to event details  
   - `/utsav/{id}` → Navigate to utsav details
4. **Fallback**: If no match found → Redirect to `+not-found` page

### Error Scenarios Handled

- **Invalid deeplinks**: `aashray://invalid-route`
- **Malformed URLs**: `aashray://adhyayan/` (missing ID)
- **Navigation errors**: Any exception during route processing
- **Non-existent pages**: Direct navigation to undefined routes

## Usage Examples

### Basic Not-Found Page
```tsx
// Automatically handled by Expo Router for unmatched routes
// Users see the not-found page with standard messaging
```

### Custom Error Handling
```tsx
import ErrorFallback from '@/components/ErrorFallback';

// In any component where you need error handling
<ErrorFallback
  title="Custom Error Title"
  message="Custom error message"
  onRetry={() => refetch()}
  retryText="Try Again"
  icon="alert-circle-outline"
/>
```

## Configuration Options

### ErrorFallback Props
- `title`: Error title text
- `message`: Detailed error description
- `showBackButton`: Show/hide back navigation
- `showHomeButton`: Show/hide home navigation
- `onRetry`: Retry function callback
- `retryText`: Custom retry button text
- `customActions`: Additional action components
- `icon`: Ionicons icon name
- `iconColor`: Icon color

## Testing

### Manual Testing Scenarios

1. **Invalid Deeplink**: 
   - Test URL: `aashray://invalid-route`
   - Expected: Redirects to not-found page

2. **Malformed Deeplink**:
   - Test URL: `aashray://adhyayan/`
   - Expected: Redirects to not-found page

3. **Direct Navigation**:
   - Navigate to non-existent route in app
   - Expected: Shows not-found page

4. **Navigation Actions**:
   - Test "Go Home" button → Should navigate to home tab
   - Test "Go Back" button → Should go back or home if no history

## Future Enhancements

1. **Analytics**: Track not-found page visits for debugging
2. **Search**: Add search functionality to help users find content
3. **Suggestions**: Show related or popular content
4. **Offline Support**: Handle offline scenarios
5. **Deep Link Storage**: Store failed deeplinks for retry when user is authenticated

## Troubleshooting

### Common Issues

1. **Page not showing**: Ensure `+not-found` is registered in Stack configuration
2. **Styling issues**: Check Tailwind CSS classes are properly configured
3. **Navigation errors**: Verify router imports and usage

### Debug Logs

The implementation includes comprehensive logging:
- `🔗 Processing deep link:` - Deeplink received
- `❌ Unmatched deeplink route:` - Route not found
- `❌ Error navigating to path:` - Navigation error
- `⏳ User not fully authenticated:` - User state issues

## Best Practices

1. **Consistent UX**: Use ErrorFallback component for consistent error handling
2. **Clear Messaging**: Provide helpful, non-technical error messages
3. **Easy Recovery**: Always provide clear paths back to working parts of the app
4. **Logging**: Log errors for debugging while maintaining user privacy
5. **Graceful Degradation**: Handle edge cases without crashing the app
