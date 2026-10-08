from pydantic import BaseModel, ConfigDict, Field


class LoginRequest(BaseModel):
    # Plain str: login only looks the account up, and EmailStr rejects valid
    # internal domains (e.g. .local/.test) that admin accounts may use.
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminUserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
