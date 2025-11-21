"""
Database operations using JSON files for data persistence.
"""

import json
import os
import time
from typing import Dict, List, Optional

DATA_DIR = "data"
USERS_FILE = os.path.join(DATA_DIR, "users.json")
CARDS_FILE = os.path.join(DATA_DIR, "cards.json")
BANNED_USERS_FILE = os.path.join(DATA_DIR, "banned_users.json")


def ensure_data_dir():
    """Create data directory if it doesn't exist."""
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)


def load_users() -> Dict:
    """Load users data from JSON file."""
    ensure_data_dir()
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}


def save_users(users: Dict):
    """Save users data to JSON file."""
    ensure_data_dir()
    with open(USERS_FILE, 'w') as f:
        json.dump(users, f, indent=2)


def load_cards() -> Dict:
    """Load cards data from JSON file."""
    ensure_data_dir()
    if not os.path.exists(CARDS_FILE):
        return {}
    try:
        with open(CARDS_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}


def save_cards(cards: Dict):
    """Save cards data to JSON file."""
    ensure_data_dir()
    with open(CARDS_FILE, 'w') as f:
        json.dump(cards, f, indent=2)


def get_user(user_id: int) -> Dict:
    """Get user data, create if doesn't exist."""
    users = load_users()
    user_id_str = str(user_id)
    
    if user_id_str not in users:
        users[user_id_str] = {
            "coins": 0,
            "last_card_time": 0
        }
        save_users(users)
    
    return users[user_id_str]


def update_user(user_id: int, **kwargs):
    """Update user data."""
    users = load_users()
    user_id_str = str(user_id)
    
    if user_id_str not in users:
        users[user_id_str] = {"coins": 0, "last_card_time": 0}
    
    users[user_id_str].update(kwargs)
    save_users(users)


def add_coins(user_id: int, amount: int):
    """Add coins to user."""
    user = get_user(user_id)
    new_coins = user["coins"] + amount
    update_user(user_id, coins=new_coins)
    return new_coins


def get_user_cards(user_id: int) -> List[Dict]:
    """Get all cards for a user."""
    cards = load_cards()
    user_id_str = str(user_id)
    return cards.get(user_id_str, [])


def add_card(user_id: int, gadget_name: str, category: str, purchase_price: int, rarity: str) -> int:
    """Add a new card to user's collection. Returns card_id."""
    cards = load_cards()
    user_id_str = str(user_id)
    
    if user_id_str not in cards:
        cards[user_id_str] = []
    
    # Generate card_id (use timestamp + index for uniqueness)
    card_id = int(time.time() * 1000) + len(cards[user_id_str])
    
    new_card = {
        "card_id": card_id,
        "gadget_name": gadget_name,
        "category": category,
        "purchase_price": purchase_price,
        "rarity": rarity,
        "obtained_at": time.time(),
        "in_pc": None,
        "components": [],
        "specs": {}
    }
    
    cards[user_id_str].append(new_card)
    save_cards(cards)
    return card_id


def remove_card(user_id: int, card_id: int) -> bool:
    """Remove a card from user's collection. Returns True if removed."""
    cards = load_cards()
    user_id_str = str(user_id)
    
    if user_id_str not in cards:
        return False
    
    original_length = len(cards[user_id_str])
    cards[user_id_str] = [c for c in cards[user_id_str] if c["card_id"] != card_id]
    
    if len(cards[user_id_str]) < original_length:
        save_cards(cards)
        return True
    return False


def get_card(user_id: int, card_id: int) -> Optional[Dict]:
    """Get a specific card by ID."""
    cards = get_user_cards(user_id)
    for card in cards:
        if card["card_id"] == card_id:
            return card
    return None


def update_card(user_id: int, card_id: int, **kwargs):
    """Update card data."""
    cards = load_cards()
    user_id_str = str(user_id)
    
    if user_id_str not in cards:
        return False
    
    for card in cards[user_id_str]:
        if card["card_id"] == card_id:
            card.update(kwargs)
            save_cards(cards)
            return True
    return False


def get_available_pc_parts(user_id: int) -> Dict[str, List[Dict]]:
    """Get available PC parts (not in a PC) grouped by category."""
    cards = get_user_cards(user_id)
    parts = {
        "Graphics Card": [],
        "Processor": [],
        "Motherboard": []
    }
    
    for card in cards:
        if card["category"] in parts and card.get("in_pc") is None:
            parts[card["category"]].append(card)
    
    return parts


def get_built_pcs(user_id: int) -> List[Dict]:
    """Get all built PCs for a user."""
    cards = get_user_cards(user_id)
    return [card for card in cards if card["category"] == "PC"]


def user_has_gadget(user_id: int, gadget_name: str) -> bool:
    """Check if user already has a specific gadget."""
    cards = get_user_cards(user_id)
    for card in cards:
        if card["gadget_name"] == gadget_name:
            return True
    return False


def ban_user(user_id: int):
    """Ban a user by removing all their data from the database."""
    user_id_str = str(user_id)
    
    # Remove user from users.json
    users = load_users()
    if user_id_str in users:
        del users[user_id_str]
        save_users(users)
        print(f"   ✅ Removed user {user_id} from users database")
    
    # Remove all cards from cards.json
    cards = load_cards()
    if user_id_str in cards:
        card_count = len(cards[user_id_str])
        del cards[user_id_str]
        save_cards(cards)
        print(f"   ✅ Removed {card_count} cards for user {user_id}")
    
    return True


def clear_user_data(user_id: int):
    """Clear all data for a user (alias for ban_user)."""
    return ban_user(user_id)


def load_banned_users() -> Dict:
    """Load banned users data from JSON file."""
    ensure_data_dir()
    if not os.path.exists(BANNED_USERS_FILE):
        return {}
    try:
        with open(BANNED_USERS_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}


def save_banned_users(banned_users: Dict):
    """Save banned users data to JSON file."""
    ensure_data_dir()
    with open(BANNED_USERS_FILE, 'w') as f:
        json.dump(banned_users, f, indent=2)


def is_user_banned(user_id: int) -> bool:
    """Check if a user is banned."""
    banned_users = load_banned_users()
    user_id_str = str(user_id)
    return user_id_str in banned_users


def add_banned_user(user_id: int, username: str = None, reason: str = "Banned by admin"):
    """Add a user to the banned list."""
    banned_users = load_banned_users()
    user_id_str = str(user_id)
    
    banned_users[user_id_str] = {
        "user_id": user_id,
        "username": username,
        "reason": reason,
        "banned_at": time.time()
    }
    save_banned_users(banned_users)

