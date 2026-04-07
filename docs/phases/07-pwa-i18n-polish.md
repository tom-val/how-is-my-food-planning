# Phase 7: PWA, i18n & Polish

## Goal

Make the app installable as a PWA on mobile devices, support Lithuanian and English languages, and polish the responsive layout.

## Tasks

### PWA
- [ ] Configure `vite-plugin-pwa` in `vite.config.ts`
  - `registerType: 'autoUpdate'`
  - `manifest`: name, short_name, icons, theme_color, background_color, display: standalone
  - `workbox.runtimeCaching`: NetworkFirst for API calls, CacheFirst for static assets
- [ ] Create PWA icons (192x192 and 512x512 PNG)
- [ ] Test "Add to Home Screen" on Android and iOS
- [ ] Verify offline behaviour (cached pages load, API calls show appropriate error)

### i18n
- [ ] Configure i18next with `react-i18next`
- [ ] Create translation files:
  - `src/i18n/lt.json` — Lithuanian (default)
  - `src/i18n/en.json` — English
- [ ] Translate all UI text:
  - Auth pages (login, register, forgot password)
  - Family management (create, join, members)
  - Recipes (list, create, edit, detail)
  - Planner (grid, meal types, days of week)
  - Shopping list (items, checkboxes)
  - Navigation (menu items, buttons)
  - Errors and validation messages
- [ ] Language switcher component in app bar
- [ ] Persist selected language to localStorage
- [ ] Default language: Lithuanian

### Responsive Layout
- [ ] Mobile: `BottomNavigation` for main sections (Planner, Recipes, Shopping, Family)
- [ ] Desktop: Sidebar navigation
- [ ] Switch between layouts using MUI `useMediaQuery`
- [ ] Planner: vertical day cards on mobile, grid on desktop
- [ ] Recipe form: full-width on mobile
- [ ] Shopping list: full-width checkbox list on mobile

### Polish
- [ ] Loading states (skeletons or spinners)
- [ ] Error boundaries and user-friendly error messages
- [ ] Empty states (no recipes, no plan, no family)
- [ ] Toast notifications for actions (recipe saved, meal added, etc.)
- [ ] Consistent spacing and typography
- [ ] App bar with family name, language switcher, sign out

## Verification

- Install as PWA on mobile → app icon on home screen → opens in standalone mode
- Switch language to English → all UI text changes
- Switch back to Lithuanian → persisted after refresh
- Desktop: sidebar navigation visible
- Mobile: bottom navigation visible
- All pages render correctly on mobile viewport (375px width)
