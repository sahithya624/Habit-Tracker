from __future__ import annotations

from datetime import timedelta

from fastapi import HTTPException, status

from app.auth.schemas import TokenResponse, UserLogin, UserProfile, UserProfileUpdate, UserRegister
from app.auth.utils import create_access_token
from app.config import settings
from app.database import get_supabase_user_client, supabase


async def register_user(data: UserRegister) -> TokenResponse:
    try:
        auth_response = supabase.auth.sign_up(
            {
                "email": data.email,
                "password": data.password,
                "options": {"data": {"full_name": data.full_name}},
            }
        )

        user = getattr(auth_response, "user", None)
        session = getattr(auth_response, "session", None)

        if user is None and session is not None:
            user = getattr(session, "user", None)

        if user is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unable to create Supabase user")

        profile_payload = {
            "id": user.id,
            "email": data.email,
            "full_name": data.full_name,
        }
        supabase.table("profiles").upsert(profile_payload).execute()

        if session is None:
            sign_in = supabase.auth.sign_in_with_password({"email": data.email, "password": data.password})
            session = getattr(sign_in, "session", None)

        if session is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration complete. Please verify your email and log in.",
            )

        token_payload = {
            "sub": user.id,
            "email": data.email,
            "full_name": data.full_name,
            "supabase_token": session.access_token,
        }

        access_token = create_access_token(
            token_payload,
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user.id,
            email=data.email,
            full_name=data.full_name,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Registration failed: {exc}") from exc


async def login_user(data: UserLogin) -> TokenResponse:
    try:
        auth_response = supabase.auth.sign_in_with_password({"email": data.email, "password": data.password})
        session = getattr(auth_response, "session", None)
        user = getattr(auth_response, "user", None)

        if session is None or user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        user_client = get_supabase_user_client(session.access_token)
        profile_resp = user_client.table("profiles").select("*").eq("id", user.id).single().execute()
        profile = profile_resp.data or {}

        metadata = getattr(user, "user_metadata", {}) or {}
        full_name = profile.get("full_name") or metadata.get("full_name")

        token_payload = {
            "sub": user.id,
            "email": data.email,
            "full_name": full_name,
            "supabase_token": session.access_token,
        }
        access_token = create_access_token(
            token_payload,
            expires_delta=timedelta(minutes=settings.access_token_expire_minutes),
        )

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            user_id=user.id,
            email=data.email,
            full_name=full_name,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Login failed: {exc}") from exc


async def get_current_user(user_id: str, supabase_token: str) -> UserProfile:
    try:
        user_client = get_supabase_user_client(supabase_token)
        profile_resp = user_client.table("profiles").select("*").eq("id", user_id).single().execute()
        if not profile_resp.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        return UserProfile(**profile_resp.data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Could not fetch profile: {exc}") from exc


async def update_profile(user_id: str, supabase_token: str, data: UserProfileUpdate) -> UserProfile:
    update_payload = data.model_dump(exclude_none=True)
    if not update_payload:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No profile fields provided")

    try:
        user_client = get_supabase_user_client(supabase_token)
        user_client.table("profiles").update(update_payload).eq("id", user_id).execute()
        response = user_client.table("profiles").select("*").eq("id", user_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        return UserProfile(**response.data)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Profile update failed: {exc}") from exc
