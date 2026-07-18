import requests
from bs4 import BeautifulSoup
import cloudscraper
import re
import logging
from apps.analysis.constants import ECON_SCRAPE_URLS, DIRECTION
from apps.services import supabase_client
from typing import Optional, Dict

logger = logging.getLogger(__name__)


def scrape_indicator_data(url: str) -> Optional[Dict]:
    """
    Scrape economic indicator data from Trading Economics or Investing.com.
    Returns a dict with keys: date, actual, previous, forecast, source.
    Source is 'primary' or 'fallback'.
    """
    if not url:
        return None

    def clean_value(val):
        if val in [None, "N/A", ""]:
            return None
        val_str = str(val)
        for char in ["%", "K", "M", "B", ","]:
            val_str = val_str.replace(char, "")
        try:
            return float(val_str)
        except:
            return None

    try:
        # Try standard requests first
        response = requests.get(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json, text/html, application/xhtml+xml",
            },
            timeout=10,
        )
        source = "primary"
        if response.status_code != 200:
            # Fallback to cloudscraper
            scraper = cloudscraper.create_scraper()
            response = scraper.get(
                url,
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json, text/html, application/xhtml+xml",
                },
                timeout=15,
            )
            source = "fallback"
        if response.status_code != 200:
            return None

        # Investing.com JSON API
        if "investing.com" in url:
            try:
                data = response.json()
                occurrences = data.get("occurrences", [])
                if not occurrences:
                    return None
                # Find latest occurrence with actual value
                latest = None
                for occ in occurrences:
                    if occ.get("actual") is not None:
                        latest = occ
                        break
                if not latest:
                    latest = occurrences[0]
                raw_time = latest.get("occurrence_time", "")
                date_str = raw_time.split("T")[0] if "T" in raw_time else raw_time
                actual = latest.get("actual")
                prev = latest.get("previous")
                forecast = latest.get("forecast")
                return {
                    "date": date_str,
                    "actual": clean_value(actual),
                    "previous": clean_value(prev),
                    "forecast": clean_value(forecast),
                    "source": source,
                }
            except:
                pass

        # Trading Economics HTML table
        elif "tradingeconomics.com" in url:
            soup = BeautifulSoup(response.text, "html.parser")
            table = soup.find("table", class_="table")
            if table:
                rows = table.find_all("tr")
                if len(rows) > 2:
                    cols = rows[2].find_all("td")
                    if len(cols) >= 7:
                        date = cols[0].text.strip()
                        actual = cols[4].text.strip()
                        prev = cols[5].text.strip()
                        forecast = cols[6].text.strip()
                        return {
                            "date": date,
                            "actual": clean_value(actual),
                            "previous": clean_value(prev),
                            "forecast": clean_value(forecast),
                            "source": source,
                        }
                    elif len(cols) >= 6:
                        date = cols[0].text.strip()
                        actual = cols[3].text.strip()
                        prev = cols[4].text.strip()
                        forecast = cols[5].text.strip()
                        return {
                            "date": date,
                            "actual": clean_value(actual),
                            "previous": clean_value(prev),
                            "forecast": clean_value(forecast),
                            "source": source,
                        }
        return None
    except Exception as e:
        logger.error(f"Scraping error for {url}: {e}")
        return None

def refresh_currency_indicators(currency_code):
    """Fetch all indicators for a currency from web sources and update Supabase."""
    from apps.analysis.constants import CORE_INDICATORS, SCORING_ONLY_INDICATORS, EXTRA_INDICATORS, SCORING_EXCLUDED_INDICATORS
    currency_code = currency_code.upper()
    all_indicators = list(CORE_INDICATORS) + list(SCORING_ONLY_INDICATORS)
    if currency_code in EXTRA_INDICATORS:
        all_indicators.extend(EXTRA_INDICATORS[currency_code])
    if currency_code in SCORING_EXCLUDED_INDICATORS:
        for excl in SCORING_EXCLUDED_INDICATORS[currency_code]:
            if excl in all_indicators:
                all_indicators.remove(excl)

    updated = 0
    failed = 0
    failed_indicators = []

    for ind_name in all_indicators:
        key = f"{currency_code} - {ind_name}"
        urls = ECON_SCRAPE_URLS.get(key, {})
        scraped = None
        source_used = None

        if urls.get("primary"):
            scraped = scrape_indicator_data(urls["primary"])
            if scraped:
                source_used = scraped.get("source")
        if not scraped and urls.get("fallback"):
            scraped = scrape_indicator_data(urls["fallback"])
            if scraped:
                source_used = scraped.get("source")

        if scraped:
            date_str = scraped["date"]
            actual = scraped["actual"]
            previous = scraped["previous"]
            forecast = scraped["forecast"]

            if forecast is None and previous is not None:
                forecast = previous
            if actual is not None and forecast is not None:
                # Update via IndicatorsService or directly
                # We'll use the direct upsert
                direction = DIRECTION.get(ind_name, "higher")
                if actual is None or forecast is None:
                    score = 0
                else:
                    if direction == "higher":
                        score = 1 if actual > forecast else (-1 if actual < forecast else 0)
                    else:
                        score = 1 if actual < forecast else (-1 if actual > forecast else 0)
                
                data = {
                    'currency_code': currency_code,
                    'indicator_name': ind_name,
                    'actual_value': actual,
                    'forecast_value': forecast,
                    'release_date': date_str,
                    'previous_value': previous,
                    'score': score,
                }
                success = supabase_client.upsert_indicator(data)
                if success:
                    updated += 1
                else:
                    failed += 1
                    failed_indicators.append(ind_name)
            else:
                failed += 1
                failed_indicators.append(ind_name)
        else:
            failed += 1
            failed_indicators.append(ind_name)

    # Reload indicators in the analyzer (if needed)
    # We'll handle this outside or rely on the view to reload

    message = f"Updated {updated} indicators, failed {failed}"
    if failed_indicators:
        message += f" (failed: {', '.join(failed_indicators[:5])})"
    return updated, message