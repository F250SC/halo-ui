# Halo UI for Home Assistant

Halo UI is a modular visual UI layer for Home Assistant dashboards. It adds a configurable sidebar, animated backgrounds and gradients, glass surfaces, a dashboard header, responsive behavior, state-aware styling and a visual configurator while keeping normal Home Assistant cards usable.

![Halo UI dashboard](images/halo-ui-dashboard.png)

![Halo UI configurator](images/halo-ui-configurator.png)

## Features

- One public Home Assistant card: `custom:halo-ui`
- Sidebar with clock, date, weather, navigation and presence
- Weather-aware video/image backgrounds
- Multi-stop Gradient Designer with linear, radial and conic animation
- Glass surface system for Home Assistant cards
- Header with title, user greeting, weather, clock and navigation
- Active-state colors per domain such as lights, media, switches, climate and vacuum
- Responsive desktop, tablet and mobile layout controls
- Design presets, diagnostics and compatibility controls
- JSON export/import and module reset tools
- Automatic UI language: German when Home Assistant is German, English for English and all other languages

## Installation with HACS

### Custom repository

1. Open **HACS** in Home Assistant.
2. Open **Custom repositories**.
3. Add `https://github.com/F250SC/halo-ui` and select **Dashboard** as the category.
4. Install **Halo UI**.
5. Reload the browser after installation.

HACS installs the frontend files below `/hacsfiles/halo-ui/` and registers `halo-ui.js` as a dashboard resource.

> If you previously installed Halo UI manually, remove the old manual Lovelace resource `/local/halo-ui/halo-ui.js?...` before using the HACS resource. Do not delete your optional local weather-video folder if your configuration still references paths such as `/local/halo-ui/halo_weather/sunny.mp4`.

## Add Halo UI to a dashboard

Add **Halo UI** from the Home Assistant card picker, or use YAML:

```yaml
footer:
  card:
    type: custom:halo-ui
    enabled: true
    target:
      mode: current_view
```

Open the dashboard in edit mode and use the Halo gear button to configure the current view.

## Language

Halo UI follows the Home Assistant UI language. German (`de`) uses the German interface. English and every other language currently fall back to English. The translation layer is centralized so additional languages can be added later without changing the UI architecture.

## Updating

Once installed through HACS, updates are handled by HACS. After an update, reload the browser if Home Assistant still serves cached frontend code.

## Weather videos

Weather video files are optional and are intentionally not bundled with the HACS package. Existing local paths remain supported, for example:

```yaml
weather_videos:
  sunny: /local/halo-ui/halo_weather/sunny.mp4
  cloudy: /local/halo-ui/halo_weather/cloudy.mp4
  rainy: /local/halo-ui/halo_weather/rainy.mp4
```

## Version

Current package: **0.10.43**

## Status

Halo UI is under active development. Before major configuration changes, use the built-in export function to keep a backup of your Halo configuration.
