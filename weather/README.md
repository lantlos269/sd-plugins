# Weather

Show the current weather for a saved location, right from the web UI.
Powered by [Open-Meteo](https://open-meteo.com) — free, no API key or account
needed, so no secrets ever live in this plugin folder.

## Set up

1. Open the device web page → **Settings** → the Weather card.
2. Enter a **city** name (e.g. `Berlin`) and pick your preferred units.
3. Tap **Search & Save** — the plugin looks up the city, saves its
   coordinates to `/.crosspoint/weather.json`, and shows current conditions.

## Use

- Reopening the Weather card automatically loads the saved location and
  refreshes the forecast.
- Tap **Refresh** any time to re-fetch conditions for the saved location.
- Changing **Units** re-fetches and re-saves automatically.

## Clear

Tap **Clear** on the web card, or delete `/.crosspoint/weather.json`.

## Notes

- Only the current conditions are shown (temperature, feels-like, humidity,
  wind, and a short description) — no forecast history.
- This plugin has no `device.json`, so it shows up under Settings → System →
  Plugins with this description as usage instructions, but has no **Open**
  action there. To see live weather, join the reader's network and open
  `crosspoint.local` in a browser (phone or computer) → **Settings** → the
  Weather card.
