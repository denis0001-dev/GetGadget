"""
Telegram Gadget Card Bot
Main entry point for the bot application.
"""

import asyncio
import threading

import uvicorn
from telegram import Update
from telegram.ext import Application, CommandHandler, CallbackQueryHandler

import api
import config
import commands
import callbacks


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
    """Run the FastAPI server in a separate thread."""
    import nest_asyncio
    nest_asyncio.apply()
    
    app = api.create_app()
    uvicorn_config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=8400,
        log_level="info",
        loop="asyncio"
    )
    server = uvicorn.Server(uvicorn_config)
    
    # Create new event loop for this thread
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(server.serve())


def main():
    """Main function to run the bot."""
    # Start FastAPI server in a separate thread
    api_thread = threading.Thread(target=run_api_server, daemon=True)
    api_thread.start()
    print("FastAPI server started on port 8400")
    
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
    
    # Run bot
    print("Bot is running...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
