"""
Telegram Gadget Card Bot
Main bot file with command handlers.
"""

import os
import time
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, ContextTypes

import gadgets
import database
import pc_generator

# Load environment variables
load_dotenv()

# Bot token
BOT_TOKEN = os.getenv("BOT_TOKEN")
if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN not found in environment variables")

# Cooldown time in seconds (30 minutes)
COOLDOWN_TIME = 30 * 60

# Initialization gadgets for @denis0001-dev
INIT_GADGETS = [
    "Samsung Galaxy S25 Ultra",
    "Biostar B250MHC",
    "MacBook Air M4"
]


async def initialize_user(application: Application):
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


async def grant_initial_gadgets(user_id: int):
    """Grant initial gadgets to user if they don't have them."""
    for gadget_name in INIT_GADGETS:
        if not database.user_has_gadget(user_id, gadget_name):
            gadget = gadgets.get_gadget_by_name(gadget_name)
            if gadget:
                database.add_card(
                    user_id,
                    gadget["name"],
                    gadget["category"],
                    gadget["price"],
                    gadget["rarity"]
                )


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    user_id = update.effective_user.id
    username = update.effective_user.username
    
    # Grant initial gadgets to @denis0001-dev if this is first time
    if username == "denis0001-dev":
        await grant_initial_gadgets(user_id)
    
    # Get user data
    user = database.get_user(user_id)
    coins = user["coins"]
    
    message = (
        "🎮 <b>Welcome to Gadget Card Bot!</b>\n\n"
        "Collect gadget cards and build your dream PC!\n\n"
        "<b>💰 Coin System:</b>\n"
        "• Start with 0 coins\n"
        "• Earn coins by selling cards\n"
        "• Selling gives you 85% of the original price\n\n"
        "<b>🎴 Card System:</b>\n"
        "• Get random cards with /card\n"
        "• View your collection with /cards\n"
        "• Cards have 7 rarity levels: Trash → Common → Uncommon → Rare → Epic → Legendary → Mythic\n\n"
        "<b>🖥️ PC Building:</b>\n"
        "• Collect graphics cards, processors, and motherboards\n"
        "• Build custom PCs with /build\n"
        "• Eject parts from PCs anytime\n\n"
        f"<b>Your Coins:</b> {coins} 💰"
    )
    
    keyboard = [
        [InlineKeyboardButton("Get Card 🎴", callback_data="get_card")],
        [InlineKeyboardButton("My Cards 📚", callback_data="view_cards")],
        [InlineKeyboardButton("Profile 👤", callback_data="profile")],
        [InlineKeyboardButton("Build PC 🖥️", callback_data="build_pc")],
        [InlineKeyboardButton("Help ❓", callback_data="help")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(message, reply_markup=reply_markup, parse_mode="HTML")


async def card_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /card command."""
    user_id = update.effective_user.id
    user = database.get_user(user_id)
    
    # Cooldown check (commented out for testing as requested)
    # current_time = time.time()
    # last_card_time = user.get("last_card_time", 0)
    # time_since_last = current_time - last_card_time
    # 
    # if time_since_last < COOLDOWN_TIME:
    #     remaining = int(COOLDOWN_TIME - time_since_last)
    #     minutes = remaining // 60
    #     seconds = remaining % 60
    #     await update.message.reply_text(
    #         f"⏰ Cooldown active! Wait {minutes}m {seconds}s before getting another card."
    #     )
    #     return
    
    # Get random gadget
    gadget = gadgets.get_random_gadget()
    
    # Add card to user's collection
    card_id = database.add_card(
        user_id,
        gadget["name"],
        gadget["category"],
        gadget["price"],
        gadget["rarity"]
    )
    
    # Update last card time
    database.update_user(user_id, last_card_time=time.time())
    
    # Display card
    rarity_emoji = gadgets.get_rarity_emoji(gadget["rarity"])
    message = (
        f"🎴 <b>You got a new card!</b>\n\n"
        f"<b>Name:</b> {gadget['name']}\n"
        f"<b>Category:</b> {gadget['category']}\n"
        f"<b>Price:</b> {gadget['price']} coins\n"
        f"<b>Rarity:</b> {rarity_emoji} {gadget['rarity']}\n\n"
        f"Card ID: {card_id}"
    )
    
    keyboard = [
        [InlineKeyboardButton("View My Cards 📚", callback_data="view_cards")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(message, reply_markup=reply_markup, parse_mode="HTML")


async def cards_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /cards command."""
    await show_cards(update, context)


async def show_cards(update: Update, context: ContextTypes.DEFAULT_TYPE, query=None):
    """Show user's cards."""
    if query:
        user_id = query.from_user.id
        message_obj = query.message
    else:
        user_id = update.effective_user.id
        message_obj = update.message
    
    cards = database.get_user_cards(user_id)
    
    if not cards:
        message = "📭 You don't have any cards yet!\n\nUse /card to get your first card!"
        keyboard = [[InlineKeyboardButton("Get Card 🎴", callback_data="get_card")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        if query:
            await query.edit_message_text(message, reply_markup=reply_markup)
        else:
            await message_obj.reply_text(message, reply_markup=reply_markup)
        return
    
    # Group cards by category
    cards_by_category = {}
    built_pcs = []
    
    for card in cards:
        if card["category"] == "PC":
            built_pcs.append(card)
        else:
            category = card["category"]
            if category not in cards_by_category:
                cards_by_category[category] = []
            cards_by_category[category].append(card)
    
    # Build message
    message_parts = ["📚 <b>Your Card Collection</b>\n"]
    
    # Show built PCs first
    if built_pcs:
        message_parts.append("\n🖥️ <b>Built PCs:</b>")
        for pc in built_pcs:
            components = pc.get("components", [])
            specs = pc.get("specs", {})
            rarity_emoji = gadgets.get_rarity_emoji(pc["rarity"])
            message_parts.append(
                f"\n• {rarity_emoji} <b>{pc['gadget_name']}</b> ({pc['rarity']})\n"
                f"  Price: {pc['purchase_price']} coins\n"
                f"  Components: {len(components)} parts"
            )
    
    # Show cards by category
    for category, category_cards in cards_by_category.items():
        message_parts.append(f"\n<b>{category}:</b>")
        for card in category_cards:
            rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
            in_pc_indicator = " 🔗" if card.get("in_pc") else ""
            message_parts.append(
                f"• {rarity_emoji} {card['gadget_name']} ({card['rarity']}) - {card['purchase_price']} coins{in_pc_indicator}"
            )
    
    message = "\n".join(message_parts)
    
    # Create keyboard with buttons to view each card
    keyboard = []
    row = []
    for i, card in enumerate(cards):
        if card.get("in_pc") is None:  # Only show cards not in PC
            button_text = f"View {card['gadget_name'][:12]}"
            if len(button_text) > 20:
                button_text = button_text[:17] + "..."
            row.append(InlineKeyboardButton(button_text, callback_data=f"view_card_{card['card_id']}"))
            if len(row) == 2:
                keyboard.append(row)
                row = []
    
    if row:
        keyboard.append(row)
    
    keyboard.append([InlineKeyboardButton("View Built PCs 🖥️", callback_data="view_pcs")])
    keyboard.append([InlineKeyboardButton("Build PC 🛠️", callback_data="build_pc")])
    keyboard.append([InlineKeyboardButton("Back ↩️", callback_data="back_to_start")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if query:
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    else:
        await message_obj.reply_text(message, reply_markup=reply_markup, parse_mode="HTML")


async def build_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /build command."""
    await show_build_menu(update, context)


async def show_build_menu(update: Update, context: ContextTypes.DEFAULT_TYPE, query=None, selected_gpu=None, selected_cpu=None):
    """Show build PC menu."""
    if query:
        user_id = query.from_user.id
        message_obj = query.message
    else:
        user_id = update.effective_user.id
        message_obj = update.message
    
    parts = database.get_available_pc_parts(user_id)
    
    if not selected_gpu:
        # Step 1: Select GPU
        if not parts["Graphics Card"]:
            message = "❌ You don't have any graphics cards!\n\nGet some cards first with /card"
            keyboard = [[InlineKeyboardButton("Get Card 🎴", callback_data="get_card")]]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            if query:
                await query.edit_message_text(message, reply_markup=reply_markup)
            else:
                await message_obj.reply_text(message, reply_markup=reply_markup)
            return
        
        message = "🖥️ <b>Build Custom PC</b>\n\n<b>Step 1:</b> Select Graphics Card"
        keyboard = []
        for card in parts["Graphics Card"]:
            rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
            button_text = f"{rarity_emoji} {card['gadget_name']}"
            keyboard.append([InlineKeyboardButton(button_text, callback_data=f"build_gpu_{card['card_id']}")])
        keyboard.append([InlineKeyboardButton("Cancel ❌", callback_data="view_cards")])
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        if query:
            await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
        else:
            await message_obj.reply_text(message, reply_markup=reply_markup, parse_mode="HTML")
        return
    
    if not selected_cpu:
        # Step 2: Select CPU
        if not parts["Processor"]:
            message = "❌ You don't have any processors!\n\nGet some cards first with /card"
            keyboard = [[InlineKeyboardButton("Get Card 🎴", callback_data="get_card")]]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text(message, reply_markup=reply_markup)
            return
        
        gpu_card = database.get_card(user_id, selected_gpu)
        message = f"🖥️ <b>Build Custom PC</b>\n\n<b>Selected GPU:</b> {gpu_card['gadget_name']}\n\n<b>Step 2:</b> Select Processor"
        keyboard = []
        for card in parts["Processor"]:
            rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
            button_text = f"{rarity_emoji} {card['gadget_name']}"
            keyboard.append([InlineKeyboardButton(button_text, callback_data=f"build_cpu_{selected_gpu}_{card['card_id']}")])
        keyboard.append([InlineKeyboardButton("Back ↩️", callback_data="build_pc")])
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
        return
    
    # Step 3: Select Motherboard
    if not parts["Motherboard"]:
        message = "❌ You don't have any motherboards!\n\nGet some cards first with /card"
        keyboard = [[InlineKeyboardButton("Get Card 🎴", callback_data="get_card")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup)
        return
    
    gpu_card = database.get_card(user_id, selected_gpu)
    cpu_card = database.get_card(user_id, selected_cpu)
    message = (
        f"🖥️ <b>Build Custom PC</b>\n\n"
        f"<b>Selected GPU:</b> {gpu_card['gadget_name']}\n"
        f"<b>Selected CPU:</b> {cpu_card['gadget_name']}\n\n"
        f"<b>Step 3:</b> Select Motherboard"
    )
    keyboard = []
    for card in parts["Motherboard"]:
        rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
        button_text = f"{rarity_emoji} {card['gadget_name']}"
        keyboard.append([InlineKeyboardButton(button_text, callback_data=f"build_mb_{selected_gpu}_{selected_cpu}_{card['card_id']}")])
    keyboard.append([InlineKeyboardButton("Back ↩️", callback_data=f"build_cpu_{selected_gpu}")])
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")


async def pc_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /pc command."""
    await show_pcs(update, context)


async def show_pcs(update: Update, context: ContextTypes.DEFAULT_TYPE, query=None):
    """Show user's built PCs."""
    if query:
        user_id = query.from_user.id
        message_obj = query.message
    else:
        user_id = update.effective_user.id
        message_obj = update.message
    
    pcs = database.get_built_pcs(user_id)
    
    if not pcs:
        message = "🖥️ You don't have any built PCs yet!\n\nUse /build to create one!"
        keyboard = [[InlineKeyboardButton("Build PC 🛠️", callback_data="build_pc")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        if query:
            await query.edit_message_text(message, reply_markup=reply_markup)
        else:
            await message_obj.reply_text(message, reply_markup=reply_markup)
        return
    
    message_parts = ["🖥️ <b>Your Built PCs</b>\n"]
    
    for pc in pcs:
        components = pc.get("components", [])
        specs = pc.get("specs", {})
        rarity_emoji = gadgets.get_rarity_emoji(pc["rarity"])
        
        # Get component names
        component_names = []
        for comp_id in components:
            comp_card = database.get_card(user_id, comp_id)
            if comp_card:
                component_names.append(comp_card["gadget_name"])
        
        message_parts.append(
            f"\n{rarity_emoji} <b>{pc['gadget_name']}</b> ({pc['rarity']})\n"
            f"Price: {pc['purchase_price']} coins\n"
            f"GPU: {component_names[0] if len(component_names) > 0 else 'N/A'}\n"
            f"CPU: {component_names[1] if len(component_names) > 1 else 'N/A'}\n"
            f"Motherboard: {component_names[2] if len(component_names) > 2 else 'N/A'}\n"
            f"RAM: {specs.get('ram', 'N/A')}\n"
            f"Storage: {specs.get('storage', 'N/A')}\n"
            f"PSU: {specs.get('psu', 'N/A')}\n"
            f"Case: {specs.get('case', 'N/A')}"
        )
    
    message = "\n".join(message_parts)
    
    # Create keyboard with buttons for each PC
    keyboard = []
    for pc in pcs:
        keyboard.append([InlineKeyboardButton(f"Manage {pc['gadget_name'][:20]}", callback_data=f"pc_{pc['card_id']}")])
    keyboard.append([InlineKeyboardButton("Back ↩️", callback_data="view_cards")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    if query:
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    else:
        await message_obj.reply_text(message, reply_markup=reply_markup, parse_mode="HTML")


async def profile_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /profile command."""
    user_id = update.effective_user.id
    user = database.get_user(user_id)
    coins = user["coins"]
    
    cards = database.get_user_cards(user_id)
    total_cards = len(cards)
    
    # Calculate total price of all cards and PCs
    total_price = 0
    for card in cards:
        total_price += card["purchase_price"]
    
    # Count PCs
    pcs = [c for c in cards if c["category"] == "PC"]
    pc_count = len(pcs)
    
    message = (
        f"👤 <b>Your Profile</b>\n\n"
        f"💰 <b>Coins:</b> {coins}\n\n"
        f"📊 <b>Statistics:</b>\n"
        f"• Total Cards: {total_cards}\n"
        f"• Built PCs: {pc_count}\n"
        f"• Total Collection Value: {total_price} coins"
    )
    
    keyboard = [
        [InlineKeyboardButton("View Cards 📚", callback_data="view_cards")],
        [InlineKeyboardButton("Back ↩️", callback_data="back_to_start")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(message, reply_markup=reply_markup, parse_mode="HTML")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command."""
    message = (
        "📖 <b>Bot Commands</b>\n\n"
        "<b>/start</b> - Welcome message and bot overview\n"
        "<b>/card</b> - Get a random gadget card\n"
        "<b>/cards</b> - View your card collection\n"
        "<b>/profile</b> - View your profile and statistics\n"
        "<b>/build</b> - Build a custom PC from your parts\n"
        "<b>/pc</b> - View and manage your built PCs\n"
        "<b>/help</b> - Show this help message\n\n"
        "<b>💰 Coin System:</b>\n"
        "• Start with 0 coins\n"
        "• Earn coins by selling cards\n"
        "• Selling gives you 85% of original price (15% deduction)\n\n"
        "<b>🎴 Rarity Levels:</b>\n"
        "🗑️ Trash → ⚪ Common → 🟢 Uncommon → 🔵 Rare → 🟣 Epic → 🟠 Legendary → 🔴 Mythic\n\n"
        "<b>🖥️ PC Building:</b>\n"
        "• Collect graphics cards, processors, and motherboards\n"
        "• Use /build to assemble them into a PC\n"
        "• PC specs (RAM, storage, PSU, case) are generated automatically\n"
        "• You can eject parts from PCs anytime"
    )
    
    keyboard = [[InlineKeyboardButton("Back ↩️", callback_data="back_to_start")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(message, reply_markup=reply_markup, parse_mode="HTML")


async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks."""
    query = update.callback_query
    await query.answer()
    
    data = query.data
    user_id = query.from_user.id
    
    if data == "get_card":
        # Simulate /card command
        user = database.get_user(user_id)
        gadget = gadgets.get_random_gadget()
        card_id = database.add_card(
            user_id,
            gadget["name"],
            gadget["category"],
            gadget["price"],
            gadget["rarity"]
        )
        database.update_user(user_id, last_card_time=time.time())
        
        rarity_emoji = gadgets.get_rarity_emoji(gadget["rarity"])
        message = (
            f"🎴 <b>You got a new card!</b>\n\n"
            f"<b>Name:</b> {gadget['name']}\n"
            f"<b>Category:</b> {gadget['category']}\n"
            f"<b>Price:</b> {gadget['price']} coins\n"
            f"<b>Rarity:</b> {rarity_emoji} {gadget['rarity']}\n\n"
            f"Card ID: {card_id}"
        )
        keyboard = [[InlineKeyboardButton("View My Cards 📚", callback_data="view_cards")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data == "view_cards":
        await show_cards(update, context, query)
    
    elif data == "profile":
        user = database.get_user(user_id)
        coins = user["coins"]
        
        cards = database.get_user_cards(user_id)
        total_cards = len(cards)
        
        # Calculate total price of all cards and PCs
        total_price = 0
        for card in cards:
            total_price += card["purchase_price"]
        
        # Count PCs
        pcs = [c for c in cards if c["category"] == "PC"]
        pc_count = len(pcs)
        
        message = (
            f"👤 <b>Your Profile</b>\n\n"
            f"💰 <b>Coins:</b> {coins}\n\n"
            f"📊 <b>Statistics:</b>\n"
            f"• Total Cards: {total_cards}\n"
            f"• Built PCs: {pc_count}\n"
            f"• Total Collection Value: {total_price} coins"
        )
        
        keyboard = [
            [InlineKeyboardButton("View Cards 📚", callback_data="view_cards")],
            [InlineKeyboardButton("Back ↩️", callback_data="back_to_start")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data == "build_pc":
        await show_build_menu(update, context, query)
    
    elif data == "view_pcs":
        await show_pcs(update, context, query)
    
    elif data == "help":
        message = (
            "📖 <b>Bot Commands</b>\n\n"
        "<b>/start</b> - Welcome message and bot overview\n"
        "<b>/card</b> - Get a random gadget card\n"
        "<b>/cards</b> - View your card collection\n"
        "<b>/profile</b> - View your profile and statistics\n"
        "<b>/build</b> - Build a custom PC from your parts\n"
        "<b>/pc</b> - View and manage your built PCs\n"
        "<b>/help</b> - Show this help message\n\n"
            "<b>💰 Coin System:</b>\n"
            "• Start with 0 coins\n"
            "• Earn coins by selling cards\n"
            "• Selling gives you 85% of original price (15% deduction)\n\n"
            "<b>🎴 Rarity Levels:</b>\n"
            "🗑️ Trash → ⚪ Common → 🟢 Uncommon → 🔵 Rare → 🟣 Epic → 🟠 Legendary → 🔴 Mythic\n\n"
            "<b>🖥️ PC Building:</b>\n"
            "• Collect graphics cards, processors, and motherboards\n"
            "• Use /build to assemble them into a PC\n"
            "• PC specs (RAM, storage, PSU, case) are generated automatically\n"
            "• You can eject parts from PCs anytime"
        )
        keyboard = [[InlineKeyboardButton("Back ↩️", callback_data="back_to_start")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data == "back_to_start":
        user = database.get_user(user_id)
        coins = user["coins"]
        message = (
            "🎮 <b>Welcome to Gadget Card Bot!</b>\n\n"
            "Collect gadget cards and build your dream PC!\n\n"
            "<b>💰 Coin System:</b>\n"
            "• Start with 0 coins\n"
            "• Earn coins by selling cards\n"
            "• Selling gives you 85% of the original price\n\n"
            "<b>🎴 Card System:</b>\n"
            "• Get random cards with /card\n"
            "• View your collection with /cards\n"
            "• Cards have 7 rarity levels: Trash → Common → Uncommon → Rare → Epic → Legendary → Mythic\n\n"
            "<b>🖥️ PC Building:</b>\n"
            "• Collect graphics cards, processors, and motherboards\n"
            "• Build custom PCs with /build\n"
            "• Eject parts from PCs anytime\n\n"
            f"<b>Your Coins:</b> {coins} 💰"
        )
        keyboard = [
            [InlineKeyboardButton("Get Card 🎴", callback_data="get_card")],
            [InlineKeyboardButton("My Cards 📚", callback_data="view_cards")],
            [InlineKeyboardButton("Build PC 🖥️", callback_data="build_pc")],
            [InlineKeyboardButton("Help ❓", callback_data="help")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data.startswith("view_card_"):
        card_id = int(data.split("_")[2])
        card = database.get_card(user_id, card_id)
        
        if not card:
            await query.answer("Card not found!", show_alert=True)
            return
        
        rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
        in_pc_indicator = "\n🔗 <b>This part is in a PC</b>" if card.get("in_pc") else ""
        
        message = (
            f"{rarity_emoji} <b>{card['gadget_name']}</b>\n\n"
            f"<b>Category:</b> {card['category']}\n"
            f"<b>Rarity:</b> {card['rarity']}\n"
            f"<b>Price:</b> {card['purchase_price']} coins{in_pc_indicator}"
        )
        
        keyboard = []
        if card.get("in_pc") is None:  # Only show sell if not in PC
            sale_price = int(card["purchase_price"] * 0.85)
            keyboard.append([InlineKeyboardButton(f"💰 Sell ({sale_price} coins)", callback_data=f"confirm_sell_{card_id}")])
        keyboard.append([InlineKeyboardButton("Back ↩️", callback_data="view_cards")])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data.startswith("confirm_sell_"):
        card_id = int(data.split("_")[2])
        card = database.get_card(user_id, card_id)
        
        if not card:
            await query.answer("Card not found!", show_alert=True)
            return
        
        if card.get("in_pc"):
            await query.answer("Cannot sell a part that's in a PC! Eject it first.", show_alert=True)
            return
        
        # Show confirmation
        sale_price = int(card["purchase_price"] * 0.85)
        rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
        message = (
            f"⚠️ <b>Confirm Sale</b>\n\n"
            f"{rarity_emoji} <b>{card['gadget_name']}</b>\n"
            f"Original Price: {card['purchase_price']} coins\n"
            f"Sale Price: {sale_price} coins (85%)\n\n"
            f"Are you sure you want to sell this card?"
        )
        
        keyboard = [
            [InlineKeyboardButton("✅ Yes, Sell", callback_data=f"sell_{card_id}")],
            [InlineKeyboardButton("❌ Cancel", callback_data=f"view_card_{card_id}")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data.startswith("sell_") and not data.startswith("sell_pc_"):
        card_id = int(data.split("_")[1])
        card = database.get_card(user_id, card_id)
        
        if not card:
            await query.answer("Card not found!", show_alert=True)
            return
        
        if card.get("in_pc"):
            await query.answer("Cannot sell a part that's in a PC! Eject it first.", show_alert=True)
            return
        
        # Calculate sale price (85% of original)
        sale_price = int(card["purchase_price"] * 0.85)
        
        # Add coins
        new_balance = database.add_coins(user_id, sale_price)
        
        # Remove card
        database.remove_card(user_id, card_id)
        
        rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
        message = (
            f"💰 <b>Card Sold!</b>\n\n"
            f"{rarity_emoji} <b>{card['gadget_name']}</b>\n"
            f"Original Price: {card['purchase_price']} coins\n"
            f"Sale Price: {sale_price} coins (85%)\n\n"
            f"<b>New Balance:</b> {new_balance} coins"
        )
        keyboard = [[InlineKeyboardButton("View Cards 📚", callback_data="view_cards")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data.startswith("build_gpu_"):
        gpu_id = int(data.split("_")[2])
        await show_build_menu(update, context, query, selected_gpu=gpu_id)
    
    elif data.startswith("build_cpu_"):
        parts = data.split("_")
        if len(parts) == 3:
            # Just GPU selected, now selecting CPU
            gpu_id = int(parts[2])
            await show_build_menu(update, context, query, selected_gpu=gpu_id)
        else:
            # CPU selected
            gpu_id = int(parts[2])
            cpu_id = int(parts[3])
            await show_build_menu(update, context, query, selected_gpu=gpu_id, selected_cpu=cpu_id)
    
    elif data.startswith("build_mb_"):
        parts = data.split("_")
        gpu_id = int(parts[2])
        cpu_id = int(parts[3])
        mb_id = int(parts[4])
        
        # Get component cards
        gpu_card = database.get_card(user_id, gpu_id)
        cpu_card = database.get_card(user_id, cpu_id)
        mb_card = database.get_card(user_id, mb_id)
        
        if not all([gpu_card, cpu_card, mb_card]):
            await query.answer("Error: One or more parts not found!", show_alert=True)
            return
        
        # Generate PC specs
        specs, pc_rarity, spec_price = pc_generator.generate_pc_specs(
            gpu_card["rarity"],
            cpu_card["rarity"],
            mb_card["rarity"]
        )
        
        # Calculate total price (components + specs, then add 15% premium)
        component_total = gpu_card["purchase_price"] + cpu_card["purchase_price"] + mb_card["purchase_price"] + spec_price
        total_price = int(component_total * 1.15)  # 15% higher than component total
        
        # Create PC card
        pc_name = f"Custom Gaming PC ({gpu_card['gadget_name']})"
        pc_card_id = database.add_card(
            user_id,
            pc_name,
            "PC",
            total_price,
            pc_rarity
        )
        
        # Update PC card with components and specs
        database.update_card(user_id, pc_card_id, components=[gpu_id, cpu_id, mb_id], specs=specs)
        
        # Mark components as in PC
        database.update_card(user_id, gpu_id, in_pc=pc_card_id)
        database.update_card(user_id, cpu_id, in_pc=pc_card_id)
        database.update_card(user_id, mb_id, in_pc=pc_card_id)
        
        rarity_emoji = gadgets.get_rarity_emoji(pc_rarity)
        message = (
            f"🖥️ <b>PC Built Successfully!</b>\n\n"
            f"{rarity_emoji} <b>{pc_name}</b> ({pc_rarity})\n\n"
            f"<b>Components:</b>\n"
            f"• GPU: {gpu_card['gadget_name']}\n"
            f"• CPU: {cpu_card['gadget_name']}\n"
            f"• Motherboard: {mb_card['gadget_name']}\n\n"
            f"<b>Specifications:</b>\n"
            f"• RAM: {specs['ram']}\n"
            f"• Storage: {specs['storage']}\n"
            f"• PSU: {specs['psu']}\n"
            f"• Case: {specs['case']}\n\n"
            f"<b>Total Price:</b> {total_price} coins"
        )
        keyboard = [
            [InlineKeyboardButton("View PC 🖥️", callback_data=f"pc_{pc_card_id}")],
            [InlineKeyboardButton("View Cards 📚", callback_data="view_cards")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data.startswith("pc_"):
        pc_id = int(data.split("_")[1])
        pc_card = database.get_card(user_id, pc_id)
        
        if not pc_card or pc_card["category"] != "PC":
            await query.answer("PC not found!", show_alert=True)
            return
        
        components = pc_card.get("components", [])
        specs = pc_card.get("specs", {})
        
        # Get component cards
        component_cards = []
        for comp_id in components:
            comp_card = database.get_card(user_id, comp_id)
            if comp_card:
                component_cards.append(comp_card)
        
        rarity_emoji = gadgets.get_rarity_emoji(pc_card["rarity"])
        message = (
            f"{rarity_emoji} <b>{pc_card['gadget_name']}</b> ({pc_card['rarity']})\n\n"
            f"<b>Components:</b>\n"
        )
        
        if len(component_cards) > 0:
            message += f"• GPU: {component_cards[0]['gadget_name']}\n"
        if len(component_cards) > 1:
            message += f"• CPU: {component_cards[1]['gadget_name']}\n"
        if len(component_cards) > 2:
            message += f"• Motherboard: {component_cards[2]['gadget_name']}\n"
        
        message += (
            f"\n<b>Specifications:</b>\n"
            f"• RAM: {specs.get('ram', 'N/A')}\n"
            f"• Storage: {specs.get('storage', 'N/A')}\n"
            f"• PSU: {specs.get('psu', 'N/A')}\n"
            f"• Case: {specs.get('case', 'N/A')}\n\n"
            f"<b>Price:</b> {pc_card['purchase_price']} coins"
        )
        
        keyboard = []
        for i, comp_card in enumerate(component_cards):
            comp_type = ["GPU", "CPU", "Motherboard"][i]
            keyboard.append([InlineKeyboardButton(f"Eject {comp_type}: {comp_card['gadget_name'][:15]}", callback_data=f"eject_{pc_id}_{comp_card['card_id']}")])
        # Calculate PC sale price (115% of component total, then 85% when selling)
        components = pc_card.get("components", [])
        component_total = 0
        for comp_id in components:
            comp_card = database.get_card(user_id, comp_id)
            if comp_card:
                component_total += comp_card["purchase_price"]
        # Get spec price from PC price
        spec_price = pc_card["purchase_price"] - int(component_total * 1.15)
        component_total_with_specs = component_total + spec_price
        pc_sale_price = int(component_total_with_specs * 1.15 * 0.85)  # 15% premium, then 85% when selling
        
        keyboard.append([InlineKeyboardButton(f"💰 Sell PC ({pc_sale_price} coins)", callback_data=f"confirm_sell_pc_{pc_id}")])
        keyboard.append([InlineKeyboardButton("Back ↩️", callback_data="view_pcs")])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data.startswith("eject_"):
        parts = data.split("_")
        pc_id = int(parts[1])
        comp_id = int(parts[2])
        
        pc_card = database.get_card(user_id, pc_id)
        comp_card = database.get_card(user_id, comp_id)
        
        if not pc_card or not comp_card:
            await query.answer("Error: Card not found!", show_alert=True)
            return
        
        # Remove component from PC
        components = pc_card.get("components", [])
        if comp_id in components:
            components.remove(comp_id)
        
        # If no components left, remove PC
        if not components:
            database.remove_card(user_id, pc_id)
            message = (
                f"🔧 <b>Part Ejected!</b>\n\n"
                f"<b>{comp_card['gadget_name']}</b> has been returned to your collection.\n"
                f"The PC has been dismantled (no components remaining)."
            )
        else:
            database.update_card(user_id, pc_id, components=components)
            database.update_card(user_id, comp_id, in_pc=None)
            message = (
                f"🔧 <b>Part Ejected!</b>\n\n"
                f"<b>{comp_card['gadget_name']}</b> has been returned to your collection."
            )
        
        keyboard = [[InlineKeyboardButton("View Cards 📚", callback_data="view_cards")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data.startswith("confirm_sell_pc_"):
        pc_id = int(data.split("_")[3])
        pc_card = database.get_card(user_id, pc_id)
        
        if not pc_card or pc_card["category"] != "PC":
            await query.answer("PC not found!", show_alert=True)
            return
        
        # Calculate PC sale price (115% of component total, then 85% when selling)
        components = pc_card.get("components", [])
        component_total = 0
        for comp_id in components:
            comp_card = database.get_card(user_id, comp_id)
            if comp_card:
                component_total += comp_card["purchase_price"]
        # Get spec price from PC price
        spec_price = pc_card["purchase_price"] - int(component_total * 1.15)
        component_total_with_specs = component_total + spec_price
        pc_sale_price = int(component_total_with_specs * 1.15 * 0.85)  # 15% premium, then 85% when selling
        
        rarity_emoji = gadgets.get_rarity_emoji(pc_card["rarity"])
        message = (
            f"⚠️ <b>Confirm PC Sale</b>\n\n"
            f"{rarity_emoji} <b>{pc_card['gadget_name']}</b>\n"
            f"PC Price: {pc_card['purchase_price']} coins\n"
            f"Sale Price: {pc_sale_price} coins\n\n"
            f"All components will be returned to your collection.\n\n"
            f"Are you sure you want to sell this PC?"
        )
        
        keyboard = [
            [InlineKeyboardButton("✅ Yes, Sell", callback_data=f"sell_pc_{pc_id}")],
            [InlineKeyboardButton("❌ Cancel", callback_data=f"pc_{pc_id}")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data.startswith("sell_pc_"):
        pc_id = int(data.split("_")[2])
        pc_card = database.get_card(user_id, pc_id)
        
        if not pc_card or pc_card["category"] != "PC":
            await query.answer("PC not found!", show_alert=True)
            return
        
        # Calculate PC sale price (115% of component total, then 85% when selling)
        components = pc_card.get("components", [])
        component_total = 0
        for comp_id in components:
            comp_card = database.get_card(user_id, comp_id)
            if comp_card:
                component_total += comp_card["purchase_price"]
        # Get spec price from PC price
        spec_price = pc_card["purchase_price"] - int(component_total * 1.15)
        component_total_with_specs = component_total + spec_price
        sale_price = int(component_total_with_specs * 1.15 * 0.85)  # 15% premium, then 85% when selling
        
        # Eject all components first
        for comp_id in components:
            database.update_card(user_id, comp_id, in_pc=None)
        
        # Add coins
        new_balance = database.add_coins(user_id, sale_price)
        
        # Remove PC
        database.remove_card(user_id, pc_id)
        
        rarity_emoji = gadgets.get_rarity_emoji(pc_card["rarity"])
        message = (
            f"💰 <b>PC Sold!</b>\n\n"
            f"{rarity_emoji} <b>{pc_card['gadget_name']}</b>\n"
            f"PC Price: {pc_card['purchase_price']} coins\n"
            f"Sale Price: {sale_price} coins\n\n"
            f"All components have been returned to your collection.\n\n"
            f"<b>New Balance:</b> {new_balance} coins"
        )
        keyboard = [[InlineKeyboardButton("View Cards 📚", callback_data="view_cards")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")


def main():
    """Main function to run the bot."""
    # Create application
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Add command handlers
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("card", card_command))
    application.add_handler(CommandHandler("cards", cards_command))
    application.add_handler(CommandHandler("profile", profile_command))
    application.add_handler(CommandHandler("build", build_command))
    application.add_handler(CommandHandler("pc", pc_command))
    application.add_handler(CommandHandler("help", help_command))
    
    # Add callback query handler
    application.add_handler(CallbackQueryHandler(button_callback))
    
    # Initialize user gadgets on startup
    async def post_init(app: Application):
        await initialize_user(app)
    
    application.post_init = post_init
    
    # Run bot
    print("Bot is running...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()

