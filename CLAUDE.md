# @plainfold/preferences

Settings and preferences UI package for the Plainfold ecosystem.

## Architecture

- React components using plain HTML + `--pf-*` CSS custom properties
- No dependency on `@plainfold/ui` (avoids making it required)
- Depends on `@plainfold/store` for persistence and `@plainfold/design-tokens` for theming

## Components

- `PfSettingsPage` - Layout container with optional title (max-width 640px)
- `PfSettingsSection` - Card-style section, optionally collapsible with icon
- `PfDangerZone` - Destructive actions with two-step confirmation
- `PfAppInfo` - App version/build/metadata display
- `PfThemeGallery` - Theme browser: bundled themes, user themes, JSON upload

## Development

```bash
npm install
npm test          # vitest run
npm run typecheck # tsc --noEmit
npm run lint      # eslint
npm run build     # vite build (lib mode, es + cjs)
```

## Testing

- Uses vitest + jsdom + @testing-library/react
- Mock `@plainfold/store` and `@plainfold/design-tokens` with `vi.mock()`
- DataTransfer polyfill provided in test-setup.ts for file upload tests
- Use `FileReader` (not `file.text()`) for jsdom compatibility

## CSS Variables

All styling uses `--pf-*` CSS custom properties from `@plainfold/design-tokens`:
- `--pf-font-ui`, `--pf-font-mono`
- `--pf-text-primary`, `--pf-text-secondary`, `--pf-text-muted`
- `--pf-bg-surface`, `--pf-bg-surface-alt`
- `--pf-border`, `--pf-radius-md`, `--pf-radius-sm`
- `--pf-accent`, `--pf-danger`, `--pf-danger-muted`
- `--pf-positive`, `--pf-positive-muted`, `--pf-warning`
