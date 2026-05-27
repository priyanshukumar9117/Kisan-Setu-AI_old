"""
Mandi (market) price service using data.gov.in API.
Fetches real-time agricultural commodity prices from Bihar mandis.
"""
import os
import requests
import hashlib
import json
import time
from datetime import datetime, timedelta


# Simple in-memory cache to avoid repeated slow API calls
_price_cache = {}  # key -> {"data": ..., "expires": timestamp}
CACHE_TTL_SECONDS = 30 * 60  # 30 minutes


# data.gov.in API endpoint for daily commodity prices
MANDI_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

# Common crops in Bihar for quick filtering
BIHAR_CROPS = [
    "Rice", "Wheat", "Maize", "Paddy(Dhan)(Common)",
    "Arhar (Tur/Red Gram)(Whole)", "Gram Dal(Chana Dal)",
    "Masoor Dal", "Onion", "Potato", "Tomato",
    "Cauliflower", "Cabbage", "Green Chilli",
    "Banana", "Mango", "Sugarcane",
    "Mustard", "Linseed", "Groundnut",
]

# Major Bihar mandi districts
BIHAR_MANDI_DISTRICTS = [
    "Araria", "Aurangabad", "Begusarai", "Bhagalpur",
    "Bhojpur", "Buxar", "Darbhanga", "Gaya",
    "Gopalganj", "Katihar", "Madhubani", "Munger",
    "Muzaffarpur", "Nalanda", "Patna", "Purnia",
    "Rohtas", "Samastipur", "Saran", "Siwan", "Vaishali",
]


def _make_cache_key(commodity, district, limit):
    """Generate a cache key from query parameters."""
    raw = f"{commodity}|{district}|{limit}"
    return hashlib.md5(raw.encode()).hexdigest()


def get_mandi_prices(commodity=None, district=None, limit=50):
    """
    Fetch mandi prices from data.gov.in API.
    Includes retry logic, caching, and automatic fallback.
    
    Args:
        commodity: Filter by commodity name (e.g., "Rice", "Wheat")
        district: Filter by district name  
        limit: Max number of records to return
    
    Returns:
        dict with records list and metadata
    """
    api_key = os.getenv("DATA_GOV_API_KEY", "")
    
    if not api_key:
        return {
            "error": "DATA_GOV_API_KEY not set. Register at data.gov.in for a free API key.",
            "records": [],
            "fallback": True,
        }

    # Check cache first
    cache_key = _make_cache_key(commodity, district, limit)
    cached = _price_cache.get(cache_key)
    if cached and cached["expires"] > time.time():
        print("[Mandi] Serving from cache")
        result = cached["data"].copy()
        result["source"] = "data.gov.in (cached)"
        return result

    params = {
        "api-key": api_key,
        "format": "json",
        "filters[state]": "Bihar",
        "limit": limit,
        "offset": 0,
    }

    if commodity:
        params["filters[commodity]"] = commodity
    if district:
        params["filters[district]"] = district

    # Retry with increasing timeouts: 10s, then 15s
    last_error = None
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    for attempt, timeout in enumerate([10, 15], start=1):
        try:
            print(f"[Mandi] API attempt {attempt} (timeout={timeout}s)")
            response = requests.get(MANDI_API_URL, params=params, headers=headers, timeout=timeout)
            response.raise_for_status()
            data = response.json()

            records = data.get("records", [])
            
            # Normalize field names for frontend consistency
            normalized = []
            for record in records:
                normalized.append({
                    "commodity": record.get("commodity", ""),
                    "variety": record.get("variety", ""),
                    "district": record.get("district", ""),
                    "market": record.get("market", ""),
                    "min_price": record.get("min_price", 0),
                    "max_price": record.get("max_price", 0),
                    "modal_price": record.get("modal_price", 0),
                    "arrival_date": record.get("arrival_date", ""),
                })

            if len(normalized) == 0:
                print(f"[Mandi API Warning] Attempt {attempt} returned 0 records for Bihar.")
                # We don't return here so it can retry, though it's likely a persistent empty result
                # We'll break and trigger fallback at the end if it remains empty.
                last_error = "API returned 0 records for this filter."
                continue

            result = {
                "total": data.get("total", 0),
                "count": len(normalized),
                "records": normalized,
                "source": "data.gov.in",
                "fetched_at": datetime.now().isoformat(),
            }

            # Cache the successful result
            _price_cache[cache_key] = {
                "data": result,
                "expires": time.time() + CACHE_TTL_SECONDS,
            }

            return result

        except requests.exceptions.RequestException as e:
            last_error = e
            print(f"[Mandi API Error] Attempt {attempt} failed: {e}")

    # All retries exhausted — check for stale cache before giving up
    if cached:
        print("[Mandi] API down, serving stale cache")
        result = cached["data"].copy()
        result["source"] = "data.gov.in (stale cache)"
        result["note"] = "Live API is currently unavailable. Showing last cached prices."
        return result

    # No cache available — signal fallback
    print(f"[Mandi API Error] All retries exhausted: {last_error}")
    return {
        "error": f"Failed to fetch mandi prices: {str(last_error)}",
        "records": [],
        "fallback": True,
    }


def get_fallback_prices():
    """
    Return sample/static mandi price data when API is unavailable.
    Useful for development/demo purposes.
    """
    today = datetime.now().strftime("%d/%m/%Y")
    return {
        "total": 10,
        "count": 10,
        "records": [
            {"commodity": "Rice", "variety": "Common", "district": "Patna", "market": "Patna", "min_price": 2200, "max_price": 2600, "modal_price": 2400, "arrival_date": today},
            {"commodity": "Wheat", "variety": "Lokwan", "district": "Patna", "market": "Patna", "min_price": 2100, "max_price": 2500, "modal_price": 2300, "arrival_date": today},
            {"commodity": "Maize", "variety": "Yellow", "district": "Muzaffarpur", "market": "Muzaffarpur", "min_price": 1800, "max_price": 2100, "modal_price": 1950, "arrival_date": today},
            {"commodity": "Onion", "variety": "Red", "district": "Patna", "market": "Patna", "min_price": 1200, "max_price": 1800, "modal_price": 1500, "arrival_date": today},
            {"commodity": "Potato", "variety": "Other", "district": "Nalanda", "market": "Biharsharif", "min_price": 800, "max_price": 1200, "modal_price": 1000, "arrival_date": today},
            {"commodity": "Tomato", "variety": "Local", "district": "Gaya", "market": "Gaya", "min_price": 1500, "max_price": 2200, "modal_price": 1800, "arrival_date": today},
            {"commodity": "Paddy(Dhan)(Common)", "variety": "Common", "district": "Bhagalpur", "market": "Bhagalpur", "min_price": 1900, "max_price": 2200, "modal_price": 2050, "arrival_date": today},
            {"commodity": "Arhar (Tur/Red Gram)(Whole)", "variety": "Whole", "district": "Darbhanga", "market": "Darbhanga", "min_price": 6000, "max_price": 7200, "modal_price": 6600, "arrival_date": today},
            {"commodity": "Cauliflower", "variety": "Local", "district": "Muzaffarpur", "market": "Muzaffarpur", "min_price": 1000, "max_price": 1500, "modal_price": 1250, "arrival_date": today},
            {"commodity": "Banana", "variety": "Robusta", "district": "Vaishali", "market": "Hajipur", "min_price": 800, "max_price": 1400, "modal_price": 1100, "arrival_date": today},
        ],
        "source": "sample_data",
        "fetched_at": datetime.now().isoformat(),
        "note": "This is sample data. Set DATA_GOV_API_KEY for live prices.",
    }


def get_available_commodities():
    """Return list of common Bihar commodities for the filter dropdown."""
    return BIHAR_CROPS


def get_available_districts():
    """Return list of Bihar mandi districts for the filter dropdown."""
    return BIHAR_MANDI_DISTRICTS
