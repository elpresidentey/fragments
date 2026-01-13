# Fragments Logo Implementation

## Overview
Added a "FRAGMENTS" logo to the top left side of the app header, replacing generic titles on main screens while preserving back button functionality on detail screens.

## Components Created

### FragmentsLogo Component (`components/fragments-logo.tsx`)
- **Features**:
  - Geometric logo symbol with three fragments
  - "FRAGMENTS" text with customizable sizing
  - Touchable with navigation to home screen
  - Theme-aware colors (adapts to light/dark mode)
  - Configurable size options: small, medium, large
  - Optional text display (can show symbol only)

- **Props**:
  - `size`: 'small' | 'medium' | 'large' (default: 'medium')
  - `onPress`: Custom press handler (default: navigate to home)
  - `showText`: boolean (default: true)

## Components Updated

### TwitterHeader Component (`components/twitter-header.tsx`)
- **New Props**:
  - `showLogo`: boolean (default: true) - Controls logo visibility
  
- **Logic**:
  - Shows logo when `showLogo=true` and `showBackButton=false`
  - Shows back button when `showBackButton=true` (hides logo)
  - Increased left section width to accommodate logo (60px → 120px)

### Screen Updates
- **Home Screen** (`app/(tabs)/index.tsx`): Shows logo instead of "Home" title
- **Profile Screen** (`components/profile-screen.tsx`): Shows logo instead of "Profile" title
- **Post Detail Screen** (`app/post/[id].tsx`): Shows back button (logo hidden)
- **Create Post Screen** (`app/(tabs)/create.tsx`): Shows back button (logo hidden)

## Design Details

### Logo Symbol
- 24x24px geometric shape with border
- Three internal fragments of different sizes
- Uses primary theme color
- Rounded corners for modern look

### Typography
- Font weights: 700 (small), 800 (medium), 900 (large)
- Letter spacing: 0.5px for better readability
- Responsive sizing: 16px, 20px, 24px

### Behavior
- Tappable logo navigates to home screen
- Smooth animations on press
- Maintains accessibility standards
- Respects theme colors (light/dark mode)

## Usage Examples

```tsx
// Basic usage (medium size with text)
<FragmentsLogo />

// Small size without text
<FragmentsLogo size="small" showText={false} />

// Custom press handler
<FragmentsLogo onPress={() => console.log('Logo pressed')} />

// In TwitterHeader
<TwitterHeader showLogo={true} />
<TwitterHeader showBackButton={true} /> // Hides logo
```

## Testing
- Created unit tests for logo component
- Verified TypeScript compatibility
- Tested on main app screens
- Confirmed theme adaptation

## Files Modified
- ✅ `components/fragments-logo.tsx` (new)
- ✅ `components/twitter-header.tsx` (updated)
- ✅ `app/(tabs)/index.tsx` (updated)
- ✅ `components/profile-screen.tsx` (updated)
- ✅ `__tests__/unit/fragments-logo.test.tsx` (new)

## Result
The app now displays a professional "FRAGMENTS" logo in the top left corner of main screens, providing better branding while maintaining intuitive navigation patterns with back buttons on detail screens.