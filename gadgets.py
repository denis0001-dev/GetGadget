"""
Gadget catalog with all available gadgets and their properties.
"""

# Rarity levels
RARITY_TRASH = "Trash"
RARITY_COMMON = "Common"
RARITY_UNCOMMON = "Uncommon"
RARITY_RARE = "Rare"
RARITY_EPIC = "Epic"
RARITY_LEGENDARY = "Legendary"
RARITY_MYTHIC = "Mythic"

# Categories
CATEGORY_PHONE = "Phone"
CATEGORY_TABLET = "Tablet"
CATEGORY_LAPTOP = "Laptop"
CATEGORY_GRAPHICS_CARD = "Graphics Card"
CATEGORY_PROCESSOR = "Processor"
CATEGORY_MOTHERBOARD = "Motherboard"
CATEGORY_PC = "PC"

# All gadgets catalog
GADGETS = [
    # Phones
    {"name": "iPhone 6", "category": CATEGORY_PHONE, "price": 50, "rarity": RARITY_TRASH},
    {"name": "Samsung Galaxy S5", "category": CATEGORY_PHONE, "price": 40, "rarity": RARITY_TRASH},
    {"name": "iPhone 7", "category": CATEGORY_PHONE, "price": 60, "rarity": RARITY_TRASH},
    
    {"name": "iPhone 11", "category": CATEGORY_PHONE, "price": 300, "rarity": RARITY_TRASH},
    {"name": "Samsung Galaxy A54", "category": CATEGORY_PHONE, "price": 250, "rarity": RARITY_COMMON},
    {"name": "iPhone XR", "category": CATEGORY_PHONE, "price": 280, "rarity": RARITY_TRASH},
    
    {"name": "iPhone 12", "category": CATEGORY_PHONE, "price": 450, "rarity": RARITY_TRASH},
    {"name": "Google Pixel 6", "category": CATEGORY_PHONE, "price": 400, "rarity": RARITY_UNCOMMON},
    {"name": "Samsung Galaxy S20", "category": CATEGORY_PHONE, "price": 420, "rarity": RARITY_UNCOMMON},
    
    {"name": "iPhone 14", "category": CATEGORY_PHONE, "price": 650, "rarity": RARITY_TRASH},
    {"name": "Google Pixel 7", "category": CATEGORY_PHONE, "price": 550, "rarity": RARITY_RARE},
    {"name": "Samsung Galaxy S22", "category": CATEGORY_PHONE, "price": 600, "rarity": RARITY_RARE},
    
    {"name": "iPhone 15", "category": CATEGORY_PHONE, "price": 850, "rarity": RARITY_TRASH},
    {"name": "Samsung Galaxy S23", "category": CATEGORY_PHONE, "price": 800, "rarity": RARITY_EPIC},
    {"name": "Google Pixel 8", "category": CATEGORY_PHONE, "price": 700, "rarity": RARITY_EPIC},
    
    {"name": "iPhone 16 Pro Max", "category": CATEGORY_PHONE, "price": 1200, "rarity": RARITY_TRASH},
    {"name": "Samsung Galaxy S24 Ultra", "category": CATEGORY_PHONE, "price": 1100, "rarity": RARITY_LEGENDARY},
    {"name": "OnePlus 12", "category": CATEGORY_PHONE, "price": 900, "rarity": RARITY_LEGENDARY},
    
    {"name": "iPhone 17 Pro Max", "category": CATEGORY_PHONE, "price": 1500, "rarity": RARITY_TRASH},
    {"name": "Samsung Galaxy S25 Ultra", "category": CATEGORY_PHONE, "price": 1400, "rarity": RARITY_MYTHIC},
    
    # Tablets
    {"name": "iPad Air 2", "category": CATEGORY_TABLET, "price": 100, "rarity": RARITY_TRASH},
    {"name": "Samsung Galaxy Tab S2", "category": CATEGORY_TABLET, "price": 80, "rarity": RARITY_TRASH},
    
    {"name": "iPad (9th gen)", "category": CATEGORY_TABLET, "price": 300, "rarity": RARITY_COMMON},
    {"name": "Samsung Galaxy Tab A8", "category": CATEGORY_TABLET, "price": 200, "rarity": RARITY_COMMON},
    
    {"name": "iPad Air (4th gen)", "category": CATEGORY_TABLET, "price": 500, "rarity": RARITY_UNCOMMON},
    {"name": "Samsung Galaxy Tab S7", "category": CATEGORY_TABLET, "price": 450, "rarity": RARITY_UNCOMMON},
    
    {"name": "iPad Air (5th gen)", "category": CATEGORY_TABLET, "price": 600, "rarity": RARITY_RARE},
    {"name": "Samsung Galaxy Tab S8", "category": CATEGORY_TABLET, "price": 550, "rarity": RARITY_RARE},
    
    {"name": "iPad Pro 11\" M2", "category": CATEGORY_TABLET, "price": 900, "rarity": RARITY_EPIC},
    {"name": "Microsoft Surface Pro 9", "category": CATEGORY_TABLET, "price": 1000, "rarity": RARITY_EPIC},
    {"name": "Samsung Galaxy Tab S9", "category": CATEGORY_TABLET, "price": 800, "rarity": RARITY_EPIC},
    
    {"name": "iPad Pro 12.9\" M2", "category": CATEGORY_TABLET, "price": 1200, "rarity": RARITY_LEGENDARY},
    {"name": "Samsung Galaxy Tab S9 Ultra", "category": CATEGORY_TABLET, "price": 1100, "rarity": RARITY_LEGENDARY},
    
    {"name": "iPad Pro M4", "category": CATEGORY_TABLET, "price": 1400, "rarity": RARITY_MYTHIC},
    {"name": "Samsung Galaxy Tab S10 Ultra", "category": CATEGORY_TABLET, "price": 1300, "rarity": RARITY_MYTHIC},
    
    # Laptops
    {"name": "MacBook Air 2015", "category": CATEGORY_LAPTOP, "price": 200, "rarity": RARITY_TRASH},
    {"name": "Dell Inspiron 3000", "category": CATEGORY_LAPTOP, "price": 250, "rarity": RARITY_TRASH},
    
    {"name": "MacBook Air M1", "category": CATEGORY_LAPTOP, "price": 800, "rarity": RARITY_COMMON},
    {"name": "Dell Inspiron 15", "category": CATEGORY_LAPTOP, "price": 600, "rarity": RARITY_COMMON},
    
    {"name": "MacBook Pro M1", "category": CATEGORY_LAPTOP, "price": 1200, "rarity": RARITY_UNCOMMON},
    {"name": "Dell XPS 13 (2020)", "category": CATEGORY_LAPTOP, "price": 1000, "rarity": RARITY_UNCOMMON},
    
    {"name": "MacBook Pro M2", "category": CATEGORY_LAPTOP, "price": 1500, "rarity": RARITY_RARE},
    {"name": "Dell XPS 13 (2022)", "category": CATEGORY_LAPTOP, "price": 1300, "rarity": RARITY_RARE},
    
    {"name": "MacBook Pro M3", "category": CATEGORY_LAPTOP, "price": 1800, "rarity": RARITY_EPIC},
    {"name": "Lenovo ThinkPad X1 Carbon", "category": CATEGORY_LAPTOP, "price": 1600, "rarity": RARITY_EPIC},
    {"name": "MacBook Air M4", "category": CATEGORY_LAPTOP, "price": 1700, "rarity": RARITY_EPIC},
    
    {"name": "MacBook Pro M3 Max", "category": CATEGORY_LAPTOP, "price": 2500, "rarity": RARITY_LEGENDARY},
    {"name": "Razer Blade 18", "category": CATEGORY_LAPTOP, "price": 2800, "rarity": RARITY_LEGENDARY},
    {"name": "MacBook Pro M5", "category": CATEGORY_LAPTOP, "price": 2400, "rarity": RARITY_LEGENDARY},
    
    {"name": "MacBook Pro M5 Max", "category": CATEGORY_LAPTOP, "price": 3500, "rarity": RARITY_MYTHIC},
    
    # Graphics Cards
    {"name": "GTX 750 Ti", "category": CATEGORY_GRAPHICS_CARD, "price": 50, "rarity": RARITY_TRASH},
    {"name": "GTX 950", "category": CATEGORY_GRAPHICS_CARD, "price": 60, "rarity": RARITY_TRASH},
    
    {"name": "GTX 1050", "category": CATEGORY_GRAPHICS_CARD, "price": 100, "rarity": RARITY_COMMON},
    {"name": "GTX 1060", "category": CATEGORY_GRAPHICS_CARD, "price": 150, "rarity": RARITY_COMMON},
    {"name": "GTX 1650", "category": CATEGORY_GRAPHICS_CARD, "price": 120, "rarity": RARITY_COMMON},
    
    {"name": "GTX 1660", "category": CATEGORY_GRAPHICS_CARD, "price": 200, "rarity": RARITY_UNCOMMON},
    {"name": "GTX 1660 Super", "category": CATEGORY_GRAPHICS_CARD, "price": 220, "rarity": RARITY_UNCOMMON},
    {"name": "RTX 2060", "category": CATEGORY_GRAPHICS_CARD, "price": 250, "rarity": RARITY_UNCOMMON},
    
    {"name": "RTX 3060", "category": CATEGORY_GRAPHICS_CARD, "price": 350, "rarity": RARITY_RARE},
    {"name": "RTX 3060 Ti", "category": CATEGORY_GRAPHICS_CARD, "price": 400, "rarity": RARITY_RARE},
    {"name": "RTX 3070", "category": CATEGORY_GRAPHICS_CARD, "price": 500, "rarity": RARITY_RARE},
    
    {"name": "RTX 4070", "category": CATEGORY_GRAPHICS_CARD, "price": 600, "rarity": RARITY_EPIC},
    {"name": "RTX 4070 Ti", "category": CATEGORY_GRAPHICS_CARD, "price": 700, "rarity": RARITY_EPIC},
    {"name": "RTX 4080", "category": CATEGORY_GRAPHICS_CARD, "price": 900, "rarity": RARITY_EPIC},
    
    {"name": "RTX 4090", "category": CATEGORY_GRAPHICS_CARD, "price": 1500, "rarity": RARITY_LEGENDARY},
    {"name": "AMD RX 7900 XTX", "category": CATEGORY_GRAPHICS_CARD, "price": 1400, "rarity": RARITY_LEGENDARY},
    
    {"name": "RTX 5090", "category": CATEGORY_GRAPHICS_CARD, "price": 2000, "rarity": RARITY_MYTHIC},
    
    # Processors
    {"name": "Intel Core i5-4460", "category": CATEGORY_PROCESSOR, "price": 40, "rarity": RARITY_TRASH},
    {"name": "AMD FX-8350", "category": CATEGORY_PROCESSOR, "price": 50, "rarity": RARITY_TRASH},
    
    {"name": "AMD Ryzen 5 3600", "category": CATEGORY_PROCESSOR, "price": 150, "rarity": RARITY_COMMON},
    {"name": "Intel Core i5-10400", "category": CATEGORY_PROCESSOR, "price": 140, "rarity": RARITY_COMMON},
    
    {"name": "AMD Ryzen 5 5600X", "category": CATEGORY_PROCESSOR, "price": 200, "rarity": RARITY_UNCOMMON},
    {"name": "Intel Core i7-10700K", "category": CATEGORY_PROCESSOR, "price": 250, "rarity": RARITY_UNCOMMON},
    
    {"name": "AMD Ryzen 7 7700X", "category": CATEGORY_PROCESSOR, "price": 350, "rarity": RARITY_RARE},
    {"name": "Intel Core i7-13700K", "category": CATEGORY_PROCESSOR, "price": 380, "rarity": RARITY_RARE},
    
    {"name": "AMD Ryzen 9 7900X", "category": CATEGORY_PROCESSOR, "price": 500, "rarity": RARITY_EPIC},
    {"name": "Intel Core i9-13900K", "category": CATEGORY_PROCESSOR, "price": 550, "rarity": RARITY_EPIC},
    
    {"name": "AMD Ryzen 9 7950X", "category": CATEGORY_PROCESSOR, "price": 700, "rarity": RARITY_LEGENDARY},
    {"name": "Intel Core i9-14900K", "category": CATEGORY_PROCESSOR, "price": 750, "rarity": RARITY_LEGENDARY},
    
    {"name": "AMD Ryzen 9 9950X", "category": CATEGORY_PROCESSOR, "price": 900, "rarity": RARITY_MYTHIC},
    {"name": "Intel Core i9-15900K", "category": CATEGORY_PROCESSOR, "price": 950, "rarity": RARITY_MYTHIC},
    
    # Motherboards
    {"name": "ASUS H81M-K", "category": CATEGORY_MOTHERBOARD, "price": 40, "rarity": RARITY_TRASH},
    {"name": "MSI B85M-E45", "category": CATEGORY_MOTHERBOARD, "price": 45, "rarity": RARITY_TRASH},
    {"name": "ASRock A320M-HDV", "category": CATEGORY_MOTHERBOARD, "price": 50, "rarity": RARITY_TRASH},
    
    {"name": "ASUS B450M-A", "category": CATEGORY_MOTHERBOARD, "price": 80, "rarity": RARITY_COMMON},
    {"name": "MSI B460M Pro-VDH", "category": CATEGORY_MOTHERBOARD, "price": 85, "rarity": RARITY_COMMON},
    {"name": "Gigabyte H510M H", "category": CATEGORY_MOTHERBOARD, "price": 75, "rarity": RARITY_COMMON},
    {"name": "Biostar B250MHC", "category": CATEGORY_MOTHERBOARD, "price": 70, "rarity": RARITY_COMMON},
    
    {"name": "ASUS B550M-A", "category": CATEGORY_MOTHERBOARD, "price": 120, "rarity": RARITY_UNCOMMON},
    {"name": "MSI B560M Pro-VDH", "category": CATEGORY_MOTHERBOARD, "price": 130, "rarity": RARITY_UNCOMMON},
    {"name": "ASRock X570 Phantom Gaming 4", "category": CATEGORY_MOTHERBOARD, "price": 150, "rarity": RARITY_UNCOMMON},
    
    {"name": "ASUS B650M-A", "category": CATEGORY_MOTHERBOARD, "price": 180, "rarity": RARITY_RARE},
    {"name": "MSI Z690-A Pro", "category": CATEGORY_MOTHERBOARD, "price": 200, "rarity": RARITY_RARE},
    {"name": "Gigabyte X670 Gaming X", "category": CATEGORY_MOTHERBOARD, "price": 220, "rarity": RARITY_RARE},
    
    {"name": "ASUS B650E-F", "category": CATEGORY_MOTHERBOARD, "price": 280, "rarity": RARITY_EPIC},
    {"name": "MSI Z790-A Pro", "category": CATEGORY_MOTHERBOARD, "price": 300, "rarity": RARITY_EPIC},
    {"name": "ASRock X670E Steel Legend", "category": CATEGORY_MOTHERBOARD, "price": 320, "rarity": RARITY_EPIC},
    
    {"name": "ASUS X870E-E", "category": CATEGORY_MOTHERBOARD, "price": 400, "rarity": RARITY_LEGENDARY},
    {"name": "MSI Z890-A Pro", "category": CATEGORY_MOTHERBOARD, "price": 420, "rarity": RARITY_LEGENDARY},
    
    {"name": "ASUS X870E Extreme", "category": CATEGORY_MOTHERBOARD, "price": 600, "rarity": RARITY_MYTHIC},
    {"name": "MSI Z890 Godlike", "category": CATEGORY_MOTHERBOARD, "price": 650, "rarity": RARITY_MYTHIC},
]


def get_random_gadget():
    """Get a random gadget from the catalog with weighted rarity probabilities."""
    import random
    
    # Rarity probabilities (must add up to 100%)
    RARITY_PROBABILITIES = {
        RARITY_TRASH: 30,      # 30%
        RARITY_COMMON: 25,     # 25%
        RARITY_UNCOMMON: 20,   # 20%
        RARITY_RARE: 15,       # 15%
        RARITY_EPIC: 7,        # 7%
        RARITY_LEGENDARY: 2,   # 2%
        RARITY_MYTHIC: 1,      # 1%
    }
    
    # Group gadgets by rarity
    gadgets_by_rarity = {}
    for gadget in GADGETS:
        rarity = gadget["rarity"]
        if rarity not in gadgets_by_rarity:
            gadgets_by_rarity[rarity] = []
        gadgets_by_rarity[rarity].append(gadget)
    
    # Select rarity based on probabilities
    rarities = list(RARITY_PROBABILITIES.keys())
    weights = [RARITY_PROBABILITIES[r] for r in rarities]
    selected_rarity = random.choices(rarities, weights=weights, k=1)[0]
    
    # Select random gadget from the selected rarity
    if selected_rarity in gadgets_by_rarity and gadgets_by_rarity[selected_rarity]:
        return random.choice(gadgets_by_rarity[selected_rarity])
    
    # Fallback to completely random if something goes wrong
    return random.choice(GADGETS)


def get_gadget_by_name(name):
    """Get a gadget by its name."""
    for gadget in GADGETS:
        if gadget["name"] == name:
            return gadget
    return None


def get_rarity_emoji(rarity):
    """Get emoji for rarity level."""
    rarity_emojis = {
        RARITY_TRASH: "🗑️",
        RARITY_COMMON: "⚪",
        RARITY_UNCOMMON: "🟢",
        RARITY_RARE: "🔵",
        RARITY_EPIC: "🟣",
        RARITY_LEGENDARY: "🟠",
        RARITY_MYTHIC: "🔴",
    }
    return rarity_emojis.get(rarity, "⚪")


def get_rarity_value(rarity):
    """Get numeric value for rarity (for comparison)."""
    rarity_values = {
        RARITY_TRASH: 0,
        RARITY_COMMON: 1,
        RARITY_UNCOMMON: 2,
        RARITY_RARE: 3,
        RARITY_EPIC: 4,
        RARITY_LEGENDARY: 5,
        RARITY_MYTHIC: 6,
    }
    return rarity_values.get(rarity, 0)

