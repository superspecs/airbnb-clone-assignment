from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import APIRouter, Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.bootstrap import create_tables, seed_if_empty
from app.core.config import settings
from app.core.errors import register_error_handlers
from app.bookings.router import router as bookings_router
from app.db import get_db
from app.host.router import router as host_router
from app.listings.router import router as listings_router
from app.meta.router import router as meta_router
from app.reviews.router import router as reviews_router
from app.users.router import router as users_router
from app.wishlists.router import router as wishlists_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    create_tables()
    if settings.seed_on_startup:
        seed_if_empty()
    yield


app = FastAPI(title="Stays API", version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_error_handlers(app)

api = APIRouter(prefix="/api/v1")


class HealthResponse(BaseModel):
    status: str
    database: str


@api.get("/health", response_model=HealthResponse)
def health(db: Session = Depends(get_db)) -> HealthResponse:
    db.execute(text("SELECT 1"))
    return HealthResponse(status="ok", database="ok")


for feature_router in (
    listings_router,
    bookings_router,
    reviews_router,
    wishlists_router,
    host_router,
    users_router,
    meta_router,
):
    api.include_router(feature_router)
app.include_router(api)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"name": "Stays API", "docs": "/docs", "health": "/api/v1/health"}
