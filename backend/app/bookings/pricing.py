from dataclasses import dataclass

from app.core.config import settings


@dataclass(frozen=True)
class PriceBreakdown:
    """All amounts are integer minor units (paise)."""

    nights: int
    nightly_price: int
    subtotal: int
    cleaning_fee: int
    service_fee: int
    total: int


def calculate_price(nightly_price: int, cleaning_fee: int, nights: int) -> PriceBreakdown:
    """Single source of truth for stay pricing. Never trust a client-supplied total."""
    if nights < 1:
        raise ValueError("nights must be at least 1")
    subtotal = nightly_price * nights
    # Round half up to the nearest paisa using integer arithmetic.
    service_fee = (subtotal * settings.service_fee_bps + 5_000) // 10_000
    return PriceBreakdown(
        nights=nights,
        nightly_price=nightly_price,
        subtotal=subtotal,
        cleaning_fee=cleaning_fee,
        service_fee=service_fee,
        total=subtotal + cleaning_fee + service_fee,
    )
