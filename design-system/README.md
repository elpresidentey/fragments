# Design System Foundation

This design system provides a centralized theme engine with Twitter-inspired styling for the Fragments mobile app.

## Features

- **Theme Engine**: Centralized theme management with light/dark mode support
- **Typography System**: Consistent font hierarchy with 7 variants
- **Color Palette**: Twitter-inspired colors (#1DA1F2 primary) with proper contrast ratios
- **Spacing System**: 8px-based spacing scale for consistent layouts
- **Animation System**: Predefined timing constants and animation presets

## Usage

### Basic Theme Usage

```typescript
import { useTheme } from '@/design-system';

function MyComponent() {
  const { theme, mode, toggleMode } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.colors.background }}>
      <Text style={[theme.typography.h1, { color: theme.colors.text }]}>
        Hello World
      </Text>
    </View>
  );
}
```

### Using Individual Systems

```typescript
import { Colors, typography, spacing, animationTiming } from '@/design-system';

// Colors
const primaryColor = Colors.light.primary; // #1DA1F2

// Typography
const headerStyle = typography.h1; // { fontSize: 24, fontWeight: '700', lineHeight: 28.8 }

// Spacing
const padding = spacing.md; // 16

// Animation timing
const quickAnimation = animationTiming.quick; // 200ms
```

### Theme Engine Direct Usage

```typescript
import { themeEngine } from '@/design-system';

// Switch modes
themeEngine.setMode('dark');
themeEngine.toggleMode();

// Get current theme
const currentTheme = themeEngine.getTheme();
```

## Design Specifications

### Colors

#### Light Mode
- Primary: #1DA1F2 (Twitter Blue)
- Background: #FFFFFF
- Surface: #F7F9FA
- Text: #14171A
- Text Secondary: #657786

#### Dark Mode
- Primary: #1DA1F2 (Twitter Blue)
- Background: #15202B
- Surface: #192734
- Text: #FFFFFF
- Text Secondary: #8B98A5

### Typography Scale

- **h1**: 24px, bold (700), 28.8px line height
- **h2**: 20px, bold (700), 24px line height
- **h3**: 18px, semibold (600), 21.6px line height
- **body**: 16px, regular (400), 22.4px line height
- **bodyMedium**: 16px, medium (500), 22.4px line height
- **caption**: 14px, regular (400), 19.6px line height
- **small**: 12px, regular (400), 16.8px line height

### Spacing Scale

- **xs**: 4px
- **sm**: 8px
- **md**: 16px (base unit)
- **lg**: 24px
- **xl**: 32px
- **xxl**: 48px

### Animation Timing

- **quick**: 200ms (button presses, hover states)
- **medium**: 300ms (screen transitions, modals)
- **slow**: 500ms (complex animations, loading states)

## Testing

The design system includes comprehensive property-based tests that verify:

- Color consistency across theme modes
- Typography hierarchy compliance
- Spacing system integrity
- Animation timing accuracy

Run tests with:
```bash
npm test -- __tests__/properties/theme-properties.test.ts
```

## Migration from Legacy Theme

The design system maintains backward compatibility with the existing `constants/theme.ts` file. Legacy components will automatically use the new Twitter-inspired colors while maintaining their existing API.