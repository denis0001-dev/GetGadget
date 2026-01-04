"""
Integrated FastAPI web API for the Telegram Gadget Card Bot.
Runs inside the same process as the bot (dev mode) when started via `start_web_api`.
Provides `/api/cards` and `/api/get-card` endpoints and verifies Telegram WebApp initData.
"""
from typing import Dict, Any, Optional
import json
import threading
import time
import hmac
import hashlib
import urllib.parse
from fastapi import FastAPI, Header, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import config
import gadgets
import database


app = FastAPI(title="GetGadget Bot API")


def verify_init_data(init_data: str, max_age_seconds: int = 24 * 3600) -> Dict[str, Any]:
    """
    Verify Telegram WebApp initData according to Telegram docs.
    Returns the parsed 'user' dict if valid, otherwise raises HTTPException(401).
    """
    if not init_data:
        raise HTTPException(status_code=401, detail="Missing initData")

    # Parse query-style string into ordered pairs
    try:
        # parse_qsl will decode percent-encoding
        pairs = urllib.parse.parse_qsl(init_data, keep_blank_values=True)
        data = dict(pairs)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid initData format")

    provided_hash = data.pop("hash", None)
    if not provided_hash:
        raise HTTPException(status_code=401, detail="Missing hash in initData")

    # Build data_check_string: sort keys lexicographically and join as "key=value\n"
    items = []
    for k in sorted(data.keys()):
        items.append(f"{k}={data[k]}")
    data_check_string = "\n".join(items)

    # Compute secret_key and HMAC per Telegram docs
    secret_key = hmac.new(b"WebAppData", config.BOT_TOKEN.encode("utf-8"), hashlib.sha256).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()

    # Constant time compare
    if not hmac.compare_digest(provided_hash, computed_hash):
        raise HTTPException(status_code=401, detail="Invalid initData signature")

    # Check auth_date freshness
    auth_date_str = data.get("auth_date")
    if not auth_date_str:
        raise HTTPException(status_code=401, detail="Missing auth_date")
    try:
        auth_date = int(auth_date_str)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid auth_date")

    if time.time() - auth_date > max_age_seconds:
        raise HTTPException(status_code=401, detail="initData expired")

    # Parse user JSON if present (some fields are JSON-encoded)
    user_raw = data.get("user")
    user: Dict[str, Any] = {}
    if user_raw:
        try:
            user = json.loads(user_raw)
        except Exception:
            # Some clients might send user fields as structured query pairs; fallback to scanning keys
            # Accept whatever is present under 'user' if it's not JSON
            user = {"raw": user_raw}

    # Ensure a numeric id exists
    user_id = user.get("id") if isinstance(user, dict) else None
    if user_id is None:
        # Try top-level user_id keys if present
        if "user_id" in data:
            try:
                user_id = int(data["user_id"])
            except Exception:
                user_id = None
    if user_id is None:
        raise HTTPException(status_code=401, detail="initData missing user id")

    # Canonicalize user id to int and attach to user dict
    try:
        user["id"] = int(user_id)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid user id in initData")

    return user


def get_current_telegram_user(x_telegram_initdata: Optional[str] = Header(None, alias="X-Telegram-InitData")):
    """
    FastAPI dependency that verifies the X-Telegram-InitData header and returns the authenticated user dict.
    """
    return verify_init_data(x_telegram_initdata)


class GetCardResponse(BaseModel):
    id: int
    name: str
    rarity: str


@app.get("/api/cards")
def api_get_cards(user: Dict = Depends(get_current_telegram_user)):
    """
    Return a catalog of available gadgets (name, rarity).
    The user is required and comes from verified initData; user identity is authoritative.
    """
    result = [{"name": g["name"], "rarity": g["rarity"]} for g in gadgets.GADGETS]
    return {"cards": result}


@app.post("/api/get-card", response_model=GetCardResponse)
def api_get_card(user: Dict = Depends(get_current_telegram_user)):
    """
    Choose a random gadget (server-side), add it to the authenticated user's collection, and return it.
    The user.id is taken from the verified initData and cannot be overridden by client data.
    """
    user_id = int(user["id"])

    # Use existing selection logic from gadgets.py
    gadget = gadgets.get_random_gadget()

    # Add card to user's collection using database helpers
    card_id = database.add_card(
        user_id,
        gadget["name"],
        gadget.get("category", "Unknown"),
        gadget.get("price", 0),
        gadget.get("rarity", "Common")
    )

    # Update user last_card_time
    database.update_user(user_id, last_card_time=int(time.time()))

    return {"id": card_id, "name": gadget["name"], "rarity": gadget.get("rarity", "Common")}


def start_web_api(host: str = "127.0.0.1", port: int = 8400, dev_cors_origins: Optional[list] = None):
    """
    Start the FastAPI app in a background daemon thread. Allows the main bot process to keep running.
    """
    # Configure CORS for dev if provided
    origins = dev_cors_origins or []
    if origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def run():
        import uvicorn
        uvicorn.run("bot_api:app", host=host, port=port, log_level="info")

    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    return thread


