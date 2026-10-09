# Halo UI for Home Assistant

Halo UI started as a way to make my own Home Assistant dashboard feel a little more personal. I wanted a sidebar, a cleaner layout, nicer backgrounds and a consistent look — without having to rebuild the cards and automations that already worked.

It grew into a configurable visual layer for Lovelace dashboards. You can use just the parts you like, keep the original Home Assistant layout where you prefer, and make changes through a visual editor instead of editing a huge YAML file.

**Halo UI doesn't replace your cards or entities.** It works around them.

[![HACS Validation](https://img.shields.io/github/actions/workflow/status/F250SC/halo-ui/validate.yml?branch=main&label=HACS%20validation)](https://github.com/F250SC/halo-ui/actions/workflows/validate.yml)
[![Latest Release](https://img.shields.io/github/v/release/F250SC/halo-ui)](https://github.com/F250SC/halo-ui/releases/latest)
[![License](https://img.shields.io/github/license/F250SC/halo-ui)](LICENSE)

## What can it do?

You don't have to turn everything on. Halo UI is split into modules that can be configured separately:

- **Sidebar:** Add a clock, date, weather, navigation and people/presence tiles. Choose different layouts and styles.
- **Header:** Show a title, greeting, navigation, clock or weather information, with compact options for smaller screens.
- **Backgrounds:** Use gradients, images, videos or weather-dependent videos.
- **Glass styling:** Give regular HA cards a shared look with adjustable opacity, blur, borders, shadows and colors.
- **Active-state colors:** Give lights, switches, media players, climate devices, vacuums and warnings their own colors.
- **Dashboard alignment:** Align native dashboard content left, center or right, with separate settings for desktop, tablet and phone.
- **Presets and gradient editor:** Start with a ready-made look or create your own linear, radial or conic gradient with multiple color stops.
- **Configuration tools:** Export/import settings, reset modules and check basic diagnostics.

Halo UI tries to leave complex custom cards alone internally. Some custom cards may still need a little adjustment depending on the Home Assistant version, theme and card.

## A few screenshots

### Glass dashboard

![Dashboard with transparent glass surfaces](images/screenshots/dashboard-forest.png)

### Animated gradient

![Dashboard with a gradient background](images/screenshots/dashboard-purple.png)

### Visual configuration

![Halo UI presets](images/screenshots/config-presets.png)

![Halo UI gradient designer](images/screenshots/config-gradient-designer.png)

### Sidebar on mobile

![Halo UI mobile sidebar](images/screenshots/mobile-sidebar.png)

## Installation

Halo UI can be installed through **HACS** as a custom Dashboard repository.

1. Open HACS in Home Assistant.
2. Go to **Custom repositories**.
3. Add `https://github.com/F250SC/halo-ui` and select **Dashboard**.
4. Install **Halo UI**.
5. Reload Home Assistant (a hard refresh may be needed).

The main frontend resource is:

```text
/hacsfiles/halo-ui/halo-ui.js
```

If you've previously installed Halo UI manually using `/local/halo-ui/halo-ui.js`, remove that *old resource entry* after switching to HACS. Loading both resources can cause problems. Your own weather videos in `/local/halo-ui/halo_weather/` do not need to be deleted.

## Getting started

Edit your dashboard, add the **Halo UI** card and save. While the dashboard is in edit mode, open the Halo gear button to configure it.

You can apply Halo UI to the current view or use one shared configuration for the whole dashboard, with individual view overrides where needed.

For a YAML dashboard, a minimal example is:

```yaml
footer:
  card:
    type: custom:halo-ui
    enabled: true
    target:
      mode: current_view
```

You can switch `current_view` to `dashboard` if you want the settings to apply across your dashboard.

## Layout on desktop, tablet and phone

Home Assistant remains responsible for its underlying grid and responsive card wrapping. Halo UI adds separate controls for sidebar and header behavior, card spacing and native dashboard content alignment.

Under **Responsive & System → Home Assistant Dashboard-Ausrichtung**, choose **HA default**, **left**, **center** or **right** for desktop, tablet and mobile. You can also set a maximum content width. The default is to leave HA's layout alone.

For example:

```yaml
footer:
  card:
    type: custom:halo-ui
    enabled: true
    target:
      mode: dashboard
    layout:
      dashboard_alignment: center
      dashboard_tablet_alignment: center
      dashboard_mobile_alignment: native
      dashboard_max_width: 1400
```

Halo UI applies the visual alignment during normal dashboard use and leaves Home Assistant's native editing layout in place while you're moving cards around.

## Weather videos

One of my favorite options is changing the background depending on the current weather. You can use different clips for sun, clear nights, clouds, rain, heavy rain, lightning, snow, fog and wind.

**Videos are not included in the repository.** You provide your own files, which keeps the download smaller and avoids distributing third-party footage.

Place them somewhere under Home Assistant's `www` directory (available in the browser as `/local/`) and assign them to conditions in the Halo editor. For example:

```yaml
weather_videos:
  sunny: /local/halo-ui/halo_weather/sunny.mp4
  cloudy: /local/halo-ui/halo_weather/cloudy.mp4
  rainy: /local/halo-ui/halo_weather/rainy.mp4
```

Videos use a centered focal point when filling the available space, including narrow mobile screens and the sidebar. For best results, try short, quiet MP4 clips that loop smoothly. Make sure you have permission to use any footage you download.

If a video isn't available, behavior depends on your chosen background mode and fallback settings.

## Languages

The configurator follows the Home Assistant language for German and English. Other languages currently fall back to English.

## Updating and backups

HACS handles updates. After updating, reload the browser; if an older version still appears, try a hard refresh.

Before making larger changes, it's worth exporting your Halo configuration through the editor. You can also reset individual modules or remove Halo UI without intentionally deleting your usual Lovelace cards.

## Troubleshooting

**I can't find the Halo UI card.** Check that the HACS installation completed and the `/hacsfiles/halo-ui/halo-ui.js` resource is available. Then reload the browser.

**The gear button disappeared.** The configuration button is intended to appear in Home Assistant's dashboard edit mode, not during normal use.

**My weather isn't showing.** Choose a suitable `weather.*` entity in the settings, or try the automatic detection.

**A custom card looks strange.** Try the compatibility options and outer-frame-only styling for complex cards, so Halo does not interfere with the card's internal controls.

**The old interface still appears after updating.** Check that the old manual resource isn't loaded alongside the HACS resource, then hard-refresh your browser.

Halo UI is still evolving, and Home Assistant's frontend changes over time. If something breaks, a report with your HA version, Halo UI version, view type and a screenshot is genuinely helpful.

## Releases and feedback

For the newest version and changes, see [GitHub Releases](https://github.com/F250SC/halo-ui/releases/latest).

Found a bug or have an idea? [Open an issue](https://github.com/F250SC/halo-ui/issues). Screenshots and clear reproduction steps help a lot.

This project is developed and maintained independently. Feedback is welcome, but fixes and new features can take time.

## License

Halo UI is released under the [MIT License](LICENSE).

Copyright © 2026 Sebastian Möller.
