"""
Telegram Gadget Card Bot
Main entry point for the bot application.
"""

import asyncio
import threading
from telegram import Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler
import uvicorn

import config
import commands
import callbacks
import api


async def initialize_user(application):
    """Initialize gadgets for @denis0001-dev on startup."""
    try:
        # Get bot info to find user
        bot = application.bot
        username = "denis0001-dev"
        
        # Try to find user by username (this requires the user to have interacted with bot first)
        # For now, we'll grant cards when user first uses /start
        pass
    except Exception as e:
        print(f"Initialization error: {e}")


def run_api_server():
    """Run FastAPI server in a separate thread."""
    uvicorn.run(
        api.app,
        host=config.API_HOST,
        port=config.API_PORT,
        log_level="info"
    )


def main():
    """Main function to run the bot."""
    # Start API server in background thread
    api_thread = threading.Thread(target=run_api_server, daemon=True)
    api_thread.start()
    print(f"API server started on {config.API_HOST}:{config.API_PORT}")
    
    # Create application
    application = Application.builder().token(config.BOT_TOKEN).build()
    
    # Add command handlers
    application.add_handler(CommandHandler("start", commands.start_command))
    application.add_handler(CommandHandler("card", commands.card_command))
    application.add_handler(CommandHandler("gadgets", commands.gadgets_command))
    application.add_handler(CommandHandler("profile", commands.profile_command))
    application.add_handler(CommandHandler("build", commands.build_command))
    application.add_handler(CommandHandler("help", commands.help_command))
    application.add_handler(CommandHandler("pay", commands.pay_command))
    
    # Add callback query handler
    application.add_handler(CallbackQueryHandler(callbacks.button_callback))
    
    # Initialize user gadgets on startup
    async def post_init(app):
        await initialize_user(app)
    
    application.post_init = post_init
    
    # Run bot with proper event loop for Python 3.12+
    print("Bot is running...")
    # Python 3.12+ compatibility: ensure event loop policy is set
    try:
        # Try to get or create event loop
        loop = asyncio.get_event_loop()
    except RuntimeError:
        # No event loop exists, create a new one
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
