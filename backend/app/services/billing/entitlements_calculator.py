"""Business logic for access control and entitlements."""

from typing import Dict, Any, Optional, List
from datetime import datetime


class EntitlementsCalculator:
    """Calculates user entitlements and access control based on subscription data."""

    # Subscription tier definitions
    TIER_ENTITLEMENTS = {
        'starter': {
            'monthly_deals_limit': 20,
            'features': [
                'basic_underwriting',
                'pdf_analysis',
                'excel_analysis',
                'standard_reporting'
            ],
            'max_seats': 1
        },
        'professional': {
            'monthly_deals_limit': 999999,  # Unlimited
            'features': [
                'basic_underwriting',
                'pdf_analysis',
                'excel_analysis',
                'standard_reporting',
                'advanced_underwriting',
                'unlimited_custom_models',
                'priority_support',
                'advanced_analytics'
            ],
            'max_seats': 1
        }
    }

    def calculate_entitlements_from_subscription(
        self,
        subscription_data: Dict[str, Any],
        price_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Calculate user entitlements from subscription data.

        Args:
            subscription_data: Stripe subscription object
            price_metadata: Price metadata from stripe_prices table

        Returns:
            dict: Calculated entitlements
        """
        # Extract tier from price metadata or default to starter
        tier = 'starter'
        if price_metadata and 'tier' in price_metadata:
            tier = price_metadata['tier']

        # Get base entitlements for tier
        entitlements = self.TIER_ENTITLEMENTS.get(tier, self.TIER_ENTITLEMENTS['starter']).copy()

        # Override with price metadata if available
        if price_metadata:
            if 'monthly_deals_limit' in price_metadata:
                entitlements['monthly_deals_limit'] = price_metadata['monthly_deals_limit']
            if 'features' in price_metadata:
                entitlements['features'] = price_metadata['features']
            if 'max_seats' in price_metadata:
                entitlements['max_seats'] = price_metadata['max_seats']

        # Add subscription-specific data
        entitlements.update({
            'subscription_id': subscription_data.get('id'),
            'status': subscription_data.get('status'),
            'current_period_start': subscription_data.get('current_period_start'),
            'current_period_end': subscription_data.get('current_period_end'),
            'tier': tier
        })

        return entitlements

    def calculate_entitlements_from_price_metadata(self, price_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate entitlements from price metadata only.

        Args:
            price_metadata: Price metadata from stripe_prices table

        Returns:
            dict: Calculated entitlements
        """
        tier = price_metadata.get('tier', 'starter')
        base_entitlements = self.TIER_ENTITLEMENTS.get(tier, self.TIER_ENTITLEMENTS['starter']).copy()

        # Override with metadata values
        entitlements = {**base_entitlements, **price_metadata}
        entitlements['tier'] = tier

        return entitlements

    def check_feature_access(self, entitlements: Dict[str, Any], feature: str) -> bool:
        """
        Check if user has access to a specific feature.

        Args:
            entitlements: User entitlements
            feature: Feature name to check

        Returns:
            bool: True if user has access
        """
        features = entitlements.get('features', [])
        return feature in features

    def check_deal_limit(self, entitlements: Dict[str, Any], current_usage: int) -> Dict[str, Any]:
        """
        Check if user can create more deals.

        Args:
            entitlements: User entitlements
            current_usage: Current number of deals used this period

        Returns:
            dict: Deal limit information
        """
        limit = entitlements.get('monthly_deals_limit', 0)
        unlimited = limit >= 999999

        return {
            'can_create_deal': unlimited or current_usage < limit,
            'deals_used': current_usage,
            'deals_limit': limit,
            'unlimited': unlimited,
            'remaining_deals': max(0, limit - current_usage) if not unlimited else None
        }

    def get_subscription_tier_from_entitlements(self, entitlements: Dict[str, Any]) -> str:
        """
        Get subscription tier from entitlements.

        Args:
            entitlements: User entitlements

        Returns:
            str: Subscription tier
        """
        return entitlements.get('tier', 'starter')

    def is_subscription_active(self, entitlements: Dict[str, Any]) -> bool:
        """
        Check if subscription is active based on entitlements.

        Args:
            entitlements: User entitlements

        Returns:
            bool: True if subscription is active
        """
        status = entitlements.get('status', '')
        return status in ['active', 'trialing']

    def calculate_usage_percentage(self, entitlements: Dict[str, Any], current_usage: int) -> float:
        """
        Calculate usage percentage for the current period.

        Args:
            entitlements: User entitlements
            current_usage: Current number of deals used

        Returns:
            float: Usage percentage (0-100)
        """
        limit = entitlements.get('monthly_deals_limit', 0)
        if limit >= 999999:  # Unlimited
            return 0.0

        if limit == 0:
            return 100.0

        return min(100.0, (current_usage / limit) * 100)

    def get_available_features(self, entitlements: Dict[str, Any]) -> List[str]:
        """
        Get list of available features for user.

        Args:
            entitlements: User entitlements

        Returns:
            list: Available features
        """
        return entitlements.get('features', [])

    def validate_subscription_period(self, entitlements: Dict[str, Any]) -> bool:
        """
        Validate that subscription is within current period.

        Args:
            entitlements: User entitlements

        Returns:
            bool: True if within current period
        """
        current_time = datetime.utcnow().timestamp()
        period_start = entitlements.get('current_period_start')
        period_end = entitlements.get('current_period_end')

        if not period_start or not period_end:
            return False

        # Convert to timestamp if needed
        if isinstance(period_start, str):
            period_start = datetime.fromisoformat(period_start.replace('Z', '+00:00')).timestamp()
        if isinstance(period_end, str):
            period_end = datetime.fromisoformat(period_end.replace('Z', '+00:00')).timestamp()

        return period_start <= current_time <= period_end

    def get_entitlements_summary(self, entitlements: Dict[str, Any], current_usage: int = 0) -> Dict[str, Any]:
        """
        Get a summary of user entitlements and current status.

        Args:
            entitlements: User entitlements
            current_usage: Current number of deals used

        Returns:
            dict: Entitlements summary
        """
        deal_limit_info = self.check_deal_limit(entitlements, current_usage)

        return {
            'tier': self.get_subscription_tier_from_entitlements(entitlements),
            'is_active': self.is_subscription_active(entitlements),
            'is_within_period': self.validate_subscription_period(entitlements),
            'features': self.get_available_features(entitlements),
            'deal_limits': deal_limit_info,
            'usage_percentage': self.calculate_usage_percentage(entitlements, current_usage),
            'subscription_id': entitlements.get('subscription_id'),
            'current_period_start': entitlements.get('current_period_start'),
            'current_period_end': entitlements.get('current_period_end')
        }
