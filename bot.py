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
import database


async def initialize_user(application):
    """Scan and print information about all users in the database, and ban specified users."""
    try:
        bot = application.bot
        
        # List of banned usernames (without @)
        BANNED_USERNAMES = [
            "lunaqvx",
            "corenikw",
            "wineliko",
            "SonyEshkaa",
            "W10USR",
            "happywinwhistler1",
            "pimidorlol",
            "exqz04"
        ]
        
        # Load all users from database
        users = database.load_users()
        user_ids = [int(user_id) for user_id in users.keys()]
        
        print("\n" + "="*60)
        print(f"SCANNING USER INFORMATION FOR ALL USERS IN DATABASE")
        print(f"Total users found: {len(user_ids)}")
        print("="*60)
        
        successful_scans = 0
        failed_scans = 0
        banned_users = []
        
        for user_id in user_ids:
            print(f"\n{'='*60}")
            print(f"USER ID: {user_id}")
            print("="*60)
            
            try:
                # Try to get user chat information
                chat = await bot.get_chat(user_id)
                
                print(f"\n📱 USER INFORMATION:")
                print(f"   User ID: {chat.id}")
                
                first_name = chat.first_name if hasattr(chat, 'first_name') and chat.first_name else None
                last_name = chat.last_name if hasattr(chat, 'last_name') and chat.last_name else None
                
                print(f"   First Name: {first_name if first_name else 'N/A'}")
                print(f"   Last Name: {last_name if last_name else 'N/A'}")
                
                display_name = f"{first_name or ''} {last_name or ''}".strip()
                print(f"   Display Name: {display_name if display_name else 'N/A'}")
                
                username = chat.username if hasattr(chat, 'username') and chat.username else None
                print(f"   Username: @{username if username else 'N/A'}")
                
                # Check if user should be banned
                if username and username.lower() in [u.lower() for u in BANNED_USERNAMES]:
                    print(f"\n🚫 BANNED USER DETECTED: @{username}")
                    print(f"   Banning user and clearing all data...")
                    database.ban_user(user_id)
                    database.add_banned_user(user_id, username, f"Banned username: @{username}")
                    banned_users.append({
                        "user_id": user_id,
                        "username": username,
                        "display_name": display_name
                    })
                    print(f"   ✅ User @{username} (ID: {user_id}) has been banned and data cleared")
                    continue
                
                # Try to get bio (description) - this might not be available
                if hasattr(chat, 'bio') and chat.bio:
                    print(f"   Bio: {chat.bio}")
                else:
                    print(f"   Bio: N/A (not available or hidden)")
                
                # Phone number is typically not available to bots via get_chat
                # It's only available in certain contexts (like contact sharing)
                if hasattr(chat, 'phone_number') and chat.phone_number:
                    print(f"   Phone Number: {chat.phone_number}")
                else:
                    print(f"   Phone Number: N/A (not available - bots cannot access phone numbers directly)")
                
                # Additional info if available
                if hasattr(chat, 'language_code') and chat.language_code:
                    print(f"   Language Code: {chat.language_code}")
                
                if hasattr(chat, 'is_bot'):
                    print(f"   Is Bot: {chat.is_bot}")
                
                successful_scans += 1
                
            except Exception as chat_error:
                print(f"\n❌ Could not fetch user information via get_chat()")
                print(f"   Error: {chat_error}")
                print(f"   This usually means:")
                print(f"   - User has not interacted with the bot yet")
                print(f"   - User has blocked the bot")
                print(f"   - User privacy settings prevent access")
                
                # Even if we can't get chat info, check if user_id matches any known banned users
                # We'll try to ban by user_id if we have it in our records
                # But since we can't get username, we'll skip this case
                failed_scans += 1
        
        # Also check for users we couldn't fetch info for but might be in banned list
        # Try to ban by checking if any remaining users might match (this is a fallback)
        print(f"\n{'='*60}")
        print("BAN CHECK FOR USERS WITHOUT USERNAMES")
        print("="*60)
        remaining_users = database.load_users()
        for user_id_str in list(remaining_users.keys()):
            user_id = int(user_id_str)
            # If user is still in database but we couldn't fetch their info,
            # we can't verify their username, so we'll leave them for now
            # The ban will happen when they interact with the bot next time
        
        print("\n" + "="*60)
        print("SCAN SUMMARY")
        print("="*60)
        print(f"Total users scanned: {len(user_ids)}")
        print(f"Successful: {successful_scans}")
        print(f"Failed: {failed_scans}")
        if banned_users:
            print(f"\n🚫 BANNED USERS ({len(banned_users)}):")
            for banned in banned_users:
                print(f"   - @{banned['username']} (ID: {banned['user_id']}, Name: {banned['display_name']})")
        print("="*60)
        print("\nNote: Bots can only access user info if:")
        print("  - User has sent a message to the bot, OR")
        print("  - User is in a group/channel where the bot is present")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"Initialization error: {e}")
        import traceback
        traceback.print_exc()


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
