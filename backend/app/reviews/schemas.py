from pydantic import BaseModel, ConfigDict, Field

MIN_COMMENT = 10
MAX_COMMENT = 1000


class ReviewCreate(BaseModel):
    """A guest's review of one completed stay. The listing and author come from the booking."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    rating: int = Field(ge=1, le=5, description="Whole stars, 1–5")
    comment: str = Field(min_length=MIN_COMMENT, max_length=MAX_COMMENT)
