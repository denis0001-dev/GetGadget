"""
Configuration and constants for the Telegram Gadget Card Bot.
"""

import os
from dotenv import load_dotenv

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

# Rarity order (from lowest to highest)
RARITY_ORDER = ["Trash", "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic"]

# Gadget type groups
GADGET_TYPE_GROUPS = {
    "phones": {
        "name": "📱 Телефоны",
        "categories": ["Phone"]
    },
    "tablets": {
        "name": "📱 Планшеты",
        "categories": ["Tablet"]
    },
    "pcs": {
        "name": "🖥️ ПК",
        "categories": ["PC"]
    },
    "pc_parts": {
        "name": "🔧 Комплектующие ПК",
        "categories": ["Graphics Card", "Processor", "Motherboard"]
    },
    "laptops": {
        "name": "💻 Ноутбуки",
        "categories": ["Laptop"]
    }
}

# Gadget type order
GADGET_TYPE_ORDER = ["phones", "tablets", "pcs", "pc_parts", "laptops"]

