"""
Utility functions for the Telegram Gadget Card Bot.
"""

import database


async def send_or_edit_message(query, message_obj, message, reply_markup=None, parse_mode="HTML"):
    """Helper to send or edit message based on whether query exists."""
    if query:
        await query.edit_message_text(message, reply_markup=reply_markup, parse_mode=parse_mode)
    else:
        await message_obj.reply_text(message, reply_markup=reply_markup, parse_mode=parse_mode)


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

