"""
Callback query handlers for the Telegram Gadget Card Bot.
"""

import os
import time
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, InputMediaPhoto
from telegram.ext import ContextTypes

import gadgets
import database
import pc_generator
import messages
import utils
from commands import show_gadgets, show_gadget_type_rarities, show_gadget_type_rarity_cards, show_build_menu, show_pcs, show_pc_details
from config import RARITY_NAMES, CATEGORY_NAMES


async def button_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handle button callbacks."""
    query = update.callback_query
    data = query.data
    user_id = query.from_user.id
    
    # Log all callbacks for debugging
    print(f"[DEBUG] Received callback: data='{data}', user_id={user_id}, length={len(data.encode('utf-8'))} bytes")
    
    await query.answer()
    
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
        
        message = messages.get_card_display_message(gadget, card_id, title="🎴 <b>Ты получил новую карточку!</b> 🎉")
        # Send with image
        photo_path = utils.IMAGE_PATHS["new_card"]
        if os.path.exists(photo_path):
            with open(photo_path, 'rb') as photo:
                await query.message.reply_photo(photo=photo, caption=message, parse_mode="HTML")
        else:
            await query.message.reply_text(message, parse_mode="HTML")
    
    elif data == "view_gadgets":
        await show_gadgets(update, context, query)
    
    elif data.startswith("gadget_type_"):
        print(f"[DEBUG] Processing gadget_type callback: {data}")
        if data.startswith("gadget_type_rarity_"):
            # Format: gadget_type_rarity_{type}_{rarity}
            # Example: gadget_type_rarity_phones_Common or gadget_type_rarity_pc_parts_Rare
            print(f"[DEBUG] Detected gadget_type_rarity_ format")
            # Remove "gadget_type_rarity_" prefix
            prefix = "gadget_type_rarity_"
            rest = data[len(prefix):]
            print(f"[DEBUG] Prefix length: {len(prefix)}, Rest after prefix: '{rest}'")
            
            # Try to find the rarity at the end (rarities are single words: Rare, Common, etc.)
            # Known rarities: Trash, Common, Uncommon, Rare, Epic, Legendary, Mythic
            known_rarities = ["Trash", "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"]
            
            # Find which rarity matches the end
            rarity = None
            gadget_type = None
            
            for known_rarity in known_rarities:
                if rest.endswith(f"_{known_rarity}"):
                    rarity = known_rarity
                    # Everything before the rarity is the gadget_type
                    gadget_type = rest[:-len(f"_{known_rarity}")]
                    break
            
            if rarity and gadget_type:
                print(f"[DEBUG] Extracted: gadget_type={gadget_type}, rarity={rarity}")
                print(f"[DEBUG] Calling show_gadget_type_rarity_cards...")
                try:
                    await show_gadget_type_rarity_cards(update, context, query, gadget_type, rarity)
                    print(f"[DEBUG] show_gadget_type_rarity_cards completed successfully")
                except Exception as e:
                    print(f"[DEBUG] ERROR in show_gadget_type_rarity_cards: {e}")
                    import traceback
                    traceback.print_exc()
                    await query.answer("Произошла ошибка при загрузке карточек! 😢", show_alert=True)
            else:
                print(f"[DEBUG] ERROR: Could not parse gadget_type and rarity from: {rest}")
                await query.answer("Ошибка: Неверный формат callback! 😢", show_alert=True)
        else:
            # Format: gadget_type_{type}
            # Example: gadget_type_phones
            print(f"[DEBUG] Detected gadget_type format (not rarity)")
            gadget_type = data.split("_", 2)[2]
            print(f"[DEBUG] Extracted gadget_type: {gadget_type}")
            await show_gadget_type_rarities(update, context, query, gadget_type)
    
    elif data == "profile":
        message = messages.get_profile_message(user_id)
        
        keyboard = [
            [InlineKeyboardButton("Мои Гаджеты 📚", callback_data="view_gadgets")],
            [InlineKeyboardButton("Назад ↩️", callback_data="back_to_start")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await utils.safe_edit_message(query, message, reply_markup, parse_mode="HTML")
    
    elif data == "build_pc":
        await show_build_menu(update, context, query)
    
    elif data == "view_pcs":
        await show_pcs(update, context, query)
    
    elif data == "help":
        message = messages.get_help_message()
        keyboard = [[InlineKeyboardButton("Назад ↩️", callback_data="back_to_start")]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await utils.safe_edit_message(query, message, reply_markup, parse_mode="HTML")
    
    elif data == "back_to_start":
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
        await utils.safe_edit_message(query, message, reply_markup, parse_mode="HTML")
    
    elif data.startswith("view_card_") or data.startswith("vc_"):
        print(f"[DEBUG] Processing view_card callback: {data}")
        # Parse callback data: 
        # Old format: view_card_{card_id} or view_card_{card_id}_{back_callback}
        # New format: vc_{card_id} or vc_{card_id}_{type_short}_{rarity_short}
        try:
            # Handle both old and new formats
            if data.startswith("view_card_"):
                # Old format - remove "view_card_" prefix
                rest = data[10:]  # len("view_card_") = 10
                print(f"[DEBUG] Old format detected, rest: {rest}")
            else:
                # New format - remove "vc_" prefix
                rest = data[3:]  # len("vc_") = 3
                print(f"[DEBUG] New format detected, rest: {rest}")
            
            # Find the first occurrence of underscore after card_id
            # Card ID is numeric, so we find where the number ends
            card_id_str = ""
            i = 0
            while i < len(rest) and rest[i].isdigit():
                card_id_str += rest[i]
                i += 1
            
            if not card_id_str:
                print(f"Error: Invalid callback format, no card_id found. data={data}")
                await query.answer("Ошибка: Неверный формат callback! 😢", show_alert=True)
                return
            
            card_id = int(card_id_str)
            print(f"[DEBUG] Extracted card_id: {card_id}")
            
            # Parse back_callback from new format: vc_{card_id}_{type_short}_{rarity_short}
            back_callback = None
            if i < len(rest) and rest[i] == "_":
                # New format: extract type and rarity
                parts = rest[i+1:].split("_", 1)
                print(f"[DEBUG] Parts after card_id: {parts}")
                if len(parts) >= 2:
                    type_short, rarity_short = parts[0], parts[1]
                    print(f"[DEBUG] type_short={type_short}, rarity_short={rarity_short}")
                    
                    # Map short codes back to full names
                    type_map = {
                        "ph": "phones",
                        "tab": "tablets",
                        "pc": "pcs", 
                        "pt": "pc_parts",
                        "lap": "laptops"
                    }
                    
                    # Map rarity short codes back
                    rarity_map = {
                        "T": "Trash",
                        "C": "Common",
                        "U": "Uncommon",
                        "R": "Rare",
                        "E": "Epic",
                        "L": "Legendary",
                        "M": "Mythic"
                    }
                    
                    gadget_type = type_map.get(type_short, type_short)
                    rarity = rarity_map.get(rarity_short, rarity_short)
                    back_callback = f"gadget_type_rarity_{gadget_type}_{rarity}"
                    print(f"[DEBUG] Mapped to: gadget_type={gadget_type}, rarity={rarity}, back_callback={back_callback}")
                elif len(parts) == 1:
                    # Old format - everything after card_id is back_callback
                    back_callback = rest[i+1:]
                    print(f"[DEBUG] Old format back_callback: {back_callback}")
        except (ValueError, IndexError) as e:
            print(f"Error parsing callback_data: {data}, error: {e}")
            await query.answer("Ошибка при обработке запроса! 😢", show_alert=True)
            return
        
        card = database.get_card(user_id, card_id)
        
        if not card:
            await query.answer("Карточка не найдена! 😢", show_alert=True)
            return
        
        # If it's a PC, use the PC details view
        if card["category"] == "PC":
            back = back_callback if back_callback else "view_gadgets"
            await show_pc_details(user_id, card, query, back_callback=back)
            return
        
        rarity_emoji = gadgets.get_rarity_emoji(card["rarity"])
        rarity_ru = RARITY_NAMES.get(card['rarity'], card['rarity'])
        category_ru = CATEGORY_NAMES.get(card['category'], card['category'])
        in_pc_indicator = "\n🔗 <b>Эта деталь находится в ПК</b>" if card.get("in_pc") else ""
        
        # Only show "You got a card" title if opened from get_card (no back_callback)
        # If opened from collection (has back_callback), don't show the title
        if back_callback:
            message = (
                f"{rarity_emoji} <b>{card['gadget_name']}</b>\n\n"
                f"<b>Категория:</b> {category_ru}\n"
                f"<b>Редкость:</b> {rarity_ru}\n"
                f"<b>Цена:</b> {card['purchase_price']} монет 💰{in_pc_indicator}"
            )
        else:
            # Opened from get_card - show title
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
        
        # Add back button if opened from collection
        if back_callback:
            keyboard.append([InlineKeyboardButton("Назад ↩️", callback_data=back_callback)])
        
        reply_markup = InlineKeyboardMarkup(keyboard) if keyboard else None
        
        # Show card with image when viewing from collection
        if back_callback:
            # Viewing from collection - show with card image
            photo_path = utils.IMAGE_PATHS["card_view"]
            if os.path.exists(photo_path):
                from telegram import InputMediaPhoto
                with open(photo_path, 'rb') as photo:
                    media = InputMediaPhoto(media=photo, caption=message, parse_mode="HTML")
                    await query.edit_message_media(media=media, reply_markup=reply_markup)
            else:
                # Fallback to text if image doesn't exist
                await utils.safe_edit_message(query, message, reply_markup, parse_mode="HTML", remove_media=True)
        else:
            # Opened from get_card - show with new card image
            photo_path = utils.IMAGE_PATHS["new_card"]
            if os.path.exists(photo_path):
                from telegram import InputMediaPhoto
                with open(photo_path, 'rb') as photo:
                    media = InputMediaPhoto(media=photo, caption=message, parse_mode="HTML")
                    await query.edit_message_media(media=media, reply_markup=reply_markup)
            else:
                # Fallback to text if image doesn't exist
                await utils.safe_edit_message(query, message, reply_markup, parse_mode="HTML", remove_media=True)
    
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
        
        # Try to preserve back callback from the original view_card call
        # We'll use a simple approach - just go back to view_gadgets
        keyboard = [
            [InlineKeyboardButton("✅ Да, продать", callback_data=f"sell_{card_id}")],
            [InlineKeyboardButton("❌ Отмена", callback_data=f"view_card_{card_id}")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await utils.safe_edit_message(query, message, reply_markup, parse_mode="HTML")
    
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
        # No buttons - cards menu only accessible via /gadgets command
        await utils.safe_edit_message(query, message, parse_mode="HTML")
    
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
        
        # No buttons - cards menu only accessible via /gadgets command
        await utils.safe_edit_message(query, message, parse_mode="HTML")
    
    elif data.startswith("confirm_sell_pc_"):
        pc_id = int(data.split("_")[3])
        pc_card = database.get_card(user_id, pc_id)
        
        if not pc_card or pc_card["category"] != "PC":
            await query.answer("ПК не найден! 😢", show_alert=True)
            return
        
        # Check if PC has all components (can only sell full PC)
        components = pc_card.get("components", [])
        if len(components) != 3:
            await query.answer("Неполный ПК! Продать можно только полный ПК со всеми компонентами. 😢", show_alert=True)
            return
        
        # Calculate PC sale price
        pc_sale_price = utils.calculate_pc_sale_price(user_id, pc_card)
        
        rarity_emoji = gadgets.get_rarity_emoji(pc_card["rarity"])
        message = (
            f"⚠️ <b>Подтверждение Продажи ПК</b>\n\n"
            f"{rarity_emoji} <b>{pc_card['gadget_name']}</b>\n"
            f"Цена ПК: {pc_card['purchase_price']} монет\n"
            f"Цена продажи: {pc_sale_price} монет\n\n"
            f"⚠️ <b>Внимание:</b> Все компоненты будут проданы вместе с ПК!\n\n"
            f"Ты уверен, что хочешь продать этот ПК? 🤔"
        )
        
        keyboard = [
            [InlineKeyboardButton("✅ Да, продать", callback_data=f"sell_pc_{pc_id}")],
            [InlineKeyboardButton("❌ Отмена", callback_data=f"pc_{pc_id}")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await utils.safe_edit_message(query, message, reply_markup, parse_mode="HTML")
    
    elif data.startswith("sell_pc_"):
        pc_id = int(data.split("_")[2])
        pc_card = database.get_card(user_id, pc_id)
        
        if not pc_card or pc_card["category"] != "PC":
            await query.answer("ПК не найден! 😢", show_alert=True)
            return
        
        # Check if PC has all components (can only sell full PC)
        components = pc_card.get("components", [])
        if len(components) != 3:
            await query.answer("Неполный ПК! Продать можно только полный ПК со всеми компонентами. 😢", show_alert=True)
            return
        
        # Get components list and PC info BEFORE any modifications
        components = components.copy()  # Make a copy to avoid issues
        pc_name = pc_card['gadget_name']
        pc_price = pc_card['purchase_price']
        pc_rarity = pc_card['rarity']
        
        # Calculate PC sale price (before modifications)
        sale_price = utils.calculate_pc_sale_price(user_id, pc_card)
        
        # Remove all components (they're sold with the PC)
        for comp_id in components:
            database.remove_card(user_id, comp_id)
        
        # Add coins
        new_balance = database.add_coins(user_id, sale_price)
        
        # Remove PC
        database.remove_card(user_id, pc_id)
        
        rarity_emoji = gadgets.get_rarity_emoji(pc_rarity)
        message = (
            f"💰 <b>ПК Продан!</b> 🎉\n\n"
            f"{rarity_emoji} <b>{pc_name}</b>\n"
            f"Цена ПК: {pc_price} монет\n"
            f"Цена продажи: {sale_price} монет\n\n"
            f"Все компоненты проданы вместе с ПК.\n\n"
            f"<b>Новый баланс:</b> {new_balance} монет 💰"
        )
        # No buttons - cards menu only accessible via /gadgets command
        await utils.safe_edit_message(query, message, parse_mode="HTML")

