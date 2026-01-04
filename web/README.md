# GetGadget Web (frontend)

Development:

- Install dependencies: `cd web && npm install`
- Run dev server: `npm run dev`

Notes:
- The frontend connects to the production API at `https://api.getgadgets.toolbox-io.ru`.
- For local development, you can change the BASE URL in `src/api/client.ts` back to `http://localhost:8000`.
- The app will only mount inside the Telegram Web App (it checks for `window.Telegram.WebApp.initData`). If you open the page directly in a browser it will show a short message instructing to open in Telegram.


