from fastapi import APIRouter

router = APIRouter()

@router.get("/royalty-discovery")
async def royalty_discovery(userId: str):
    await db.connect()
    user = await db.user.find_unique(
        where={"id": userId},
        include={"tracks": True}
    )
    await db.disconnect()
    return user
