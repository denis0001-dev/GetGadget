"""
FastAPI server for Telegram Mini App backend.
"""

import hashlib
import hmac
import json
import os
import time
from typing import Optional, List, Dict
from urllib.parse import parse_qsl

from fastapi import FastAPI, HTTPException, Depends, Header, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import config
import database
import gadgets
import pc_generator
from config import RARITY_NAMES, CATEGORY_NAMES

app = FastAPI(title="GetGadget API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Will be restricted to GitHub Pages URL later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_telegram_webapp_data(init_data: str) -> Optional[Dict]:
    """
    Verify Telegram Web App init data.
    Returns user data if valid, None otherwise.
    """
    try:
        # Parse init data
        parsed_data = dict(parse_qsl(init_data))
        
        # Get hash from data
        received_hash = parsed_data.pop('hash', '')
        
        # Create data check string
        data_check_string = '\n'.join(
            f"{k}={v}" for k, v in sorted(parsed_data.items())
        )
        
        # Calculate secret key
        secret_key = hmac.new(
            "WebAppData".encode(),
            config.BOT_TOKEN.encode(),
            hashlib.sha256
        ).digest()
        
        # Calculate hash
        calculated_hash = hmac.new(
            secret_key,
            data_check_string.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Verify hash
        if calculated_hash != received_hash:
            return None
        
        # Parse user data
        if 'user' in parsed_data:
            user_data = json.loads(parsed_data['user'])
            return user_data
        
        return None
    except Exception as e:
        print(f"Error verifying Telegram data: {e}")
        return None


def get_user_from_header(x_init_data: Optional[str] = Header(None)) -> Dict:
    """Extract and verify user from Telegram Web App init data."""
    if not x_init_data:
        raise HTTPException(status_code=401, detail="Missing init data")
    
    user_data = verify_telegram_webapp_data(x_init_data)
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid init data")
    
    user_id = user_data.get('id')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user data")
    
    return {"user_id": user_id, "user_data": user_data}


# Pydantic models
class BuildPCRequest(BaseModel):
    gpu_id: int
    cpu_id: int
    mb_id: int


class TradeOfferRequest(BaseModel):
    to_user_id: int
    offered_cards: List[int]
    requested_cards: List[int]
    coins: int = 0


# API Endpoints

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}


@app.get("/api/user/{user_id}")
async def get_user_profile(user_id: int):
    """Get user profile."""
    user = database.get_user(user_id)
    cards = database.get_user_cards(user_id)
    pcs = database.get_built_pcs(user_id)
    
    return {
        "user_id": user_id,
        "coins": user["coins"],
        "total_cards": len(cards),
        "total_pcs": len(pcs),
        "last_card_time": user.get("last_card_time", 0)
    }


@app.get("/api/user/{user_id}/cards")
async def get_user_cards(user_id: int, available_only: bool = False):
    """Get user's cards."""
    cards = database.get_user_cards(user_id)
    
    if available_only:
        # Filter out cards that are in PC
        cards = [c for c in cards if c.get("in_pc") is None]
    
    return {"cards": cards}


@app.get("/api/user/{user_id}/cards/{card_id}")
async def get_card(user_id: int, card_id: int):
    """Get specific card."""
    card = database.get_card(user_id, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@app.post("/api/user/{user_id}/cards")
async def get_new_card(user_id: int):
    """Get a new random card."""
    gadget = gadgets.get_random_gadget()
    card_id = database.add_card(
        user_id,
        gadget["name"],
        gadget["category"],
        gadget["price"],
        gadget["rarity"]
    )
    database.update_user(user_id, last_card_time=time.time())
    
    card = database.get_card(user_id, card_id)
    return card


@app.get("/api/user/{user_id}/pcs")
async def get_user_pcs(user_id: int):
    """Get user's built PCs."""
    pcs = database.get_built_pcs(user_id)
    return {"pcs": pcs}


@app.post("/api/user/{user_id}/build-pc")
async def build_pc(user_id: int, request: BuildPCRequest):
    """Build a PC from components."""
    # Get component cards
    gpu_card = database.get_card(user_id, request.gpu_id)
    cpu_card = database.get_card(user_id, request.cpu_id)
    mb_card = database.get_card(user_id, request.mb_id)
    
    if not all([gpu_card, cpu_card, mb_card]):
        raise HTTPException(status_code=404, detail="One or more components not found")
    
    # Check if components are available (not in PC)
    if any(card.get("in_pc") is not None for card in [gpu_card, cpu_card, mb_card]):
        raise HTTPException(status_code=400, detail="One or more components are already in a PC")
    
    # Check categories
    if gpu_card["category"] != "Graphics Card":
        raise HTTPException(status_code=400, detail="Invalid GPU")
    if cpu_card["category"] != "Processor":
        raise HTTPException(status_code=400, detail="Invalid CPU")
    if mb_card["category"] != "Motherboard":
        raise HTTPException(status_code=400, detail="Invalid Motherboard")
    
    # Generate PC specs
    specs, pc_rarity, spec_price = pc_generator.generate_pc_specs(
        gpu_card["rarity"],
        cpu_card["rarity"],
        mb_card["rarity"]
    )
    
    # Calculate total price
    component_total = gpu_card["purchase_price"] + cpu_card["purchase_price"] + mb_card["purchase_price"] + spec_price
    total_price = int(component_total * 1.15)  # 15% premium
    
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
    database.update_card(user_id, pc_card_id, components=[request.gpu_id, request.cpu_id, request.mb_id], specs=specs)
    
    # Mark components as in PC
    database.update_card(user_id, request.gpu_id, in_pc=pc_card_id)
    database.update_card(user_id, request.cpu_id, in_pc=pc_card_id)
    database.update_card(user_id, request.mb_id, in_pc=pc_card_id)
    
    # Return PC card
    pc_card = database.get_card(user_id, pc_card_id)
    return pc_card


@app.post("/api/user/{user_id}/cards/{card_id}/sell")
async def sell_card(user_id: int, card_id: int):
    """Sell a card."""
    card = database.get_card(user_id, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    if card.get("in_pc") is not None:
        raise HTTPException(status_code=400, detail="Cannot sell card that is in a PC")
    
    # Calculate sale price (85% of original)
    sale_price = int(card["purchase_price"] * 0.85)
    
    # Add coins
    new_balance = database.add_coins(user_id, sale_price)
    
    # Remove card
    database.remove_card(user_id, card_id)
    
    return {
        "sale_price": sale_price,
        "new_balance": new_balance,
        "card": card
    }


@app.post("/api/user/{user_id}/pcs/{pc_id}/sell")
async def sell_pc(user_id: int, pc_id: int):
    """Sell a PC."""
    pc_card = database.get_card(user_id, pc_id)
    if not pc_card or pc_card["category"] != "PC":
        raise HTTPException(status_code=404, detail="PC not found")
    
    # Check if PC has all components
    components = pc_card.get("components", [])
    if len(components) != 3:
        raise HTTPException(status_code=400, detail="Can only sell complete PCs")
    
    # Calculate sale price
    component_total = 0
    for comp_id in components:
        comp_card = database.get_card(user_id, comp_id)
        if comp_card:
            component_total += comp_card["purchase_price"]
    
    specs = pc_card.get("specs", {})
    spec_price = pc_card["purchase_price"] - int(component_total * 1.15)
    component_total_with_specs = component_total + spec_price
    sale_price = int(component_total_with_specs * 1.15 * 0.85)
    
    # Remove all components
    for comp_id in components:
        database.remove_card(user_id, comp_id)
    
    # Add coins
    new_balance = database.add_coins(user_id, sale_price)
    
    # Remove PC
    database.remove_card(user_id, pc_id)
    
    return {
        "sale_price": sale_price,
        "new_balance": new_balance,
        "pc": pc_card
    }


@app.post("/api/user/{user_id}/pcs/{pc_id}/eject")
async def eject_component(user_id: int, pc_id: int, component_id: int = Query(...)):
    """Eject a component from a PC."""
    pc_card = database.get_card(user_id, pc_id)
    comp_card = database.get_card(user_id, component_id)
    
    if not pc_card or not comp_card:
        raise HTTPException(status_code=404, detail="PC or component not found")
    
    # Check if component is in this PC
    components = pc_card.get("components", [])
    if component_id not in components:
        raise HTTPException(status_code=400, detail="Component not in this PC")
    
    # Remove component from PC
    components.remove(component_id)
    
    # If no components left, remove PC
    if not components:
        database.remove_card(user_id, pc_id)
        return {"message": "PC disassembled", "pc_removed": True}
    else:
        database.update_card(user_id, pc_id, components=components)
        database.update_card(user_id, component_id, in_pc=None)
        return {"message": "Component ejected", "pc_removed": False}


@app.get("/api/user/{user_id}/pc-parts")
async def get_available_pc_parts(user_id: int):
    """Get available PC parts for building."""
    parts = database.get_available_pc_parts(user_id)
    return parts


# Trading endpoints
TRADES_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "trades.json")


def load_trades() -> Dict:
    """Load trades data from JSON file."""
    if not os.path.exists(TRADES_FILE):
        return {}
    try:
        with open(TRADES_FILE, 'r') as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return {}


def save_trades(trades: Dict):
    """Save trades data to JSON file."""
    os.makedirs(os.path.dirname(TRADES_FILE), exist_ok=True)
    with open(TRADES_FILE, 'w') as f:
        json.dump(trades, f, indent=2)


@app.post("/api/trade/offer")
async def create_trade_offer(request: TradeOfferRequest, x_init_data: Optional[str] = Header(None)):
    """Create a trade offer. User ID is extracted from Telegram init data."""
    user_data = verify_telegram_webapp_data(x_init_data) if x_init_data else None
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid init data")
    user_id = user_data.get('id')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user data")
    
    # Validate user owns offered cards
    for card_id in request.offered_cards:
        card = database.get_card(user_id, card_id)
        if not card:
            raise HTTPException(status_code=404, detail=f"Card {card_id} not found")
        if card.get("in_pc") is not None:
            raise HTTPException(status_code=400, detail=f"Card {card_id} is in a PC")
    
    # Validate user has enough coins
    if request.coins > 0:
        user = database.get_user(user_id)
        if user["coins"] < request.coins:
            raise HTTPException(status_code=400, detail="Insufficient coins")
    
    # Create trade offer
    trades = load_trades()
    offer_id = int(time.time() * 1000)
    
    trade_offer = {
        "offer_id": offer_id,
        "from_user_id": user_id,
        "to_user_id": request.to_user_id,
        "offered_cards": request.offered_cards,
        "requested_cards": request.requested_cards,
        "coins": request.coins,
        "status": "pending",
        "created_at": time.time()
    }
    
    trades[str(offer_id)] = trade_offer
    save_trades(trades)
    
    return trade_offer


@app.get("/api/trade/offers")
async def get_trade_offers(x_init_data: Optional[str] = Header(None)):
    """Get user's trade offers. User ID is extracted from Telegram init data."""
    user_data = verify_telegram_webapp_data(x_init_data) if x_init_data else None
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid init data")
    user_id = user_data.get('id')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user data")
    
    trades = load_trades()
    
    incoming = []
    outgoing = []
    
    for trade in trades.values():
        if trade["to_user_id"] == user_id and trade["status"] == "pending":
            incoming.append(trade)
        elif trade["from_user_id"] == user_id:
            outgoing.append(trade)
    
    return {
        "incoming": incoming,
        "outgoing": outgoing
    }


@app.post("/api/trade/accept/{offer_id}")
async def accept_trade(offer_id: int, x_init_data: Optional[str] = Header(None)):
    """Accept a trade offer. User ID is extracted from Telegram init data."""
    user_data = verify_telegram_webapp_data(x_init_data) if x_init_data else None
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid init data")
    user_id = user_data.get('id')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user data")
    
    trades = load_trades()
    trade_key = str(offer_id)
    
    if trade_key not in trades:
        raise HTTPException(status_code=404, detail="Trade offer not found")
    
    trade = trades[trade_key]
    
    # Verify user is the recipient
    if trade["to_user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to accept this trade")
    
    if trade["status"] != "pending":
        raise HTTPException(status_code=400, detail="Trade offer already processed")
    
    # Validate requested cards exist and are available
    for card_id in trade["requested_cards"]:
        card = database.get_card(user_id, card_id)
        if not card:
            raise HTTPException(status_code=404, detail=f"Card {card_id} not found")
        if card.get("in_pc") is not None:
            raise HTTPException(status_code=400, detail=f"Card {card_id} is in a PC")
    
    # Execute trade
    from_user_id = trade["from_user_id"]
    
    # Transfer offered cards to recipient
    for card_id in trade["offered_cards"]:
        card = database.get_card(from_user_id, card_id)
        if not card:
            raise HTTPException(status_code=404, detail=f"Offered card {card_id} not found")
        # Update card ownership (move to recipient)
        database.remove_card(from_user_id, card_id)
        database.add_card(
            user_id,
            card["gadget_name"],
            card["category"],
            card["purchase_price"],
            card["rarity"]
        )
    
    # Transfer requested cards to sender
    for card_id in trade["requested_cards"]:
        card = database.get_card(user_id, card_id)
        database.remove_card(user_id, card_id)
        database.add_card(
            from_user_id,
            card["gadget_name"],
            card["category"],
            card["purchase_price"],
            card["rarity"]
        )
    
    # Transfer coins if any
    if trade["coins"] > 0:
        database.transfer_coins(from_user_id, user_id, trade["coins"])
    
    # Update trade status
    trade["status"] = "accepted"
    trades[trade_key] = trade
    save_trades(trades)
    
    return {"message": "Trade accepted", "trade": trade}


@app.post("/api/trade/reject/{offer_id}")
async def reject_trade(offer_id: int, x_init_data: Optional[str] = Header(None)):
    """Reject a trade offer. User ID is extracted from Telegram init data."""
    user_data = verify_telegram_webapp_data(x_init_data) if x_init_data else None
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid init data")
    user_id = user_data.get('id')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user data")
    
    trades = load_trades()
    trade_key = str(offer_id)
    
    if trade_key not in trades:
        raise HTTPException(status_code=404, detail="Trade offer not found")
    
    trade = trades[trade_key]
    
    # Verify user is the recipient
    if trade["to_user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to reject this trade")
    
    if trade["status"] != "pending":
        raise HTTPException(status_code=400, detail="Trade offer already processed")
    
    # Update trade status
    trade["status"] = "rejected"
    trades[trade_key] = trade
    save_trades(trades)
    
    return {"message": "Trade rejected", "trade": trade}


@app.get("/api/trade/history")
async def get_trade_history(x_init_data: Optional[str] = Header(None)):
    """Get user's trade history. User ID is extracted from Telegram init data."""
    user_data = verify_telegram_webapp_data(x_init_data) if x_init_data else None
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid init data")
    user_id = user_data.get('id')
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user data")
    
    trades = load_trades()
    
    history = []
    for trade in trades.values():
        if trade["from_user_id"] == user_id or trade["to_user_id"] == user_id:
            if trade["status"] in ["accepted", "rejected"]:
                history.append(trade)
    
    return {"history": history}


@app.get("/api/users/{user_id}/cards/available")
async def get_available_cards_for_trade(user_id: int):
    """Get cards available for trade (not in PC)."""
    cards = database.get_user_cards(user_id)
    available = [c for c in cards if c.get("in_pc") is None]
    return {"cards": available}

