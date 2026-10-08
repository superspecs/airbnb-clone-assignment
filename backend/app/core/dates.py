from datetime import date, datetime
from zoneinfo import ZoneInfo

from app.core.config import settings


def today() -> date:
    """Today's date in the marketplace timezone (used for 'no past dates' rules)."""
    return datetime.now(ZoneInfo(settings.timezone)).date()
