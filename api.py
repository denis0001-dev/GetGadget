"""
FastAPI HTTP API for Telegram Mini App.
"""

import hashlib
import hmac
import json
import time
from typing import Dict, List, Optional
from urllib.parse import parse_qs, unquote

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import config
import database
import gadgets
import messages
import pc_generator
import utils
from config import RARITY_NAMES, CATEGORY_NAMES, GADGET_TYPE_GROUPS, GADGET_TYPE_ORDER


# Request/Response models
class InitDataRequest(BaseModel):
    initData: str


class DrawCardResponse(BaseModel):
    card: dict
    user: dict


class BuildPCRequest(BaseModel):
    gpu_id: int
    cpu_id: int
    mb_id: int


class EjectComponentRequest(BaseModel):
    pc_id: int
    component_id: int


class SellPCRequest(BaseModel):
    pc_id: int


class SellCardRequest(BaseModel):
    card_id: int


# Telegram Mini Apps init data validation
def validate_init_data(init_data: str, bot_token: str) -> Optional[Dict]:
    """
    Validate Telegram Mini App init data and extract user information.
    Returns user data dict if valid, None otherwise.
    """
    try:
        # Parse query string
        parsed = parse_qs(init_data)
        
        # Extract hash
        if 'hash' not in parsed or not parsed['hash']:
            return None
        hash_value = parsed['hash'][0]
        
        # Extract user data
        if 'user' not in parsed or not parsed['user']:
            return None
        user_data_str = parsed['user'][0]
        
        # Create data check string (all fields except hash, sorted alphabetically)
        data_check_array = []
        for key, value in parsed.items():
            if key != 'hash' and value:
                data_check_array.append(f"{key}={value[0]}")
        
        data_check_array.sort()
        data_check_string = '\n'.join(data_check_array)
        
        # Create secret key (HMAC SHA256)
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=bot_token.encode(),
            digestmod=hashlib.sha256
        ).digest()
        
        # Validate hash
        calculated_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        if calculated_hash != hash_value:
            return None
        
        # Parse user JSON
        user_data = json.loads(unquote(user_data_str))
        
        return user_data
    except Exception as e:
        print(f"Error validating init data: {e}")
        return None


# Get user from request
def get_user_from_request(request: Request) -> Optional[int]:
    """Extract and validate user from request headers/cookies."""
    # Get init data from Authorization header or custom header
    init_data = request.headers.get("X-Telegram-Init-Data") or request.headers.get("Authorization", "").replace("Bearer ", "")
    
    if not init_data:
        return None
    
    user_data = validate_init_data(init_data, config.BOT_TOKEN)
    if not user_data:
        return None
    
    user_id = user_data.get("id")
    
    # Check if user is banned
    if user_id and database.is_user_banned(user_id):
        raise HTTPException(status_code=403, detail="User is banned")
    
    return user_id


# Create FastAPI app
app = FastAPI(title="GetGadget API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://getgadgets.toolbox-io.ru",
        "https://web.telegram.org",
        "https://webk.telegram.org",
        "https://webz.telegram.org",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for images
app.mount("/images", StaticFiles(directory="images"), name="images")


@app.post("/api/v1/auth/init")
async def init_auth(request: InitDataRequest):
    """Initialize authentication with Telegram Mini App init data."""
    user_data = validate_init_data(request.initData, config.BOT_TOKEN)
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid init data")
    
    user_id = user_data.get("id")
    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user ID")
    
    # Check if user is banned
    if database.is_user_banned(user_id):
        raise HTTPException(status_code=403, detail="User is banned")
    
    # Initialize/update user in database
    db_user = database.get_user(user_id)
    
    # Grant initial gadgets if needed (for specific user)
    # This is handled in commands.py, but we can do it here too if needed
    
    return {
        "user_id": user_id,
        "user": db_user,
        "telegram_user": user_data
    }


@app.get("/api/v1/user")
async def get_user(request: Request):
    """Get current user data."""
    user_id = get_user_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user = database.get_user(user_id)
    cards = database.get_user_cards(user_id)
    
    # Calculate stats
    total_cards = len(cards)
    total_price = sum(card["purchase_price"] for card in cards)
    pcs = [c for c in cards if c["category"] == "PC"]
    pc_count = len(pcs)
    
    return {
        "user": user,
        "stats": {
            "total_cards": total_cards,
            "pc_count": pc_count,
            "total_price": total_price
        }
    }


@app.post("/api/v1/cards/draw")
async def draw_card(request: Request):
    """Draw a new card."""
    user_id = get_user_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
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
    
    # Get updated user
    user = database.get_user(user_id)
    
    # Get the full card data
    card = database.get_card(user_id, card_id)
    
    return {
        "card": card,
        "gadget": gadget,
        "user": user
    }


@app.get("/api/v1/cards")
async def get_cards(request: Request):
    """Get all user cards."""
    user_id = get_user_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    cards = database.get_user_cards(user_id)
    return {"cards": cards}


@app.get("/api/v1/cards/types")
async def get_card_types(request: Request):
    """Get card counts grouped by type."""
    user_id = get_user_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    cards = database.get_user_cards(user_id)
    
    # Count cards by type (excluding parts in PC)
    type_counts = {}
    for card in cards:
        if card.get("in_pc") is not None:
            continue
        category = card["category"]
        for type_key, type_info in GADGET_TYPE_GROUPS.items():
            if category in type_info["categories"]:
                if type_key not in type_counts:
                    type_counts[type_key] = {
                        "name": type_info["name"],
                        "total": 0,
                        "rarities": {}
                    }
                type_counts[type_key]["total"] += 1
                
                # Count by rarity
                rarity = card["rarity"]
                if rarity not in type_counts[type_key]["rarities"]:
                    type_counts[type_key]["rarities"][rarity] = 0
                type_counts[type_key]["rarities"][rarity] += 1
                break
    
    return {"types": type_counts}


@app.get("/api/v1/cards/by-type-rarity")
async def get_cards_by_type_rarity(request: Request, type: str, rarity: str):
    """Get cards filtered by type and rarity."""
    user_id = get_user_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    type_info = GADGET_TYPE_GROUPS.get(type)
    if not type_info:
        raise HTTPException(status_code=400, detail="Invalid type")
    
    cards = database.get_user_cards(user_id)
    
    # Filter cards by type and rarity (excluding parts in PC)
    filtered_cards = [
        card for card in cards 
        if card["category"] in type_info["categories"] 
        and card["rarity"] == rarity 
        and card.get("in_pc") is None
    ]
    
    return {"cards": filtered_cards}


@app.get("/api/v1/cards/{card_id}")
async def get_card_detail(request: Request, card_id: int):
    """Get a specific card by ID."""
    user_id = get_user_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    card = database.get_card(user_id, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    return {"card": card}


@app.post("/api/v1/cards/sell")
async def sell_card(request: Request, body: SellCardRequest):
    """Sell a card."""
    user_id = get_user_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    card = database.get_card(user_id, body.card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card.get("in_pc"):
        raise HTTPException(status_code=400, detail="Cannot sell card that is in a PC")
    
    # Calculate sale price (85% of original)
    sale_price = int(card["purchase_price"] * 0.85)
    
    # Add coins
    new_balance = database.add_coins(user_id, sale_price)
    
    # Remove card
    database.remove_card(user_id, body.card_id)
    
    return {
        "sale_price": sale_price,
        "new_balance": new_balance,
        "card": card
    }


@app.get("/api/v1/pcs")
async def get_pcs(request: Request):
    """Get all built PCs."""
    user_id = get_user_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    pcs = database.get_built_pcs(user_id)
    
    # Enrich with component names
    for pc in pcs:
        components = pc.get("components", [])
        component_names = []
        for comp_id in components:
            comp_card = database.get_card(user_id, comp_id)
            if comp_card:
                component_names.append({
                    "card_id": comp_id,
                    "name": comp_card["gadget_name"],
                    "category": comp_card["category"],
                    "rarity": comp_card["rarity"]
                })
        pc["component_details"] = component_names
    
    return {"pcs": pcs}


@app.get("/api/v1/pcs/{pc_id}")
async def get_pc_detail(request: Request, pc_id: int):
    """Get a specific PC by ID."""
    user_id = get_user_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    pc_card = database.get_card(user_id, pc_id)
    if not pc_card or pc_card["category"] != "PC":
        raise HTTPException(status_code=404, detail="PC not found")
    
    # Get component cards
    components = pc_card.get("components", [])
    component_details = []
    for comp_id in components:
        comp_card = database.get_card(user_id, comp_id)
        if comp_card:
            component_details.append(comp_card)
    
    pc_card["component_details"] = component_details
    
    return {"pc": pc_card}


@app.get("/api/v1/pcs/parts/available")
async def get_available_parts(request: Request):
    """Get available PC parts (not in a PC)."""
    user_id = get_user_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    parts = database.get_available_pc_parts(user_id)
    return {"parts": parts}


@app.post("/api/v1/pcs/build")
async def build_pc(request: Request, body: BuildPCRequest):
    """Build a PC from components."""
    user_id = get_user_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    # Get component cards
    gpu_card = database.get_card(user_id, body.gpu_id)
    cpu_card = database.get_card(user_id, body.cpu_id)
    mb_card = database.get_card(user_id, body.mb_id)
    
    if not all([gpu_card, cpu_card, mb_card]):
        raise HTTPException(status_code=404, detail="One or more components not found")
    
    # Check if components are already in a PC
    if any([gpu_card.get("in_pc"), cpu_card.get("in_pc"), mb_card.get("in_pc")]):
        raise HTTPException(status_code=400, detail="One or more components are already in a PC")
    
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
    database.update_card(user_id, pc_card_id, components=[body.gpu_id, body.cpu_id, body.mb_id], specs=specs)
    
    # Mark components as in PC
    database.update_card(user_id, body.gpu_id, in_pc=pc_card_id)
    database.update_card(user_id, body.cpu_id, in_pc=pc_card_id)
    database.update_card(user_id, body.mb_id, in_pc=pc_card_id)
    
    # Get the full PC card
    pc_card = database.get_card(user_id, pc_card_id)
    
    # Get component details
    components = pc_card.get("components", [])
    component_details = []
    for comp_id in components:
        comp_card = database.get_card(user_id, comp_id)
        if comp_card:
            component_details.append(comp_card)
    
    pc_card["component_details"] = component_details
    
    return {"pc": pc_card}


@app.post("/api/v1/pcs/eject")
async def eject_component(request: Request, body: EjectComponentRequest):
    """Eject a component from a PC."""
    user_id = get_user_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    pc_card = database.get_card(user_id, body.pc_id)
    comp_card = database.get_card(user_id, body.component_id)
    
    if not pc_card or not comp_card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Remove component from PC
    components = pc_card.get("components", [])
    if body.component_id not in components:
        raise HTTPException(status_code=400, detail="Component not in this PC")
    
    components.remove(body.component_id)
    
    # If no components left, remove PC
    if not components:
        database.remove_card(user_id, body.pc_id)
        pc_removed = True
    else:
        database.update_card(user_id, body.pc_id, components=components)
        pc_removed = False
    
    database.update_card(user_id, body.component_id, in_pc=None)
    
    return {
        "component": comp_card,
        "pc_removed": pc_removed,
        "remaining_components": components
    }


@app.post("/api/v1/pcs/sell")
async def sell_pc(request: Request, body: SellPCRequest):
    """Sell a PC."""
    user_id = get_user_from_request(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    pc_card = database.get_card(user_id, body.pc_id)
    
    if not pc_card or pc_card["category"] != "PC":
        raise HTTPException(status_code=404, detail="PC not found")
    
    # Check if PC has all components (can only sell full PC)
    components = pc_card.get("components", [])
    if len(components) != 3:
        raise HTTPException(status_code=400, detail="Cannot sell incomplete PC")
    
    # Calculate PC sale price
    sale_price = utils.calculate_pc_sale_price(user_id, pc_card)
    
    # Get component IDs before removal
    component_ids = components.copy()
    
    # Remove all components (they're sold with the PC)
    for comp_id in component_ids:
        database.remove_card(user_id, comp_id)
    
    # Add coins
    new_balance = database.add_coins(user_id, sale_price)
    
    # Remove PC
    database.remove_card(user_id, body.pc_id)
    
    return {
        "sale_price": sale_price,
        "new_balance": new_balance,
        "pc": pc_card
    }


def create_app():
    """Factory function to create the FastAPI app."""
    return app


