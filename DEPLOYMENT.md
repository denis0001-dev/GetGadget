# Deployment Guide

## Backend (Raspberry Pi)

### 1. Install Dependencies

```bash
cd bot
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file in the `bot/` directory:

```
BOT_TOKEN=your_telegram_bot_token_here
```

### 3. Update Frontend URL

Edit `bot/config.py` and update `FRONTEND_URL` with your actual GitHub Pages URL:

```python
FRONTEND_URL = "https://yourusername.github.io/GetGadget"
```

### 4. Run the Bot

```bash
cd bot
python bot.py
```

The bot will start both the Telegram bot and the FastAPI server on port 8400.

### 5. Configure Firewall (if needed)

```bash
sudo ufw allow 8400/tcp
```

### 6. Set up as a Service (Optional)

Create `/etc/systemd/system/getgadget.service`:

```ini
[Unit]
Description=GetGadget Bot and API
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/path/to/GetGadget/bot
ExecStart=/usr/bin/python3 bot.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl enable getgadget
sudo systemctl start getgadget
```

## Frontend (GitHub Pages)

### 1. Update API URL (if needed)

Edit `frontend/.env` or set in GitHub Actions:

```
VITE_API_URL=http://95.165.0.162:8400
```

### 2. Deploy

The GitHub Actions workflow will automatically deploy when you push to main. Or manually:

```bash
cd frontend
npm install
npm run build
# Deploy dist/ to GitHub Pages
```

### 3. Update Bot Config

After deploying, update `bot/config.py` with the GitHub Pages URL and restart the bot.

## Testing

1. Open your bot in Telegram
2. Use `/start` command
3. Click "📱 Открыть Приложение" button
4. The Mini App should open and connect to your API

## Troubleshooting

- **API not accessible**: Check firewall rules and ensure port 8400 is open
- **CORS errors**: Verify `FRONTEND_URL` in `bot/config.py` matches your GitHub Pages URL
- **Telegram auth fails**: Ensure the Mini App is opened from Telegram, not directly in browser

