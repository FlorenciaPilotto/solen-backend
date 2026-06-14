from pydantic import BaseModel, Field


class CoachMessageIn(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


class CoachMessageOut(BaseModel):
    id: int
    role: str
    content: str
    created_at: str


class CoachReplyOut(BaseModel):
    reply: CoachMessageOut
