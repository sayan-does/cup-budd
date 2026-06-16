from pydantic import BaseModel


class VapidPublicKeyResponse(BaseModel):
    publicKey: str  # noqa: N815 - camelCase required by frontend
