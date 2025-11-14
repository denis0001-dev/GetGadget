# Telegram Gadget Card Bot

A Telegram bot that lets you collect gadget cards, manage coins, and build custom PCs from parts you collect.

## Features

- Collect gadget cards (phones, tablets, laptops, PC parts)
- Expanded rarity system (Trash, Common, Uncommon, Rare, Epic, Legendary, Mythic)
- Coin system - earn coins by selling cards (15% less than purchase price)
- Build custom gaming PCs from graphics cards, processors, and motherboards
- Eject parts from built PCs
- Per-user cooldown system for getting cards

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Add your Telegram bot token to `.env`:
```
BOT_TOKEN=your_telegram_bot_token_here
```

4. Run the bot:
```bash
python bot.py
```

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

