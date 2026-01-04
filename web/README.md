# GetGadget Web (frontend)

Development:

- Install dependencies: `cd web && npm install`
- Run dev server: `npm run dev`

Notes:
- The frontend expects the bot's integrated web API to be running on `http://localhost:8000`.
- The app will only mount inside the Telegram Web App (it checks for `window.Telegram.WebApp.initData`). If you open the page directly in a browser it will show a short message instructing to open in Telegram.


