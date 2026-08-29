# Batti v1

Approved architecture: Leaflet Map of 12 Dhaka Areas with Halo circles (glow On, dark Off, grey Stale), Crowd Report taps, 1.5s Forecast spinner, canned Advice, Seed labeled Sample pattern. Status = 30-minute majority. Live look = Dhaka clock + this month's Seed + Crowd on top. Map Predictor = Eta per Area from the month curve (`Off in ~2h` / `On in ~3h`). No Admin, no live DESCO, no trained model, no GeoJSON. Persistence = browser localStorage for Crowd Reports; Seed is shipped in code.
