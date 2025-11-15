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

# Translation dictionaries
RARITY_NAMES = {
    "Trash": "Мусор",
    "Common": "Обычная",
    "Uncommon": "Необычная",
    "Rare": "Редкая",
    "Epic": "Эпическая",
    "Legendary": "Легендарная",
    "Mythic": "Мифическая"
}

CATEGORY_NAMES = {
    "Phone": "Телефон",
    "Tablet": "Планшет",
    "Laptop": "Ноутбук",
    "Graphics Card": "Видеокарта",
    "Processor": "Процессор",
    "Motherboard": "Материнская плата",
    "PC": "ПК"
}


# Helper functions to reduce code duplication

async def send_or_edit_message(query, message_obj, message, reply_markup=None, parse_mode="HTML"):
    """Helper to send or edit message based on whether query exists."""
    if query:
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode=parse_mode)
    else:
        await message_obj.reply_text(message, reply_markup=reply_markup, parse_mode=parse_mode)


def get_help_message():
    """Get the help message text."""
    return (
        "📖 <b>Команды Бота</b> 🤖\n\n"
        "<b>/start</b> - Приветствие и обзор бота\n"
        "<b>/card</b> - Получить случайную карточку гаджета\n"
        "<b>/cards</b> - Посмотреть свою коллекцию карточек\n"
        "<b>/profile</b> - Посмотреть профиль и статистику\n"
        "<b>/build</b> - Собрать кастомный ПК из деталей\n"
        "<b>/help</b> - Показать это сообщение помощи\n\n"
        "<b>💰 Система Монет:</b>\n"
        "• Начинаешь с 0 монет (но это не проблема!)\n"
        "• Зарабатывай монеты, продавая карточки\n"
        "• При продаже получаешь 85% от оригинальной цены (комиссия 15%)\n\n"
        "<b>🎴 Уровни Редкости:</b>\n"
        "🗑️ Мусор → ⚪ Обычная → 🟢 Необычная → 🔵 Редкая → 🟣 Эпическая → 🟠 Легендарная → 🔴 Мифическая\n\n"
        "<b>🖥️ Сборка ПК:</b>\n"
        "• Собирай видеокарты, процессоры и материнки\n"
        "• Используй /build чтобы собрать их в ПК\n"
        "• Характеристики ПК (ОЗУ, накопитель, БП, корпус) генерируются автоматически\n"
        "• Можешь вытащить детали из ПК в любой момент"
    )


def get_profile_message(user_id: int):
    """Get the profile message for a user."""
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
    
    return (
        f"👤 <b>Твой Профиль</b> 🎯\n\n"
        f"💰 <b>Монеты:</b> {coins}\n\n"
        f"📊 <b>Статистика:</b>\n"
        f"• Всего карточек: {total_cards} 🎴\n"
        f"• Собранных ПК: {pc_count} 🖥️\n"
        f"• Стоимость коллекции: {total_price} монет 💎"
    )


def get_start_message(coins: int):
    """Get the start/welcome message."""
    return (
        "🎮 <b>Добро пожаловать в Бот Карточек Гаджетов!</b>\n\n"
        "Собирай карточки гаджетов и собери свой ПК мечты! 🚀\n\n"
        "<b>💰 Система Монет:</b>\n"
        "• Начинаешь с 0 монет (но не расстраивайся!)\n"
        "• Зарабатывай монеты, продавая карточки\n"
        "• При продаже получаешь 85% от оригинальной цены (комиссия 15%)\n\n"
        "<b>🎴 Система Карточек:</b>\n"
        "• Получай случайные карточки командой /card\n"
        "• Смотри свою коллекцию через /cards\n"
        "• 7 уровней редкости: 🗑️ Мусор → ⚪ Обычная → 🟢 Необычная → 🔵 Редкая → 🟣 Эпическая → 🟠 Легендарная → 🔴 Мифическая\n\n"
        "<b>🖥️ Сборка ПК:</b>\n"
        "• Собирай видеокарты, процессоры и материнки\n"
        "• Создавай кастомные ПК через /build\n"
        "• Можешь вытащить детали из ПК в любой момент\n\n"
        f"<b>Твои Монеты:</b> {coins} 💰"
    )


def get_card_display_message(gadget: dict, card_id: int, title: str = None):
    """Get the card display message."""
    rarity_emoji = gadgets.get_rarity_emoji(gadget["rarity"])
    rarity_ru = RARITY_NAMES.get(gadget['rarity'], gadget['rarity'])
    category_ru = CATEGORY_NAMES.get(gadget['category'], gadget['category'])
    
    title_text = f"{title}\n\n" if title else ""
    return (
        f"{title_text}"
        f"<b>Название:</b> {gadget['name']}\n"
        f"<b>Категория:</b> {category_ru}\n"
        f"<b>Цена:</b> {gadget['price']} монет 💰\n"
        f"<b>Редкость:</b> {rarity_emoji} {rarity_ru}\n\n"
        f"ID карточки: {card_id}"
    )


def get_missing_parts_message(missing_parts: list):
    """Get message for missing PC parts."""
    if len(missing_parts) == 1:
        return f"😢 У тебя нет {missing_parts[0]}!\n\nСначала получи карточки через /card 🎴"
    elif len(missing_parts) == 2:
        return f"😢 У тебя нет {missing_parts[0]} и {missing_parts[1]}!\n\nСначала получи карточки через /card 🎴"
    else:
        return f"😢 У тебя нет {missing_parts[0]}, {missing_parts[1]} и {missing_parts[2]}!\n\nСначала получи карточки через /card 🎴"


def calculate_pc_sale_price(user_id: int, pc_card: dict):
    """Calculate PC sale price (115% of component total, then 85% when selling)."""
    components = pc_card.get("components", [])
    component_total = 0
    for comp_id in components:
        comp_card = database.get_card(user_id, comp_id)
        if comp_card:
            component_total += comp_card["purchase_price"]
    # Get spec price from PC price
    spec_price = pc_card["purchase_price"] - int(component_total * 1.15)
    component_total_with_specs = component_total + spec_price
    return int(component_total_with_specs * 1.15 * 0.85)  # 15% premium, then 85% when selling


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
    
    message = get_start_message(coins)
    
    keyboard = [
        [InlineKeyboardButton("Получить Карточку 🎴", callback_data="get_card")],
        [InlineKeyboardButton("Мои Карточки 📚", callback_data="view_cards")],
        [InlineKeyboardButton("Профиль 👤", callback_data="profile")],
        [InlineKeyboardButton("Собрать ПК 🖥️", callback_data="build_pc")],
        [InlineKeyboardButton("Помощь ❓", callback_data="help")]
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
    message = get_card_display_message(gadget, card_id, title="🎴 <b>Ты получил новую карточку!</b> 🎉")
    
    keyboard = [
        [InlineKeyboardButton("Мои Карточки 📚", callback_data="view_cards")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(message, reply_markup=reply_markup, parse_mode="HTML")


async def cards_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /cards command."""
    await show_cards(update, context)


async def show_cards(update: Update, context: ContextTypes.DEFAULT_TYPE, query=None):
    """Show user's cards grouped by rarity."""
    if query:
        user_id = query.from_user.id
        message_obj = query.message
    else:
        user_id = update.effective_user.id
        message_obj = update.message
    
    cards = database.get_user_cards(user_id)
    
    if not cards:
        message = "📭 У тебя пока нет карточек!\n\nИспользуй /card чтобы получить свою первую карточку! 🎴"
        keyboard = [[InlineKeyboardButton("Получить Карточку 🎴", callback_data="get_card")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await send_or_edit_message(query, message_obj, message, reply_markup)
        return
    
    # Group cards by rarity (including PCs, but excluding parts that are in a PC)
    cards_by_rarity = {}
    for card in cards:
        # Skip parts that are in a PC (they're only visible when viewing the PC)
        if card.get("in_pc") is not None:
            continue
        rarity = card["rarity"]
        if rarity not in cards_by_rarity:
            cards_by_rarity[rarity] = []
        cards_by_rarity[rarity].append(card)
    
    # Simple title message with padding to prevent button cropping
    message = "📚 <b>Твоя Коллекция Карточек</b> 🎴\n\nВыбери редкость чтобы посмотреть карточки:"
    
    # Create keyboard with buttons for each rarity
    keyboard = []
    # Order rarities from lowest to highest
    rarity_order = ["Trash", "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"]
    
    for rarity in rarity_order:
        if rarity in cards_by_rarity:
            rarity_emoji = gadgets.get_rarity_emoji(rarity)
            rarity_ru = RARITY_NAMES.get(rarity, rarity)
            count = len(cards_by_rarity[rarity])
            button_text = f"{rarity_emoji} {rarity_ru} ({count})"
            keyboard.append([InlineKeyboardButton(button_text, callback_data=f"rarity_{rarity}")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await send_or_edit_message(query, message_obj, message, reply_markup)


async def show_rarity_cards(update: Update, context: ContextTypes.DEFAULT_TYPE, query, rarity):
    """Show cards of a specific rarity."""
    user_id = query.from_user.id
    cards = database.get_user_cards(user_id)
    
    # Filter cards by rarity, but exclude parts that are in a PC
    rarity_cards = [card for card in cards if card["rarity"] == rarity and card.get("in_pc") is None]
    
    if not rarity_cards:
        await query.answer("Нет карточек этой редкости! 😢", show_alert=True)
        return
    
    rarity_emoji = gadgets.get_rarity_emoji(rarity)
    rarity_ru = RARITY_NAMES.get(rarity, rarity)
    
    # Simple title message with padding to prevent button cropping
    count = len(rarity_cards)
    message = f"{rarity_emoji} <b>{rarity_ru}</b> 🎴\n\nВсего карточек: {count}\n\nВыбери карточку для просмотра:"
    
    # Create keyboard with buttons for all available cards (not in PC)
    keyboard = []
    row = []
    for card in rarity_cards:
        card_emoji = "🖥️" if card["category"] == "PC" else rarity_emoji
        button_text = f"{card_emoji} {card['gadget_name'][:15]}"
        if len(button_text) > 20:
            button_text = button_text[:17] + "..."
        row.append(InlineKeyboardButton(button_text, callback_data=f"view_card_{card['card_id']}"))
        if len(row) == 2:
            keyboard.append(row)
            row = []
    
    if row:
        keyboard.append(row)
    
    keyboard.append([InlineKeyboardButton("Назад ↩️", callback_data="view_cards")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")


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
    
    # Check all parts upfront before asking user to select
    if not selected_gpu:
        missing_parts = []
        if not parts["Graphics Card"]:
            missing_parts.append("видеокарт")
        if not parts["Processor"]:
            missing_parts.append("процессоров")
        if not parts["Motherboard"]:
            missing_parts.append("материнских плат")
        
        if missing_parts:
            message = get_missing_parts_message(missing_parts)
            
            keyboard = [
                [InlineKeyboardButton("Получить Карточку 🎴", callback_data="get_card")],
                [InlineKeyboardButton("🔄 Попробовать снова", callback_data="build_pc")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await send_or_edit_message(query, message_obj, message, reply_markup)
            return
        
        # Step 1: Select GPU (all parts are available)
        
        message = "🖥️ <b>Сборка Кастомного ПК</b> 🔧\n\n<b>Шаг 1:</b> Выбери видеокарту"
        keyboard = []
        for card in parts["Graphics Card"]:
            rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
            button_text = f"{rarity_emoji} {card['gadget_name']}"
            keyboard.append([InlineKeyboardButton(button_text, callback_data=f"build_gpu_{card['card_id']}")])
        keyboard.append([InlineKeyboardButton("Отмена ❌", callback_data="view_cards")])
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await send_or_edit_message(query, message_obj, message, reply_markup)
        return
    
    if not selected_cpu:
        # Step 2: Select CPU (already checked at start, but double-check in case parts were removed)
        if not parts["Processor"]:
            message = get_missing_parts_message(["процессоров"])
            keyboard = [
                [InlineKeyboardButton("Получить Карточку 🎴", callback_data="get_card")],
                [InlineKeyboardButton("🔄 Попробовать снова", callback_data="build_pc")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.edit_message_text(message, reply_markup=reply_markup)
            return
        
        gpu_card = database.get_card(user_id, selected_gpu)
        message = f"🖥️ <b>Сборка Кастомного ПК</b> 🔧\n\n<b>Выбрана видеокарта:</b> {gpu_card['gadget_name']}\n\n<b>Шаг 2:</b> Выбери процессор"
        keyboard = []
        for card in parts["Processor"]:
            rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
            button_text = f"{rarity_emoji} {card['gadget_name']}"
            keyboard.append([InlineKeyboardButton(button_text, callback_data=f"build_cpu_{selected_gpu}_{card['card_id']}")])
        keyboard.append([InlineKeyboardButton("Назад ↩️", callback_data="build_pc")])
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
        return
    
    # Step 3: Select Motherboard (already checked at start, but double-check in case parts were removed)
    if not parts["Motherboard"]:
        message = get_missing_parts_message(["материнских плат"])
        keyboard = [
            [InlineKeyboardButton("Получить Карточку 🎴", callback_data="get_card")],
            [InlineKeyboardButton("🔄 Попробовать снова", callback_data="build_pc")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup)
        return
    
    gpu_card = database.get_card(user_id, selected_gpu)
    cpu_card = database.get_card(user_id, selected_cpu)
    message = (
        f"🖥️ <b>Сборка Кастомного ПК</b> 🔧\n\n"
        f"<b>Выбрана видеокарта:</b> {gpu_card['gadget_name']}\n"
        f"<b>Выбран процессор:</b> {cpu_card['gadget_name']}\n\n"
        f"<b>Шаг 3:</b> Выбери материнскую плату"
    )
    keyboard = []
    for card in parts["Motherboard"]:
        rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
        button_text = f"{rarity_emoji} {card['gadget_name']}"
        keyboard.append([InlineKeyboardButton(button_text, callback_data=f"build_mb_{selected_gpu}_{selected_cpu}_{card['card_id']}")])
    keyboard.append([InlineKeyboardButton("Назад ↩️", callback_data=f"build_cpu_{selected_gpu}")])
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")


async def show_pc_details(user_id: int, pc_card: dict, query, back_callback: str = "view_pcs", show_back: bool = True, title: str = None):
    """Reusable function to show PC details with eject buttons and sell option."""
    components = pc_card.get("components", [])
    specs = pc_card.get("specs", {})
    
    # Get component cards
    component_cards = []
    for comp_id in components:
        comp_card = database.get_card(user_id, comp_id)
        if comp_card:
            component_cards.append(comp_card)
    
    rarity_emoji = gadgets.get_rarity_emoji(pc_card["rarity"])
    rarity_ru = RARITY_NAMES.get(pc_card['rarity'], pc_card['rarity'])
    
    # Add title if provided
    title_text = f"{title}\n\n" if title else ""
    message = (
        f"{title_text}"
        f"{rarity_emoji} <b>{pc_card['gadget_name']}</b> ({rarity_ru})\n\n"
        f"<b>Компоненты:</b>\n"
    )
    
    if len(component_cards) > 0:
        message += f"• 🎮 Видеокарта: {component_cards[0]['gadget_name']}\n"
    if len(component_cards) > 1:
        message += f"• ⚡ Процессор: {component_cards[1]['gadget_name']}\n"
    if len(component_cards) > 2:
        message += f"• 🔌 Материнка: {component_cards[2]['gadget_name']}\n"
    
    message += (
        f"\n<b>Характеристики:</b>\n"
        f"• 💾 ОЗУ: {specs.get('ram', 'Н/Д')}\n"
        f"• 💿 Накопитель: {specs.get('storage', 'Н/Д')}\n"
        f"• 🔋 БП: {specs.get('psu', 'Н/Д')}\n"
        f"• 📦 Корпус: {specs.get('case', 'Н/Д')}\n\n"
        f"<b>Цена:</b> {pc_card['purchase_price']} монет 💰"
    )
    
    keyboard = []
    comp_types_ru = ["Видеокарта", "Процессор", "Материнка"]
    for i, comp_card in enumerate(component_cards):
        comp_type = comp_types_ru[i]
        keyboard.append([InlineKeyboardButton(f"🔧 Вытащить {comp_type}: {comp_card['gadget_name'][:12]}", callback_data=f"eject_{pc_card['card_id']}_{comp_card['card_id']}")])
    
    # Calculate PC sale price
    pc_sale_price = calculate_pc_sale_price(user_id, pc_card)
    
    keyboard.append([InlineKeyboardButton(f"💰 Продать ПК ({pc_sale_price} монет)", callback_data=f"confirm_sell_pc_{pc_card['card_id']}")])
    if show_back:
        keyboard.append([InlineKeyboardButton("Назад ↩️", callback_data=back_callback)])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")


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
        message = "🖥️ У тебя пока нет собранных ПК!\n\nИспользуй /build чтобы создать свой первый ПК! 🚀"
        keyboard = [[InlineKeyboardButton("Собрать ПК 🛠️", callback_data="build_pc")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await send_or_edit_message(query, message_obj, message, reply_markup)
        return
    
    message_parts = ["🖥️ <b>Твои Собранные ПК</b> 💻\n"]
    
    for pc in pcs:
        components = pc.get("components", [])
        specs = pc.get("specs", {})
        rarity_emoji = gadgets.get_rarity_emoji(pc["rarity"])
        rarity_ru = RARITY_NAMES.get(pc['rarity'], pc['rarity'])
        
        # Get component names
        component_names = []
        for comp_id in components:
            comp_card = database.get_card(user_id, comp_id)
            if comp_card:
                component_names.append(comp_card["gadget_name"])
        
        message_parts.append(
            f"\n{rarity_emoji} <b>{pc['gadget_name']}</b> ({rarity_ru})\n"
            f"💰 Цена: {pc['purchase_price']} монет\n"
            f"🎮 Видеокарта: {component_names[0] if len(component_names) > 0 else 'Н/Д'}\n"
            f"⚡ Процессор: {component_names[1] if len(component_names) > 1 else 'Н/Д'}\n"
            f"🔌 Материнка: {component_names[2] if len(component_names) > 2 else 'Н/Д'}\n"
            f"💾 ОЗУ: {specs.get('ram', 'Н/Д')}\n"
            f"💿 Накопитель: {specs.get('storage', 'Н/Д')}\n"
            f"🔋 БП: {specs.get('psu', 'Н/Д')}\n"
            f"📦 Корпус: {specs.get('case', 'Н/Д')}"
        )
    
    message = "\n".join(message_parts)
    
    # Create keyboard with buttons for each PC
    keyboard = []
    for pc in pcs:
        keyboard.append([InlineKeyboardButton(f"⚙️ {pc['gadget_name'][:18]}", callback_data=f"pc_{pc['card_id']}")])
    keyboard.append([InlineKeyboardButton("Назад ↩️", callback_data="view_cards")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await send_or_edit_message(query, message_obj, message, reply_markup)


async def profile_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /profile command."""
    user_id = update.effective_user.id
    message = get_profile_message(user_id)
    
    keyboard = [
        [InlineKeyboardButton("Мои Карточки 📚", callback_data="view_cards")],
        [InlineKeyboardButton("Назад ↩️", callback_data="back_to_start")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(message, reply_markup=reply_markup, parse_mode="HTML")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command."""
    message = get_help_message()
    
    keyboard = [[InlineKeyboardButton("Назад ↩️", callback_data="back_to_start")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(message, reply_markup=reply_markup, parse_mode="HTML")


async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks."""
    query = update.callback_query
    await query.answer()
    
    data = query.data
    user_id = query.from_user.id
    
    if data == "get_card":
        # Simulate /card command - send as new message
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
        
        message = get_card_display_message(gadget, card_id, title="🎴 <b>Ты получил новую карточку!</b> 🎉")
        # No buttons - cards menu only accessible via /cards command
        await query.message.reply_text(message, parse_mode="HTML")
    
    elif data == "view_cards":
        await show_cards(update, context, query)
    
    elif data.startswith("rarity_"):
        rarity = data.split("_", 1)[1]
        await show_rarity_cards(update, context, query, rarity)
    
    elif data == "profile":
        message = get_profile_message(user_id)
        
        keyboard = [
            [InlineKeyboardButton("Мои Карточки 📚", callback_data="view_cards")],
            [InlineKeyboardButton("Назад ↩️", callback_data="back_to_start")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data == "build_pc":
        await show_build_menu(update, context, query)
    
    elif data == "view_pcs":
        await show_pcs(update, context, query)
    
    elif data == "help":
        message = get_help_message()
        keyboard = [[InlineKeyboardButton("Назад ↩️", callback_data="back_to_start")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data == "back_to_start":
        user = database.get_user(user_id)
        coins = user["coins"]
        message = get_start_message(coins)
        keyboard = [
            [InlineKeyboardButton("Получить Карточку 🎴", callback_data="get_card")],
            [InlineKeyboardButton("Мои Карточки 📚", callback_data="view_cards")],
            [InlineKeyboardButton("Профиль 👤", callback_data="profile")],
            [InlineKeyboardButton("Собрать ПК 🖥️", callback_data="build_pc")],
            [InlineKeyboardButton("Помощь ❓", callback_data="help")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data.startswith("view_card_"):
        card_id = int(data.split("_")[2])
        card = database.get_card(user_id, card_id)
        
        if not card:
            await query.answer("Карточка не найдена! 😢", show_alert=True)
            return
        
        # If it's a PC, use the PC details view
        if card["category"] == "PC":
            await show_pc_details(user_id, card, query, back_callback="view_cards")
            return
        
        rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
        rarity_ru = RARITY_NAMES.get(card['rarity'], card['rarity'])
        category_ru = CATEGORY_NAMES.get(card['category'], card['category'])
        in_pc_indicator = "\n🔗 <b>Эта деталь находится в ПК</b>" if card.get("in_pc") else ""
        
        # Add title "You got a card"
        title = "🎴 <b>Ты получил карточку!</b> 🎉"
        message = (
            f"{title}\n\n"
            f"{rarity_emoji} <b>{card['gadget_name']}</b>\n\n"
            f"<b>Категория:</b> {category_ru}\n"
            f"<b>Редкость:</b> {rarity_ru}\n"
            f"<b>Цена:</b> {card['purchase_price']} монет 💰{in_pc_indicator}"
        )
        
        keyboard = []
        if card.get("in_pc") is None:  # Only show sell if not in PC
            sale_price = int(card["purchase_price"] * 0.85)
            keyboard.append([InlineKeyboardButton(f"💰 Продать ({sale_price} монет)", callback_data=f"confirm_sell_{card_id}")])
        # No back button - cards menu only accessible via /cards command
        
        reply_markup = InlineKeyboardMarkup(keyboard) if keyboard else None
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data.startswith("confirm_sell_"):
        card_id = int(data.split("_")[2])
        card = database.get_card(user_id, card_id)
        
        if not card:
            await query.answer("Карточка не найдена! 😢", show_alert=True)
            return
        
        if card.get("in_pc"):
            await query.answer("Нельзя продать деталь, которая в ПК! Сначала вытащи её.", show_alert=True)
            return
        
        # Show confirmation
        sale_price = int(card["purchase_price"] * 0.85)
        rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
        message = (
            f"⚠️ <b>Подтверждение Продажи</b>\n\n"
            f"{rarity_emoji} <b>{card['gadget_name']}</b>\n"
            f"Оригинальная цена: {card['purchase_price']} монет\n"
            f"Цена продажи: {sale_price} монет (85%)\n\n"
            f"Ты уверен, что хочешь продать эту карточку? 🤔"
        )
        
        keyboard = [
            [InlineKeyboardButton("✅ Да, продать", callback_data=f"sell_{card_id}")],
            [InlineKeyboardButton("❌ Отмена", callback_data=f"view_card_{card_id}")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data.startswith("sell_") and not data.startswith("sell_pc_"):
        card_id = int(data.split("_")[1])
        card = database.get_card(user_id, card_id)
        
        if not card:
            await query.answer("Карточка не найдена! 😢", show_alert=True)
            return
        
        if card.get("in_pc"):
            await query.answer("Нельзя продать деталь, которая в ПК! Сначала вытащи её.", show_alert=True)
            return
        
        # Calculate sale price (85% of original)
        sale_price = int(card["purchase_price"] * 0.85)
        
        # Add coins
        new_balance = database.add_coins(user_id, sale_price)
        
        # Remove card
        database.remove_card(user_id, card_id)
        
        rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
        message = (
            f"💰 <b>Карточка Продана!</b> 🎉\n\n"
            f"{rarity_emoji} <b>{card['gadget_name']}</b>\n"
            f"Оригинальная цена: {card['purchase_price']} монет\n"
            f"Цена продажи: {sale_price} монет (85%)\n\n"
            f"<b>Новый баланс:</b> {new_balance} монет 💰"
        )
        # No buttons - cards menu only accessible via /cards command
        await query.edit_message_text(message, parse_mode="HTML")
    
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
            await query.answer("Ошибка: Одна или несколько деталей не найдены! 😢", show_alert=True)
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
        rarity_ru = RARITY_NAMES.get(pc_rarity, pc_rarity)
        message = (
            f"🖥️ <b>ПК Успешно Собран!</b> 🎉\n\n"
            f"{rarity_emoji} <b>{pc_name}</b> ({rarity_ru})\n\n"
            f"<b>Компоненты:</b>\n"
            f"• 🎮 Видеокарта: {gpu_card['gadget_name']}\n"
            f"• ⚡ Процессор: {cpu_card['gadget_name']}\n"
            f"• 🔌 Материнка: {mb_card['gadget_name']}\n\n"
            f"<b>Характеристики:</b>\n"
            f"• 💾 ОЗУ: {specs['ram']}\n"
            f"• 💿 Накопитель: {specs['storage']}\n"
            f"• 🔋 БП: {specs['psu']}\n"
            f"• 📦 Корпус: {specs['case']}\n\n"
            f"<b>Общая Цена:</b> {total_price} монет 💰"
        )
        # Show PC details with same buttons but no back button, with title
        pc_card = database.get_card(user_id, pc_card_id)
        title = "🖥️ <b>Твой ПК Успешно Собран!</b> 🎉"
        await show_pc_details(user_id, pc_card, query, show_back=False, title=title)
    
    elif data.startswith("pc_"):
        pc_id = int(data.split("_")[1])
        pc_card = database.get_card(user_id, pc_id)
        
        if not pc_card or pc_card["category"] != "PC":
            await query.answer("ПК не найден! 😢", show_alert=True)
            return
        
        # Use reusable function
        await show_pc_details(user_id, pc_card, query, back_callback="view_pcs")
    
    elif data.startswith("eject_"):
        parts = data.split("_")
        pc_id = int(parts[1])
        comp_id = int(parts[2])
        
        pc_card = database.get_card(user_id, pc_id)
        comp_card = database.get_card(user_id, comp_id)
        
        if not pc_card or not comp_card:
            await query.answer("Ошибка: Карточка не найдена! 😢", show_alert=True)
            return
        
        # Remove component from PC
        components = pc_card.get("components", [])
        if comp_id in components:
            components.remove(comp_id)
        
        # If no components left, remove PC
        if not components:
            database.remove_card(user_id, pc_id)
            message = (
                f"🔧 <b>Деталь Вытащена!</b> 🎉\n\n"
                f"<b>{comp_card['gadget_name']}</b> возвращена в твою коллекцию.\n"
                f"ПК разобран (не осталось компонентов)."
            )
        else:
            database.update_card(user_id, pc_id, components=components)
            database.update_card(user_id, comp_id, in_pc=None)
            message = (
                f"🔧 <b>Деталь Вытащена!</b> 🎉\n\n"
                f"<b>{comp_card['gadget_name']}</b> возвращена в твою коллекцию."
            )
        
        # No buttons - cards menu only accessible via /cards command
        await query.edit_message_text(message, parse_mode="HTML")
    
    elif data.startswith("confirm_sell_pc_"):
        pc_id = int(data.split("_")[3])
        pc_card = database.get_card(user_id, pc_id)
        
        if not pc_card or pc_card["category"] != "PC":
            await query.answer("ПК не найден! 😢", show_alert=True)
            return
        
        # Calculate PC sale price
        pc_sale_price = calculate_pc_sale_price(user_id, pc_card)
        
        rarity_emoji = gadgets.get_rarity_emoji(pc_card["rarity"])
        message = (
            f"⚠️ <b>Подтверждение Продажи ПК</b>\n\n"
            f"{rarity_emoji} <b>{pc_card['gadget_name']}</b>\n"
            f"Цена ПК: {pc_card['purchase_price']} монет\n"
            f"Цена продажи: {pc_sale_price} монет\n\n"
            f"Все компоненты будут возвращены в твою коллекцию.\n\n"
            f"Ты уверен, что хочешь продать этот ПК? 🤔"
        )
        
        keyboard = [
            [InlineKeyboardButton("✅ Да, продать", callback_data=f"sell_pc_{pc_id}")],
            [InlineKeyboardButton("❌ Отмена", callback_data=f"pc_{pc_id}")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
    
    elif data.startswith("sell_pc_"):
        pc_id = int(data.split("_")[2])
        pc_card = database.get_card(user_id, pc_id)
        
        if not pc_card or pc_card["category"] != "PC":
            await query.answer("ПК не найден! 😢", show_alert=True)
            return
        
        # Calculate PC sale price
        sale_price = calculate_pc_sale_price(user_id, pc_card)
        
        # Eject all components first
        components = pc_card.get("components", [])
        for comp_id in components:
            database.update_card(user_id, comp_id, in_pc=None)
        
        # Add coins
        new_balance = database.add_coins(user_id, sale_price)
        
        # Remove PC
        database.remove_card(user_id, pc_id)
        
        rarity_emoji = gadgets.get_rarity_emoji(pc_card["rarity"])
        message = (
            f"💰 <b>ПК Продан!</b> 🎉\n\n"
            f"{rarity_emoji} <b>{pc_card['gadget_name']}</b>\n"
            f"Цена ПК: {pc_card['purchase_price']} монет\n"
            f"Цена продажи: {sale_price} монет\n\n"
            f"Все компоненты возвращены в твою коллекцию.\n\n"
            f"<b>Новый баланс:</b> {new_balance} монет 💰"
        )
        # No buttons - cards menu only accessible via /cards command
        await query.edit_message_text(message, parse_mode="HTML")


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

