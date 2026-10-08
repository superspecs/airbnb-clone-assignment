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
from app.db import get_db
from app.listings.router import router as listings_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    create_tables()
    if settings.seed_on_startup:
        seed_if_empty()
    yield


app = FastAPI(title="Stays API", version="0.1.0", lifespan=lifespan)

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


api.include_router(listings_router)
app.include_router(api)
