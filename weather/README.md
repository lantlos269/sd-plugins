# Weather

Show the weather for a saved location — from the web UI, or browsed directly
on the reader itself under Settings → System → Plugins.

## Set up (once, from a browser)

1. Open the device web page → **Settings** → the Weather card.
2. Enter a **city** name (e.g. `Berlin`) and pick your preferred units.
3. Tap **Search & Save** — the plugin looks up the city, saves its
   coordinates to `/.crosspoint/weather.json`, and shows current conditions.

## Use from the web page

- Reopening the Weather card automatically loads the saved location and
  refreshes conditions.
- Tap **Refresh** any time to re-fetch. Changing **Units** re-fetches and
  re-saves automatically.
- Current conditions only (temperature, feels-like, humidity, wind, a short
  description) — no forecast, and this view supports both Celsius and
  Fahrenheit.

## Use on the device

1. On the reader, go to **Settings → System → Plugins → Weather → Open**.
2. Browse today's hourly forecast (powered by [wttr.in](https://wttr.in), no
   account needed) — each row shows a short description and the temperature
   for that hour.
3. Press Confirm on a row to save a snapshot of the full forecast as JSON to
   `/Weather/` on the SD card.

This on-device view always shows Celsius (the on-device catalog format can't
compute a Fahrenheit conversion); switch units only affects the web card.

## Clear

Tap **Clear** on the web card, or delete `/.crosspoint/weather.json`.

## Notes

- The on-device hourly list needs the location set up once from the web page
  first (same `/.crosspoint/weather.json` both views read).
- Two independent weather sources are used: Open-Meteo powers the web card's
  live current conditions (free, no key), and wttr.in powers the on-device
  hourly list (also free, no key) because it returns forecast entries as a
  JSON array with ready-made descriptions — the format the reader's generic
  on-device catalog screen can browse without any custom code.
