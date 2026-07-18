from apps.services import supabase_client
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class SeasonalityDBService:
    def __init__(self):
        self._monthly_cache = {}  # normalized_pair -> dict of month -> {'bias': ..., 'value': ...}
        self._annual_cache = {}   # normalized_pair -> dict of week -> cumulative_return
        self._load_monthly()
        self._load_annual()

    def _normalize_pair(self, pair: str) -> str:
        """Convert 'EUR/USD' to 'EURUSD' for database lookup."""
        return pair.replace('/', '').upper()

    def _load_monthly(self):
        try:
            resp = supabase_client.admin.table('seasonality_monthly').select('*').execute()
            self._monthly_cache = {}
            for row in resp.data:
                pair = row['pair']  # already normalized
                if pair not in self._monthly_cache:
                    self._monthly_cache[pair] = {}
                self._monthly_cache[pair][row['month']] = {
                    'bias': row['bias'],
                    'value': row['value']
                }
            logger.info(f"Loaded monthly seasonality for {len(self._monthly_cache)} pairs")
        except Exception as e:
            logger.error(f"Failed to load monthly seasonality: {e}")
            self._monthly_cache = {}

    def _load_annual(self):
        try:
            resp = supabase_client.admin.table('seasonality_annual').select('*').execute()
            self._annual_cache = {}
            for row in resp.data:
                pair = row['pair']
                if pair not in self._annual_cache:
                    self._annual_cache[pair] = {}
                self._annual_cache[pair][row['week']] = row['cumulative_return']
            logger.info(f"Loaded annual seasonality for {len(self._annual_cache)} pairs")
        except Exception as e:
            logger.error(f"Failed to load annual seasonality: {e}")
            self._annual_cache = {}

    def get_monthly_seasonality(self, pair: str) -> List[Dict]:
        """Return list of dicts: [{'month': 'Jan', 'avg_return': 1.23, 'bias': 'Bullish'}, ...]"""
        normalized = self._normalize_pair(pair)
        data = self._monthly_cache.get(normalized, {})
        if not data:
            logger.warning(f"No monthly seasonality found for {pair} (normalized: {normalized})")
        month_order = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        result = []
        for month in month_order:
            item = data.get(month, {})
            result.append({
                'month': month,
                'avg_return': item.get('value', 0.0),
                'bias': item.get('bias', 'Neutral')
            })
        return result

    def get_annual_seasonality(self, pair: str) -> List[Dict]:
        """Return list of dicts: [{'week': 1, 'cumulative_return': 2.3}, ...]"""
        normalized = self._normalize_pair(pair)
        data = self._annual_cache.get(normalized, {})
        if not data:
            logger.warning(f"No annual seasonality found for {pair} (normalized: {normalized})")
        weeks = sorted(data.keys())
        return [{'week': w, 'cumulative_return': data[w]} for w in weeks]

    def get_seasonality_score(self, pair: str, month: str) -> int:
        """Return 1, -1, or 0 based on bias."""
        normalized = self._normalize_pair(pair)
        data = self._monthly_cache.get(normalized, {})
        item = data.get(month, {})
        bias = item.get('bias', 'Neutral')
        if bias == 'Bullish':
            return 1
        elif bias == 'Bearish':
            return -1
        return 0

# Singleton
seasonality_db = SeasonalityDBService()