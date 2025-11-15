"""
Utility functions for the Telegram Gadget Card Bot.
"""

import os
import database


# Image paths
IMAGES_DIR = "images"
IMAGE_PATHS = {
    "gadgets": os.path.join(IMAGES_DIR, "gadgets.png"),
    "empty_collection": os.path.join(IMAGES_DIR, "empty-collection.png"),
    "new_card": os.path.join(IMAGES_DIR, "new-card.png"),
    "build_pc": os.path.join(IMAGES_DIR, "build-pc.png"),
    "pc": os.path.join(IMAGES_DIR, "pc.png"),
    "card_view": os.path.join(IMAGES_DIR, "card.png"),  # Universal card image for viewing gadgets
}


async def send_or_edit_message(query, message_obj, message, reply_markup=None, parse_mode="HTML", photo_path=None):
    """Helper to send or edit message with optional photo."""
    if photo_path and os.path.exists(photo_path):
        if query:
            # For callbacks, we need to edit the message with media
            from telegram import InputMediaPhoto
            with open(photo_path, 'rb') as photo:
                media = InputMediaPhoto(media=photo, caption=message, parse_mode=parse_mode)
                # Try to edit as media (works even if current message is text)
                await query.edit_message_media(media=media, reply_markup=reply_markup)
        else:
            # For new messages, send photo with caption
            with open(photo_path, 'rb') as photo:
                await message_obj.reply_photo(photo=photo, caption=message, reply_markup=reply_markup, parse_mode=parse_mode)
    else:
        # Fallback to text only if no photo or photo doesn't exist
        if query:
            # Check if message has media by checking message attributes
            has_media = (query.message.photo is not None and len(query.message.photo) > 0) or \
                       query.message.video is not None or \
                       query.message.document is not None
            
            if has_media:
                # Message has media - try to edit caption first
                try:
                    await query.edit_message_caption(caption=message, reply_markup=reply_markup, parse_mode=parse_mode)
                except Exception:
                    # If caption edit fails, delete and resend as text
                    await query.message.delete()
                    await query.message.reply_text(message, reply_markup=reply_markup, parse_mode=parse_mode)
            else:
                # Message is text - edit normally
                await query.edit_message_text(message, reply_markup=reply_markup, parse_mode=parse_mode)
        else:
            await message_obj.reply_text(message, reply_markup=reply_markup, parse_mode=parse_mode)


async def safe_edit_message(query, message, reply_markup=None, parse_mode="HTML", remove_media=False):
    """Safely edit a message, handling both text and media messages.
    
    Args:
        remove_media: If True, remove media and send as text only (delete and resend)
    """
    # Check if message has media
    has_media = (query.message.photo is not None and len(query.message.photo) > 0) or \
                query.message.video is not None or \
                query.message.document is not None
    
    if has_media and remove_media:
        # Remove media and send as text - delete and resend
        await query.message.delete()
        await query.message.reply_text(message, reply_markup=reply_markup, parse_mode=parse_mode)
    elif has_media:
        # Message has media - try to edit caption
        try:
            await query.edit_message_caption(caption=message, reply_markup=reply_markup, parse_mode=parse_mode)
        except Exception:
            # If caption edit fails, delete and resend as text
            await query.message.delete()
            await query.message.reply_text(message, reply_markup=reply_markup, parse_mode=parse_mode)
    else:
        # Message is text - edit normally
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode=parse_mode)


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


async def grant_initial_gadgets(user_id: int):
    """Grant initial gadgets to user if they don't have them."""
    import gadgets
    from config import INIT_GADGETS
    
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

