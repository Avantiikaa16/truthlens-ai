import asyncio
import sys

if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, investigate, investigations

app = FastAPI(
    title="TruthLens API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://avantika-truthlens-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(investigations.router)
app.include_router(investigate.router)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "TruthLens",
    }
