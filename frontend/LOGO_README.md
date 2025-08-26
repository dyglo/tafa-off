# TOff Logo System

## Overview
The TOff app now uses a custom chat bubble icon as the official logo, replacing the generic text "T" throughout the application.

## Logo Files
- **`/public/icon.svg`** - The main SVG logo file used as favicon and throughout the app
- **`/src/components/ui/logo.tsx`** - Reusable Logo component

## Logo Component Usage

### Basic Usage
```tsx
import { Logo } from '@/components/ui/logo';

// Default (accent color)
<Logo />

// With custom size
<Logo size="lg" />

// With custom color variant
<Logo variant="white" />

// With custom classes
<Logo className="w-16 h-16" />
```

### Available Props
- **`size`**: `'sm'` | `'md'` | `'lg'` (default: `'md'`)
  - `sm`: 24x24px (`w-6 h-6`)
  - `md`: 32x32px (`w-8 h-8`) 
  - `lg`: 48x48px (`w-12 h-12`)

- **`variant`**: `'default'` | `'white'` | `'black'` (default: `'default'`)
  - `default`: Uses accent color (`#fcc419`)
  - `white`: Uses white color
  - `black`: Uses black color

- **`className`**: Additional CSS classes

### Examples
```tsx
// Settings header logo
<Logo size="sm" variant="black" />

// Profile picture placeholder
<Logo size="lg" variant="default" />

// Auth pages logo
<Logo size="lg" variant="black" />

// Main page loading logo
<Logo size="lg" variant="default" className="mx-auto mb-4" />
```

## Favicon
The logo is automatically used as the browser favicon through Next.js metadata configuration in `layout.tsx`.

## Design Notes
- The logo is a chat bubble with a lightning bolt inside
- Primary color: `#fcc419` (accent yellow)
- SVG format ensures crisp display at all sizes
- Responsive and accessible
