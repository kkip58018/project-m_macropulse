from rest_framework import authentication, exceptions
from apps.services import supabase_client
import logging

logger = logging.getLogger(__name__)

class CustomUser:
    def __init__(self, user_id, email, is_admin=False):
        self.id = user_id
        self.email = email
        self.username = email
        self.is_staff = is_admin
        self.is_active = True
        self.is_authenticated = True
        self.is_admin = is_admin
        self.pk = user_id

class SupabaseJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        try:
            parts = auth_header.split()
            if len(parts) != 2 or parts[0].lower() != 'bearer':
                raise exceptions.AuthenticationFailed('Invalid Authorization header')
            token = parts[1]
        except Exception as e:
            logger.error(f"Header parse: {e}")
            raise exceptions.AuthenticationFailed('Invalid header')
        
        try:
            # Use supabase admin client
            user_data = supabase_client.admin.auth.get_user(token)
            if not user_data or not user_data.user:
                raise exceptions.AuthenticationFailed('Invalid token')
            
            supabase_user = user_data.user
            user_id = supabase_user.id
            email = supabase_user.email
            
            # Get or create profile
            profile_resp = supabase_client.admin.table('user_profiles').select('is_admin, approved').eq('id', user_id).execute()
            if not profile_resp.data:
                # Create with auto-approve
                supabase_client.admin.table('user_profiles').insert({
                    'id': user_id,
                    'email': email,
                    'is_admin': False,
                    'approved': True
                }).execute()
                is_admin = False
            else:
                profile = profile_resp.data[0]
                is_admin = profile.get('is_admin', False)
                # Auto-approve if not approved (for testing)
                if not profile.get('approved', False):
                    supabase_client.admin.table('user_profiles').update({'approved': True}).eq('id', user_id).execute()
            
            user = CustomUser(user_id, email, is_admin)
            return (user, token)
        except Exception as e:
            logger.error(f"Auth error: {e}")
            raise exceptions.AuthenticationFailed(str(e))