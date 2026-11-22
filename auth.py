import os

from fastapi import HTTPException


def verify_student(authorization: str | None) -> str:
    if os.getenv("REQUIRE_AUTH", "true").lower() != "true":
        return "anonymous"

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Log in to use Mario's voice.")

    project_id = os.getenv("FIREBASE_PROJECT_ID")
    if not project_id:
        raise HTTPException(status_code=500, detail="The server is missing FIREBASE_PROJECT_ID.")

    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token

    token = authorization.split(" ", 1)[1]
    try:
        claims = id_token.verify_firebase_token(token, google_requests.Request(), audience=project_id)
    except ValueError:
        claims = None

    if not claims:
        raise HTTPException(status_code=401, detail="Your session has expired. Log in again.")
    return claims.get("sub", "unknown")
