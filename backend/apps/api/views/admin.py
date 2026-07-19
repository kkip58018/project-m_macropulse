from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from apps.api.permissions import IsAdminUser
from apps.analysis.services import Analyzer
from apps.services import supabase_client, turso_client
from apps.analysis.constants import STANDARD_CURRENCIES, DIRECTION
from datetime import datetime
from django.core.cache import cache
import logging


logger = logging.getLogger(__name__)
analyzer = Analyzer()


class UpdateIndicatorView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, currency, indicator):
        data = request.data
        actual = data.get('actual')
        forecast = data.get('forecast')
        date_str = data.get('date')
        previous = data.get('previous')

        if actual is None or forecast is None or date_str is None:
            return Response(
                {'error': 'actual, forecast, and date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Convert date string to datetime if needed
        if isinstance(date_str, str):
            try:
                date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            except ValueError:
                date_obj = datetime.now().date()
        else:
            date_obj = date_str

        success = analyzer.indicators.update_indicator(
            currency=currency,
            indicator=indicator,
            actual=float(actual),
            forecast=float(forecast),
            date=date_obj.isoformat(),
            previous=float(previous) if previous is not None else None
        )

        if success:
            return Response({'message': f'Indicator {indicator} for {currency} updated successfully'})
        else:
            return Response({'error': 'Failed to update indicator'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateCOTRecordView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        data = request.data
        asset = data.get('asset')
        asset_class = data.get('class', 'forex')
        date_str = data.get('date')
        long_pos = data.get('long_pos')
        short_pos = data.get('short_pos')

        if not all([asset, date_str, long_pos is not None, short_pos is not None]):
            return Response(
                {'error': 'asset, date, long_pos, and short_pos are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate date format
        try:
            datetime.strptime(date_str, '%Y-%m-%d')
        except ValueError:
            return Response(
                {'error': 'date must be in YYYY-MM-DD format'},
                status=status.HTTP_400_BAD_REQUEST
            )

        success = analyzer.cot.update_record(
            asset=asset,
            asset_class=asset_class,
            date=date_str,
            long_pos=float(long_pos),
            short_pos=float(short_pos)
        )

        if success:
            return Response({'message': f'COT record for {asset} updated successfully'})
        else:
            return Response({'error': 'Failed to update COT record'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateBondYieldView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, currency):
        score = request.data.get('score')
        if score is None:
            return Response({'error': 'score is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            score = int(score)
            if score not in [-1, 0, 1]:
                return Response({'error': 'score must be -1, 0, or 1'}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({'error': 'score must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        success = analyzer.bond_yield.update_score(currency, score)
        if success:
            return Response({'message': f'Bond yield score for {currency} updated to {score}'})
        else:
            return Response({'error': 'Failed to update bond yield score'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UpdateEconomicStrengthView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def put(self, request, currency):
        data = request.data
        required_fields = ['gdp_growth', 'unemployment_rate', 'interest_rate', 'cpi_yoy']
        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f'{field} is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        try:
            payload = {
                'gdp_growth': float(data['gdp_growth']),
                'unemployment_rate': float(data['unemployment_rate']),
                'interest_rate': float(data['interest_rate']),
                'cpi_yoy': float(data['cpi_yoy']),
                'real_yield': float(data.get('real_yield', 0.0)),
                'bias': data.get('bias', 'Neutral'),
                'relative_strength_score': int(data.get('relative_strength_score', 50)),
                'delta_score': int(data.get('delta_score', 0)),
                'delta_real_yield': float(data.get('delta_real_yield', 0.0)),
            }
        except ValueError:
            return Response(
                {'error': 'All numeric fields must be valid numbers'},
                status=status.HTTP_400_BAD_REQUEST
            )

        success = analyzer.econ_strength.update_strength(currency, payload)
        if success:
            return Response({'message': f'Economic strength for {currency} updated successfully'})
        else:
            return Response({'error': 'Failed to update economic strength'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetPendingUsersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # Get all users with approved=False
        resp = supabase_client.admin.table('user_profiles') \
            .select('id, email, created_at, approved, is_admin') \
            .eq('approved', False) \
            .execute()
        return Response(resp.data)


class ApproveUserView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request, user_id):
        try:
            supabase_client.admin.table('user_profiles') \
                .update({'approved': True}) \
                .eq('id', user_id) \
                .execute()
            # Also fetch the user's email for response
            resp = supabase_client.admin.table('user_profiles') \
                .select('email') \
                .eq('id', user_id) \
                .execute()
            email = resp.data[0]['email'] if resp.data else user_id
            return Response({'message': f'User {email} approved successfully'})
        except Exception as e:
            logger.error(f"Failed to approve user: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GetApprovedUsersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        resp = supabase_client.admin.table('user_profiles') \
            .select('id, email, created_at, approved, is_admin') \
            .eq('approved', True) \
            .execute()
        return Response(resp.data)


class TrendSettingsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        # We'll store settings in database or a config file
        # For now, get from analyzer
        return Response({
            'ma_periods': analyzer.trend.ma_periods
        })

    def put(self, request):
        periods = request.data.get('ma_periods')
        if not periods or not isinstance(periods, list):
            return Response(
                {'error': 'ma_periods must be a list of integers'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            periods = [int(p) for p in periods]
            if any(p <= 0 for p in periods):
                return Response(
                    {'error': 'All periods must be positive integers'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except ValueError:
            return Response(
                {'error': 'All periods must be integers'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update in analyzer
        analyzer.trend.ma_periods = periods
        # Clear trend cache
        cache.delete_pattern('trend_*')
        return Response({'message': 'Trend settings updated successfully', 'ma_periods': periods})
class RefreshIndicatorsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        cache.clear()
        currency = request.data.get('currency', '').upper()
        if not currency or currency not in STANDARD_CURRENCIES:
            return Response(
                {'error': f'Invalid currency. Must be one of {STANDARD_CURRENCIES}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Use the analyzer's refresh method (which calls the scraper)
            updated, message = analyzer.indicators.refresh_from_web(currency)
            return Response({
                'message': f'Refresh completed for {currency}',
                'updated': updated,
                'details': message
            })
        except Exception as e:
            logger.error(f"Refresh indicators failed: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class RefreshCOTView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def post(self, request):
        try:
            cache.clear()
            updated = analyzer.cot.refresh_from_web()
            return Response({
                'message': f'COT data refreshed successfully',
                'updated': updated
            })
        except Exception as e:
            logger.error(f"Refresh COT failed: {e}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RefreshRetailSentimentView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def post(self, request):
        try:
            cache.clear()
            success = analyzer.retail.refresh_from_api()
            if success:
                return Response({'message': 'Retail sentiment updated successfully'})
            else:
                return Response({'error': 'Failed to refresh retail sentiment'}, status=500)
        except Exception as e:
            logger.error(f"Refresh retail sentiment failed: {e}")
            return Response({'error': str(e)}, status=500)