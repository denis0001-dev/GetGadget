"""
Telegram Gadget Card Bot
Main entry point for the bot application.
"""

from telegram import Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler

import config
import commands
import callbacks
import bot_api


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


def main():
    """Main function to run the bot."""
    # Create application
    application = Application.builder().token(config.BOT_TOKEN).build()
    
    # Add command handlers
    application.add_handler(CommandHandler("start", commands.start_command))
    application.add_handler(CommandHandler("card", commands.card_command))
    application.add_handler(CommandHandler("gadgets", commands.gadgets_command))
    application.add_handler(CommandHandler("profile", commands.profile_command))
    application.add_handler(CommandHandler("build", commands.build_command))
    application.add_handler(CommandHandler("help", commands.help_command))
    
    # Add callback query handler
    application.add_handler(CallbackQueryHandler(callbacks.button_callback))
    
    # Initialize user gadgets on startup
    async def post_init(app):
        await initialize_user(app)
    
    application.post_init = post_init
    
    # Start integrated web API: binds to all interfaces and allows both dev and production origins
    try:
        bot_api.start_web_api(dev_cors_origins=["http://localhost:5173"])
        print("Started integrated web API on 0.0.0.0:8400")
    except Exception as e:
        print(f"Warning: Failed to start integrated web API: {e}")

    # Run bot
    print("Bot is running...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
