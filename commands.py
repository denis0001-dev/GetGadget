"""
Command handlers for the Telegram Gadget Card Bot.
"""

import os
import time
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes

import gadgets
import database
import messages
import utils
from config import RARITY_NAMES, RARITY_ORDER, GADGET_TYPE_GROUPS, GADGET_TYPE_ORDER


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /start command."""
    user_id = update.effective_user.id
    username = update.effective_user.username
    
    # Grant initial gadgets to @denis0001-dev if this is first time
    if update.effective_user.username == "denis0001-dev":
        await utils.grant_initial_gadgets(user_id)
    
    # Get user data
    user = database.get_user(user_id)
    coins = user["coins"]
    
    message = messages.get_start_message(coins)
    
    keyboard = [
        [InlineKeyboardButton("Получить Карточку 🎴", callback_data="get_card")],
        [InlineKeyboardButton("Мои Гаджеты 📚", callback_data="view_gadgets")],
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
    message = messages.get_card_display_message(gadget, card_id, title="🎴 <b>Ты получил новую карточку!</b> 🎉")
    
    keyboard = [
        [InlineKeyboardButton("Мои Гаджеты 📚", callback_data="view_gadgets")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Send with image
    photo_path = utils.IMAGE_PATHS["new_card"]
    if os.path.exists(photo_path):
        with open(photo_path, 'rb') as photo:
            await update.message.reply_photo(photo=photo, caption=message, reply_markup=reply_markup, parse_mode="HTML")
    else:
        await update.message.reply_text(message, reply_markup=reply_markup, parse_mode="HTML")


async def gadgets_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /gadgets command."""
    await show_gadgets(update, context)


async def show_gadgets(update: Update, context: ContextTypes.DEFAULT_TYPE, query=None):
    """Show gadget types menu."""
    from config import GADGET_TYPE_GROUPS, GADGET_TYPE_ORDER
    
    if query:
        user_id = query.from_user.id
        message_obj = query.message
    else:
        user_id = update.effective_user.id
        message_obj = update.message
    
    cards = database.get_user_cards(user_id)
    
    if not cards:
        message = "📭 У тебя пока нет гаджетов!\n\nИспользуй /card чтобы получить свою первую карточку! 🎴"
        keyboard = [[InlineKeyboardButton("Получить Карточку 🎴", callback_data="get_card")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await utils.send_or_edit_message(query, message_obj, message, reply_markup, photo_path=utils.IMAGE_PATHS["empty_collection"])
        return
    
    # Count cards by type (excluding parts in PC)
    type_counts = {}
    for card in cards:
        if card.get("in_pc") is not None:
            continue
        category = card["category"]
        for type_key, type_info in GADGET_TYPE_GROUPS.items():
            if category in type_info["categories"]:
                type_counts[type_key] = type_counts.get(type_key, 0) + 1
                break
    
    message = "📚 <b>Твоя Коллекция Гаджетов</b> 🎴\n\nВыбери тип гаджета:"
    
    # Create keyboard with buttons for each gadget type
    keyboard = []
    for type_key in GADGET_TYPE_ORDER:
        if type_key in type_counts:
            type_info = GADGET_TYPE_GROUPS[type_key]
            count = type_counts[type_key]
            button_text = f"{type_info['name']} ({count})"
            keyboard.append([InlineKeyboardButton(button_text, callback_data=f"gadget_type_{type_key}")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await utils.send_or_edit_message(query, message_obj, message, reply_markup, photo_path=utils.IMAGE_PATHS["gadgets"])


async def show_gadget_type_rarities(update: Update, context: ContextTypes.DEFAULT_TYPE, query, gadget_type: str):
    """Show rarities for a specific gadget type."""
    from config import GADGET_TYPE_GROUPS, RARITY_ORDER, RARITY_NAMES
    
    user_id = query.from_user.id
    cards = database.get_user_cards(user_id)
    
    type_info = GADGET_TYPE_GROUPS.get(gadget_type)
    if not type_info:
        await query.answer("Неизвестный тип гаджета! 😢", show_alert=True)
        return
    
    # Filter cards by type (excluding parts in PC)
    type_cards = [
        card for card in cards 
        if card["category"] in type_info["categories"] and card.get("in_pc") is None
    ]
    
    if not type_cards:
        await query.answer(f"Нет гаджетов типа {type_info['name']}! 😢", show_alert=True)
        return
    
    # Group by rarity
    cards_by_rarity = {}
    for card in type_cards:
        rarity = card["rarity"]
        if rarity not in cards_by_rarity:
            cards_by_rarity[rarity] = []
        cards_by_rarity[rarity].append(card)
    
    message = f"{type_info['name']}\n\nВыбери редкость:"
    
    # Create keyboard with buttons for each rarity
    keyboard = []
    for rarity in RARITY_ORDER:
        if rarity in cards_by_rarity:
            rarity_emoji = gadgets.get_rarity_emoji(rarity)
            rarity_ru = RARITY_NAMES.get(rarity, rarity)
            count = len(cards_by_rarity[rarity])
            button_text = f"{rarity_emoji} {rarity_ru} ({count})"
            keyboard.append([InlineKeyboardButton(button_text, callback_data=f"gadget_type_rarity_{gadget_type}_{rarity}")])
    
    keyboard.append([InlineKeyboardButton("Назад ↩️", callback_data="view_gadgets")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Use gadgets.png image for rarities menu
    await utils.send_or_edit_message(query, None, message, reply_markup, photo_path=utils.IMAGE_PATHS["gadgets"])


async def show_gadget_type_rarity_cards(update: Update, context: ContextTypes.DEFAULT_TYPE, query, gadget_type: str, rarity: str):
    """Show cards of a specific gadget type and rarity."""
    from config import GADGET_TYPE_GROUPS, RARITY_NAMES
    
    print(f"[DEBUG] show_gadget_type_rarity_cards called with: gadget_type={gadget_type}, rarity={rarity}")
    
    user_id = query.from_user.id
    cards = database.get_user_cards(user_id)
    print(f"[DEBUG] User has {len(cards)} total cards")
    
    type_info = GADGET_TYPE_GROUPS.get(gadget_type)
    if not type_info:
        print(f"[DEBUG] ERROR: Unknown gadget_type: {gadget_type}")
        await query.answer("Неизвестный тип гаджета! 😢", show_alert=True)
        return
    
    print(f"[DEBUG] Type info found: {type_info['name']}, categories: {type_info['categories']}")
    
    # Filter cards by type and rarity (excluding parts in PC)
    filtered_cards = [
        card for card in cards 
        if card["category"] in type_info["categories"] 
        and card["rarity"] == rarity 
        and card.get("in_pc") is None
    ]
    
    print(f"[DEBUG] Filtered cards: {len(filtered_cards)} cards found")
    for card in filtered_cards[:3]:  # Log first 3 cards
        print(f"[DEBUG]   - {card['gadget_name']} ({card['category']}, {card['rarity']})")
    
    if not filtered_cards:
        print(f"[DEBUG] No filtered cards found!")
        await query.answer("Нет гаджетов этой редкости! 😢", show_alert=True)
        return
    
    rarity_emoji = gadgets.get_rarity_emoji(rarity)
    rarity_ru = RARITY_NAMES.get(rarity, rarity)
    
    count = len(filtered_cards)
    message = f"{type_info['name']} - {rarity_emoji} {rarity_ru}\n\nВсего: {count}\n\nВыбери гаджет:"
    
    # Create keyboard with buttons for all cards
    keyboard = []
    row = []
    
    # Create shorter callback format to avoid Telegram's 64-byte limit
    # Format: vc_{card_id}_{type_short}_{rarity_short}
    # Short codes: phones=ph, tablets=tab, pcs=pc, pc_parts=pt, laptops=lap
    type_short = {
        "phones": "ph",
        "tablets": "tab", 
        "pcs": "pc",
        "pc_parts": "pt",
        "laptops": "lap"
    }.get(gadget_type, gadget_type[:2])
    
    # Short rarity codes: Trash=T, Common=C, Uncommon=U, Rare=R, Epic=E, Legendary=L, Mythic=M
    rarity_short = rarity[0] if rarity else "C"
    
    for card in filtered_cards:
        button_text = card['gadget_name']
        # Use shorter callback format: vc_{card_id}_{type}_{rarity}
        callback_data = f"vc_{card['card_id']}_{type_short}_{rarity_short}"
        
        # Check callback_data length (Telegram limit is 64 bytes)
        if len(callback_data.encode('utf-8')) > 64:
            # Fallback to just card_id if too long
            callback_data = f"vc_{card['card_id']}"
            print(f"Warning: callback_data too long, using fallback: {callback_data}")
        
        print(f"[DEBUG] Creating button: text='{button_text[:30]}...', callback_data='{callback_data}', length={len(callback_data.encode('utf-8'))} bytes")
        row.append(InlineKeyboardButton(button_text, callback_data=callback_data))
        if len(row) == 2:
            keyboard.append(row)
            row = []
    
    if row:
        keyboard.append(row)
    
    keyboard.append([InlineKeyboardButton("Назад ↩️", callback_data=f"gadget_type_{gadget_type}")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Use gadgets.png image for cards list menu
    await utils.send_or_edit_message(query, None, message, reply_markup, photo_path=utils.IMAGE_PATHS["gadgets"])


async def profile_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /profile command."""
    user_id = update.effective_user.id
    message = messages.get_profile_message(user_id)
    
    keyboard = [
        [InlineKeyboardButton("Мои Гаджеты 📚", callback_data="view_gadgets")],
        [InlineKeyboardButton("Назад ↩️", callback_data="back_to_start")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(message, reply_markup=reply_markup, parse_mode="HTML")


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle /help command."""
    message = messages.get_help_message()
    
    keyboard = [[InlineKeyboardButton("Назад ↩️", callback_data="back_to_start")]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(message, reply_markup=reply_markup, parse_mode="HTML")


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
            message = messages.get_missing_parts_message(missing_parts)
            
            keyboard = [
                [InlineKeyboardButton("Получить Карточку 🎴", callback_data="get_card")],
                [InlineKeyboardButton("🔄 Попробовать снова", callback_data="build_pc")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await utils.send_or_edit_message(query, message_obj, message, reply_markup)
            return
        
        # Step 1: Select GPU (all parts are available)
        
        message = "🖥️ <b>Сборка Кастомного ПК</b> 🔧\n\n<b>Шаг 1:</b> Выбери видеокарту"
        keyboard = []
        for card in parts["Graphics Card"]:
            rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
            button_text = f"{rarity_emoji} {card['gadget_name']}"
            keyboard.append([InlineKeyboardButton(button_text, callback_data=f"build_gpu_{card['card_id']}")])
        keyboard.append([InlineKeyboardButton("Отмена ❌", callback_data="view_gadgets")])
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await utils.send_or_edit_message(query, message_obj, message, reply_markup, photo_path=utils.IMAGE_PATHS["build_pc"])
        return
    
    if not selected_cpu:
        # Step 2: Select CPU (already checked at start, but double-check in case parts were removed)
        if not parts["Processor"]:
            message = messages.get_missing_parts_message(["процессоров"])
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
        
        # Use build-pc image
        photo_path = utils.IMAGE_PATHS["build_pc"]
        if os.path.exists(photo_path):
            from telegram import InputMediaPhoto
            with open(photo_path, 'rb') as photo:
                media = InputMediaPhoto(media=photo, caption=message, parse_mode="HTML")
                await query.edit_message_media(media=media, reply_markup=reply_markup)
        else:
            await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")
        return
    
    # Step 3: Select Motherboard (already checked at start, but double-check in case parts were removed)
    if not parts["Motherboard"]:
        message = messages.get_missing_parts_message(["материнских плат"])
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
    
    # Use build-pc image
    photo_path = utils.IMAGE_PATHS["build_pc"]
    if os.path.exists(photo_path):
        from telegram import InputMediaPhoto
        with open(photo_path, 'rb') as photo:
            media = InputMediaPhoto(media=photo, caption=message, parse_mode="HTML")
            await query.edit_message_media(media=media, reply_markup=reply_markup)
    else:
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
        
        await utils.send_or_edit_message(query, message_obj, message, reply_markup)
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
    keyboard.append([InlineKeyboardButton("Назад ↩️", callback_data="view_gadgets")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await utils.send_or_edit_message(query, message_obj, message, reply_markup)


async def show_pc_details(user_id: int, pc_card: dict, query, back_callback: str = "view_gadgets", show_back: bool = True, title: str = None):
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
    
    # Only show sell button if PC has all 3 components (full PC)
    if len(component_cards) == 3:
        # Calculate PC sale price
        pc_sale_price = utils.calculate_pc_sale_price(user_id, pc_card)
        keyboard.append([InlineKeyboardButton(f"💰 Продать ПК ({pc_sale_price} монет)", callback_data=f"confirm_sell_pc_{pc_card['card_id']}")])
    else:
        message += "\n\n⚠️ <b>Неполный ПК!</b> Продать можно только полный ПК со всеми компонентами."
    if show_back:
        keyboard.append([InlineKeyboardButton("Назад ↩️", callback_data=back_callback)])
    
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    # Use photo for PC details
    photo_path = utils.IMAGE_PATHS["pc"]
    if os.path.exists(photo_path):
        from telegram import InputMediaPhoto
        with open(photo_path, 'rb') as photo:
            media = InputMediaPhoto(media=photo, caption=message, parse_mode="HTML")
            await query.edit_message_media(media=media, reply_markup=reply_markup)
    else:
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode="HTML")

