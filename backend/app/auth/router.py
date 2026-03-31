from fastapi import APIRouter, Depends

from app.auth.schemas import TokenResponse, UserLogin, UserProfile, UserProfileUpdate, UserRegister
from app.auth.service import get_current_user, login_user, register_user, update_profile
from app.auth.utils import get_current_user_id, get_supabase_access_token

router = APIRouter(tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
async def register(data: UserRegister) -> TokenResponse:
    return await register_user(data)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin) -> TokenResponse:
    return await login_user(data)


@router.get("/me", response_model=UserProfile)
async def me(
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> UserProfile:
    return await get_current_user(user_id, supabase_token)


@router.put("/profile", response_model=UserProfile)
async def profile_update(
    data: UserProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    supabase_token: str = Depends(get_supabase_access_token),
) -> UserProfile:
    return await update_profile(user_id, supabase_token, data)
