import asyncio
import os
from app.services.auth_service import AuthService
from app.schemas.auth import LoginRequest

async def test():
    # Print environment info
    print("MONGO_URI in container:", os.environ.get('MONGO_URI'))
    print("MONGO_DB_NAME in container:", os.environ.get('MONGO_DB_NAME'))
    
    service = AuthService()
    
    # 1. Test database query
    print("Querying database for officer@example.com...")
    user = await service.user_repository.find_by_email("officer@example.com")
    if user is None:
        print("FAIL: User officer@example.com not found in database!")
        return
    else:
        print("SUCCESS: User found in database! Stored hash:", user.hashed_password)
        
    # 2. Test login method
    try:
        print("Running AuthService.login...")
        resp = await service.login(LoginRequest(email="officer@example.com", password="TempPass!23"))
        print("SUCCESS: AuthService login returned a token:", resp.access_token)
    except Exception as e:
        print("FAIL: AuthService login raised an exception:", repr(e))

if __name__ == '__main__':
    asyncio.run(test())
