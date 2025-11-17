# Telegram Gadget Card Bot

A Telegram bot that lets you collect gadget cards, manage coins, and build custom PCs from parts you collect. Includes a modern Telegram Mini App frontend.

## Features

- Collect gadget cards (phones, tablets, laptops, PC parts)
- Expanded rarity system (Trash, Common, Uncommon, Rare, Epic, Legendary, Mythic)
- Coin system - earn coins by selling cards (15% less than purchase price)
- Build custom gaming PCs from graphics cards, processors, and motherboards
- Eject parts from built PCs
- Per-user cooldown system for getting cards
- Modern Telegram Mini App with edge-to-edge design
- Animated card reveal with scrolling reel
- Framer Motion animations throughout
- Full Telegram Mini Apps platform integration

## Setup

### Backend (Bot + API)

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file with your bot token:
```
BOT_TOKEN=your_telegram_bot_token_here
```

3. Run the bot (starts both Telegram bot and FastAPI server on port 8400):
```bash
python3 bot.py
```

The bot will run on the default polling mode, and the FastAPI API will be available at `http://localhost:8400` (configured for `api.getgadgets.toolbox-io.ru`).

### Frontend (Mini App)

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Run the development server (runs on port 8401):
```bash
npm run dev
```

The frontend will be available at `http://localhost:8401` (configured for `getgadgets.toolbox-io.ru`).

### VS Code Tasks

VS Code tasks are configured to run both the bot and frontend:

- **Run Bot**: Starts the Python bot and FastAPI server
- **Run Vite**: Starts the Vite development server
- **Run Bot and Frontend**: Runs both servers in parallel (auto-runs on folder open)

Access these tasks via `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux) and type "Tasks: Run Task".

## Ports

- **Backend API**: `8400` (api.getgadgets.toolbox-io.ru)
- **Frontend**: `8401` (getgadgets.toolbox-io.ru)

## Commands

- `/start` - Welcome message and bot overview
- `/card` - Get a random gadget card (30 min cooldown, commented out for testing)
- `/cards` - View your card collection
- `/build` - Build a custom PC from your parts
- `/pc` - View and manage your built PCs
- `/help` - List all commands and explanations

## Getting a Bot Token

1. Talk to [@BotFather](https://t.me/BotFather) on Telegram
2. Use `/newbot` command
3. Follow the instructions to create your bot
4. Copy the token and add it to your `.env` file

