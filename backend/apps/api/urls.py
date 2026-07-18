from django.urls import path
from .views.auth import UserInfoView
from .views.analysis import (
    COTTrendsView,
    PutCallRatioView,
    TopSetupsView,
    AssetScorecardView,
    ForexScorecardView,
    EcoSurpriseView,
    EconomicStrengthView,
    MonthlySeasonalityView,
    AnnualSeasonalityView,
    LatestCOTView,
    COTHistoryView,
    RetailSentimentView,
    EconomicHeatmapView,
    EconomicCalendarView,
)

from .views.admin import (
    RefreshIndicatorsView,
    UpdateIndicatorView,
    UpdateCOTRecordView,
    UpdateBondYieldView,
    UpdateEconomicStrengthView,
    GetPendingUsersView,
    ApproveUserView,
    GetApprovedUsersView,
    TrendSettingsView,
    RefreshCOTView,
    RefreshRetailSentimentView,
)

urlpatterns = [
    # Auth
    path('auth/me/', UserInfoView.as_view(), name='user_info'),

    # Analysis
    path('analysis/top-setups/', TopSetupsView.as_view(), name='top_setups'),
    path('analysis/asset-scorecard/', AssetScorecardView.as_view(), name='asset_scorecard'),
    path('analysis/forex-scorecard/', ForexScorecardView.as_view(), name='forex_scorecard'),
    path('analysis/eco-surprise/', EcoSurpriseView.as_view(), name='eco_surprise'),
    path('analysis/economic-strength/', EconomicStrengthView.as_view(), name='economic_strength'),
    path('analysis/seasonality/monthly/', MonthlySeasonalityView.as_view(), name='monthly_seasonality'),
    path('analysis/seasonality/annual/', AnnualSeasonalityView.as_view(), name='annual_seasonality'),
    path('analysis/cot/latest/', LatestCOTView.as_view(), name='cot_latest'),
    path('analysis/cot/trends/', COTTrendsView.as_view(), name='cot_trends'),
    path('analysis/cot/history/', COTHistoryView.as_view(), name='cot_history'),
    path('analysis/retail/', RetailSentimentView.as_view(), name='retail_sentiment'),
    path('analysis/put-call/', PutCallRatioView.as_view(), name='put_call'),
    path('analysis/economic-heatmap/', EconomicHeatmapView.as_view(), name='economic_heatmap'),
    path('analysis/economic-calendar/', EconomicCalendarView.as_view(), name='economic_calendar'),
]

urlpatterns += [
    # Admin endpoints
    path('admin/indicators/<str:currency>/<str:indicator>/', UpdateIndicatorView.as_view(), name='update_indicator'),
    path('admin/cot/', UpdateCOTRecordView.as_view(), name='update_cot'),
    path('admin/bond-yield/<str:currency>/', UpdateBondYieldView.as_view(), name='update_bond_yield'),
    path('admin/economic-strength/<str:currency>/', UpdateEconomicStrengthView.as_view(), name='update_economic_strength'),
    path('admin/users/pending/', GetPendingUsersView.as_view(), name='pending_users'),
    path('admin/users/approved/', GetApprovedUsersView.as_view(), name='approved_users'),
    path('admin/users/<str:user_id>/approve/', ApproveUserView.as_view(), name='approve_user'),
    path('admin/trend-settings/', TrendSettingsView.as_view(), name='trend_settings'),
    path('admin/refresh-indicators/', RefreshIndicatorsView.as_view(), name='refresh_indicators'),
    path('admin/refresh-cot/', RefreshCOTView.as_view(), name='refresh_cot'),
    path('admin/refresh-retail-sentiment/', RefreshRetailSentimentView.as_view(), name='refresh_retail'),
]