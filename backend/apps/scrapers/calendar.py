import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta
import logging
import cloudscraper
import json
from django.core.cache import cache

logger = logging.getLogger(__name__)

EXCLUDED_WORDS = [
    "german", "french", "italian", "spanish", "sppi", "tokyo",
    "Retail Sales Monitor", "Trimmed", "Weekly", "Core Retail Sales",
    "RatingDog", "Empire",
]

# Fallback sample data (in case scraping fails)
FALLBACK_EVENTS = [
    {"date_time": "2025-01-15 08:30", "currency": "USD", "event": "CPI YoY", "actual": "3.2%", "forecast": "3.1%", "previous": "3.4%"},
    {"date_time": "2025-01-16 14:00", "currency": "EUR", "event": "ECB Interest Rate Decision", "actual": "4.25%", "forecast": "4.25%", "previous": "4.50%"},
]


def fetch_forexfactory_calendar():
    """
    Scrape ForexFactory calendar and return events with times converted to EAT.
    Falls back to cached data or sample if scraping fails.
    """
    cache_key = "forexfactory_calendar"
    cached = cache.get(cache_key)
    if cached:
        logger.info("Returning cached calendar data")
        return cached

    url = "https://www.forexfactory.com/calendar?week=this"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    try:
        # Try with cloudscraper first (more robust)
        scraper = cloudscraper.create_scraper()
        response = scraper.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            # Try standard requests as fallback
            response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            logger.error(f"Failed to fetch calendar (HTTP {response.status_code})")
            # Return fallback data
            return _get_fallback_events()

        soup = BeautifulSoup(response.text, "html.parser")
        table = soup.find("table", class_="calendar__table")
        if not table:
            logger.error("Could not find calendar table on ForexFactory")
            return _get_fallback_events()

        parsed = []
        current_date = "Unknown Date"
        excluded_lower = [w.lower() for w in EXCLUDED_WORDS]

        for row in table.find_all("tr", class_="calendar__row"):
            date_cell = row.find("td", class_="calendar__date")
            if date_cell and date_cell.text.strip():
                raw_date = " ".join(date_cell.text.split())
                time_match = re.search(r'(\d{1,2}:\d{2})([a-p]m)', raw_date.lower())
                if time_match:
                    try:
                        time_str = time_match.group(0)
                        dt_obj = datetime.strptime(time_str, "%I:%M%p")
                        dt_eat = dt_obj + timedelta(hours=7)
                        eat_time_str = dt_eat.strftime("%I:%M %p")
                        current_date = raw_date.lower().replace(time_str, f"{eat_time_str} (EAT)").upper()
                    except:
                        current_date = raw_date
                else:
                    current_date = raw_date

            currency_cell = row.find("td", class_="calendar__currency")
            currency = currency_cell.text.strip() if currency_cell else ""
            event_cell = row.find("td", class_="calendar__event")
            event_name = event_cell.text.strip() if event_cell else ""
            actual_cell = row.find("td", class_="calendar__actual")
            actual = actual_cell.text.strip() if actual_cell else ""
            forecast_cell = row.find("td", class_="calendar__forecast")
            forecast = forecast_cell.text.strip() if forecast_cell else ""
            previous_cell = row.find("td", class_="calendar__previous")
            previous = previous_cell.text.strip() if previous_cell else ""

            if not currency or not event_name:
                continue

            event_lower = event_name.lower()
            currency_upper = currency.upper()

            # Exclude words
            if any(word in event_lower for word in excluded_lower):
                continue

            is_matched = False
            global_keywords = [
                "gdp", "retail sales", "manufacturing pmi", "services pmi",
                "cpi", "ppi", "unemployment rate", "employment change",
                "consumer confidence", "bank holiday",
            ]
            if any(kw in event_lower for kw in global_keywords):
                is_matched = True

            if currency_upper == "USD":
                usd_keywords = ["pce", "non-farm employment change", "unemployment claims", "adp", "jolts job openings", "average hourly earnings", "federal funds rate", "fomc statement"]
                if any(kw in event_lower for kw in usd_keywords):
                    is_matched = True

            if currency_upper == "JPY" and any(kw in event_lower for kw in ["household spending", "boj policy rate"]):
                is_matched = True
            if currency_upper == "AUD" and any(kw in event_lower for kw in ["cash rate", "rba rate statement"]):
                is_matched = True
            if currency_upper == "NZD" and any(kw in event_lower for kw in ["manufacturing index", "services index", "official cash rate", "rbnz rate statement"]):
                is_matched = True
            if currency_upper == "CAD" and any(kw in event_lower for kw in ["overnight rate", "boc rate statement"]):
                is_matched = True
            if currency_upper == "GBP" and any(kw in event_lower for kw in ["official bank rate", "boe monetary policy report"]):
                is_matched = True
            if currency_upper == "EUR" and any(kw in event_lower for kw in ["main refinancing rate", "monetary policy statement"]):
                is_matched = True

            if is_matched:
                parsed.append({
                    "date_time": current_date,
                    "currency": currency_upper,
                    "event": event_name,
                    "actual": actual,
                    "forecast": forecast,
                    "previous": previous,
                })

        if not parsed:
            logger.warning("No events parsed, using fallback")
            return _get_fallback_events()

        # Cache for 6 hours
        cache.set(cache_key, parsed, timeout=21600)
        return parsed

    except Exception as e:
        logger.error(f"Error scraping ForexFactory: {e}")
        return _get_fallback_events()


def _get_fallback_events():
    """Return fallback events if scraping fails."""
    return FALLBACK_EVENTS