"""Wholesale pricing service for tiered bulk discounts and dynamic quote calculations."""

from typing import Any, Dict, List, Optional


class PricingService:
    @staticmethod
    def calculate_unit_wholesale_price(product: Dict[str, Any], quantity: int) -> float:
        """
        Calculate the applicable unit wholesale price based on quantity and tier pricing slabs.
        Example tiers:
          10-49 pcs -> 500
          50-99 pcs -> 470
          100+ pcs  -> 440
        """
        base_price = float(product.get("wholesale_price", 0.0))
        tier_prices = product.get("tier_prices", [])

        if not tier_prices:
            return base_price

        # Sort tiers by min_quantity descending so we match the highest applicable tier first
        applicable_tier_price: Optional[float] = None
        for tier in tier_prices:
            min_qty = tier.get("min_quantity", 1)
            max_qty = tier.get("max_quantity")
            price = float(tier.get("price_per_unit", base_price))

            if max_qty is not None:
                if min_qty <= quantity <= max_qty:
                    return price
            else:
                # Unbounded upper limit (e.g., 100+)
                if quantity >= min_qty:
                    applicable_tier_price = price

        if applicable_tier_price is not None:
            return applicable_tier_price

        return base_price

    @staticmethod
    def calculate_item_subtotal(product: Dict[str, Any], quantity: int) -> Dict[str, Any]:
        """Calculate unit price, discount against base price, and subtotal."""
        base_price = float(product.get("wholesale_price", 0.0))
        effective_price = PricingService.calculate_unit_wholesale_price(product, quantity)
        subtotal = round(effective_price * quantity, 2)
        total_discount = round(max(0.0, (base_price - effective_price) * quantity), 2)

        return {
            "base_unit_price": base_price,
            "effective_unit_price": effective_price,
            "quantity": quantity,
            "discount": total_discount,
            "subtotal": subtotal,
        }
