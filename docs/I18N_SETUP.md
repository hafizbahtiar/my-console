# Multi-Language Setup Guide

## Overview

This application uses a custom React Context-based internationalization (i18n) implementation instead of third-party libraries like `react-i18next` or `next-i18next`. This approach provides better control, smaller bundle size, and direct integration with React patterns.

## Current Implementation

The application already includes a complete i18n setup with:

- ✅ Custom React Context implementation
- ✅ English and Malay (Bahasa Melayu) support
- ✅ Browser language detection
- ✅ localStorage persistence
- ✅ Translation files and components

## No Additional Installation Required

The i18n system is already implemented and doesn't require additional packages. The custom implementation includes:

- **Language Context** (`lib/language-context.tsx`)
- **Translation Files** (`public/locales/en/common.json`, `public/locales/ms/common.json`)
- **Integration** in root layout with `LanguageProvider`

## Translation Files Structure

```
public/
  locales/
    en/           # English
      common.json
    ms/           # Malay (Bahasa Melayu)
      common.json
```

## Translation Keys

### Navigation
- `nav.dashboard` - Dashboard
- `nav.profile` - Profile/Settings
- `nav.users` - Users (Admin)
- `nav.security` - Security
- etc.

### Authentication
- `auth.welcome_back` - Welcome back
- `auth.sign_in` - Sign in
- `auth.sign_up` - Sign up
- `auth.email` - Email
- `auth.password` - Password
- etc.

### Dashboard
- `dashboard.title` - Dashboard
- `dashboard.welcome_back` - Welcome back message
- `dashboard.overview` - Overview tab
- `dashboard.activity` - Activity tab
- `dashboard.analytics` - Analytics tab

### Settings
- `settings.title` - Settings
- `settings.appearance` - Appearance
- `settings.notifications` - Notifications
- `settings.security` - Security
- `settings.language` - Language
- `settings.english` - English
- `settings.malay` - Bahasa Melayu

## Usage in Components

### Basic Translation
```tsx
import { useTranslation } from '@/lib/language-context'

function MyComponent() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <p>{t('dashboard.welcome_back', { name: user.name })}</p>
    </div>
  )
}
```

### Language Switching
```tsx
import { useTranslation } from '@/lib/language-context'

function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation()

  return (
    <select
      value={language}
      onChange={(e) => setLanguage(e.target.value as 'en' | 'ms')}
    >
      <option value="en">English</option>
      <option value="ms">Bahasa Melayu</option>
    </select>
  )
}
```

### Translation Keys with Parameters
```tsx
// In translation file: "welcome_user": "Welcome back, {{name}}!"
const greeting = t('welcome_user', { name: user.name })

// In translation file: "items_count": "You have {{count}} items"
const message = t('items_count', { count: items.length })
```

## Features Implemented

### ✅ Completed
- [x] Custom React Context implementation (`lib/language-context.tsx`)
- [x] English and Malay translation files
- [x] Language switching in settings page
- [x] Dashboard and navigation translations
- [x] Automatic browser language detection
- [x] localStorage persistence
- [x] Parameter interpolation (`{{param}}` syntax)
- [x] Fallback to English for missing translations
- [x] Sidebar navigation with translations
- [x] Profile and settings page translations

### ✅ Implementation Details
- **Context Provider**: `LanguageProvider` wraps the entire app
- **Hook Usage**: `useTranslation()` for accessing translations
- **File Structure**: `public/locales/{lang}/common.json`
- **Language Types**: Strict TypeScript typing for 'en' | 'ms'
- **Performance**: Lightweight implementation with no external dependencies

## Language Codes

- **en**: English
- **ms**: Malay (Bahasa Melayu)

## Testing

1. Start development server: `bun run dev`
2. Navigate to Settings page (`/auth/settings`)
3. Change language using the language selector
4. Verify UI updates immediately to selected language
5. Refresh the page and confirm language preference persists
6. Test navigation and other pages for proper translations

## Adding New Languages

To add support for additional languages:

1. **Create Translation Files**:
   ```bash
   mkdir public/locales/{lang_code}
   cp public/locales/en/common.json public/locales/{lang_code}/common.json
   ```

2. **Update Language Context** (`lib/language-context.tsx`):
   ```typescript
   type Language = 'en' | 'ms' | '{lang_code}'
   const translations: Record<Language, Translations> = {
     en: enTranslations,
     ms: msTranslations,
     {lang_code}: {lang_code}Translations,
   }
   ```

3. **Update Settings Page**: Add new language option to the selector

4. **Import New Translations**:
   ```typescript
   import {lang_code}Translations from '../public/locales/{lang_code}/common.json'
   ```

## Why Custom Implementation?

### Advantages
- **Zero Dependencies**: No additional packages needed
- **Small Bundle Size**: Minimal impact on application size
- **Full Control**: Custom logic for specific requirements
- **Type Safety**: TypeScript integration with language types
- **Performance**: Direct imports, no async loading

### Trade-offs
- **Manual Setup**: More initial configuration required
- **Maintenance**: Custom code to maintain vs. library updates
- **Features**: Limited to implemented features (no advanced i18n features)

## Troubleshooting

### Translations not updating
- Check that component uses `useTranslation()` hook
- Verify translation keys exist in both language files
- Ensure component re-renders after language change

### Language not persisting
- Check browser localStorage for `language` key
- Verify `LanguageProvider` wraps the component tree
- Check for JavaScript errors in browser console

### Missing translations fallback
- English translations are automatically used as fallback
- Check console for "translation key not found" warnings
- Verify JSON syntax in translation files

## Performance Notes

- Translation files are imported at build time (not async)
- Language detection happens once on app initialization
- Context updates trigger re-renders only when language changes
- Bundle size impact: ~2KB for translation JSON files
