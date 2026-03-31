from __future__ import annotations

from supabase import Client, create_client

from app.config import settings

supabase: Client = create_client(settings.supabase_url, settings.supabase_service_key)



def get_supabase_user_client(jwt_token: str) -> Client:
    """
    Returns a Supabase client authenticated as the user.
    This is required for RLS-compliant access in user-facing routes.
    """
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(jwt_token)
    return client
