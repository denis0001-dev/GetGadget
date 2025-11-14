"""
PC specification generator based on component rarities.
"""

import random
from gadgets import (
    get_rarity_value, RARITY_TRASH, RARITY_COMMON, RARITY_UNCOMMON,
    RARITY_RARE, RARITY_EPIC, RARITY_LEGENDARY, RARITY_MYTHIC
)


def get_highest_rarity(rarities):
    """Get the highest rarity from a list of rarities."""
    highest_value = -1
    highest_rarity = RARITY_TRASH
    
    for rarity in rarities:
        value = get_rarity_value(rarity)
        if value > highest_value:
            highest_value = value
            highest_rarity = rarity
    
    return highest_rarity


def generate_ram(rarity):
    """Generate RAM specification based on rarity."""
    rarity_value = get_rarity_value(rarity)
    
    if rarity_value <= get_rarity_value(RARITY_COMMON):
        return "8GB DDR4"
    elif rarity_value <= get_rarity_value(RARITY_RARE):
        return "16GB DDR4"
    elif rarity_value == get_rarity_value(RARITY_EPIC):
        return "32GB DDR5"
    elif rarity_value == get_rarity_value(RARITY_LEGENDARY):
        return "32GB DDR5"
    else:  # Mythic
        return "64GB DDR5"


def generate_storage(rarity):
    """Generate storage specification based on rarity."""
    rarity_value = get_rarity_value(rarity)
    
    if rarity_value <= get_rarity_value(RARITY_COMMON):
        return "256GB SATA SSD"
    elif rarity_value <= get_rarity_value(RARITY_RARE):
        return "512GB NVMe SSD"
    elif rarity_value == get_rarity_value(RARITY_EPIC):
        return "1TB NVMe SSD"
    elif rarity_value == get_rarity_value(RARITY_LEGENDARY):
        return "2TB NVMe SSD"
    else:  # Mythic
        return "2TB+ NVMe SSD"


def generate_psu(rarity):
    """Generate PSU specification based on rarity."""
    rarity_value = get_rarity_value(rarity)
    
    if rarity_value <= get_rarity_value(RARITY_COMMON):
        return "500W 80+ Bronze"
    elif rarity_value <= get_rarity_value(RARITY_RARE):
        return "750W 80+ Gold"
    elif rarity_value == get_rarity_value(RARITY_EPIC):
        return "850W 80+ Gold"
    elif rarity_value == get_rarity_value(RARITY_LEGENDARY):
        return "1000W 80+ Platinum"
    else:  # Mythic
        return "1200W 80+ Titanium"


def generate_case(rarity):
    """Generate case specification based on rarity."""
    rarity_value = get_rarity_value(rarity)
    
    if rarity_value <= get_rarity_value(RARITY_COMMON):
        return "Budget ATX Case"
    elif rarity_value <= get_rarity_value(RARITY_RARE):
        return "Mid-Tower ATX Case"
    elif rarity_value == get_rarity_value(RARITY_EPIC):
        return "Full-Tower ATX Case"
    elif rarity_value == get_rarity_value(RARITY_LEGENDARY):
        return "Premium Full-Tower Case"
    else:  # Mythic
        return "Ultimate Premium Case"


def calculate_spec_price(ram, storage, psu, case):
    """Calculate total price for generated specs."""
    price = 0
    
    # RAM pricing
    if "8GB" in ram:
        price += 40
    elif "16GB" in ram:
        price += 80
    elif "32GB" in ram:
        price += 150
    elif "64GB" in ram:
        price += 300
    
    # Storage pricing
    if "256GB" in storage:
        price += 30
    elif "512GB" in storage:
        price += 60
    elif "1TB" in storage:
        price += 100
    elif "2TB" in storage:
        price += 180
    
    # PSU pricing
    if "500W" in psu:
        price += 50
    elif "750W" in psu:
        price += 100
    elif "850W" in psu:
        price += 130
    elif "1000W" in psu:
        price += 200
    elif "1200W" in psu:
        price += 300
    
    # Case pricing
    if "Budget" in case:
        price += 40
    elif "Mid-Tower" in case:
        price += 80
    elif "Full-Tower" in case and "Premium" not in case:
        price += 120
    elif "Premium" in case:
        price += 200
    
    return price


def generate_pc_specs(gpu_rarity, cpu_rarity, motherboard_rarity):
    """Generate PC specifications based on component rarities."""
    # Use highest rarity for spec generation
    highest_rarity = get_highest_rarity([gpu_rarity, cpu_rarity, motherboard_rarity])
    
    ram = generate_ram(highest_rarity)
    storage = generate_storage(highest_rarity)
    psu = generate_psu(highest_rarity)
    case = generate_case(highest_rarity)
    
    specs = {
        "ram": ram,
        "storage": storage,
        "psu": psu,
        "case": case
    }
    
    spec_price = calculate_spec_price(ram, storage, psu, case)
    
    return specs, highest_rarity, spec_price

