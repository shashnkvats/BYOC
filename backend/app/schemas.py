from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

QuestionType = Literal["choice", "score", "noul"]
TemplateType = Literal[
    "guardrail", "agent_routing", "mcp_tool_routing", "model_routing", "custom"
]
BelowThresholdAction = Literal["return_as_is", "flag_for_review"]

# Choice/Noul: {"option_key": "plain english description", ...}
# Score: ["Level 0 label", "Level 1 label", ...] (ordered, low -> high)
Criteria = dict[str, str] | list[str]


class QuestionIn(BaseModel):
    key: str = Field(min_length=1, max_length=64, pattern=r"^[a-zA-Z0-9_]+$")
    type: QuestionType
    instructions: str = Field(min_length=1, max_length=2000)
    criteria: Criteria
    confidence_threshold: float = Field(default=0.6, ge=0.0, le=1.0)

    @field_validator("criteria")
    @classmethod
    def validate_criteria_shape(cls, v: Criteria, info: Any) -> Criteria:
        q_type = info.data.get("type")
        if q_type == "score":
            if not isinstance(v, list) or len(v) < 2:
                raise ValueError(
                    "score questions need an ordered list of at least 2 level labels"
                )
        else:
            if not isinstance(v, dict) or len(v) < 2:
                raise ValueError(
                    "choice/noul questions need at least 2 option -> description entries"
                )
        return v


class QuestionOut(QuestionIn):
    id: str
    position: int


class ClassifierCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str | None = None
    template_type: TemplateType = "custom"
    questions: list[QuestionIn] = Field(default_factory=list)
    below_threshold_action: BelowThresholdAction = "return_as_is"


class ClassifierUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    jev_model_version: str | None = None
    questions: list[QuestionIn] | None = None
    below_threshold_action: BelowThresholdAction | None = None


class ClassifierOut(BaseModel):
    id: str
    owner_id: str
    name: str
    slug: str
    description: str | None
    template_type: TemplateType
    jev_model_version: str
    status: Literal["draft", "published"]
    below_threshold_action: BelowThresholdAction
    questions: list[QuestionOut]
    created_at: str
    updated_at: str
    has_api_key: bool = False


class ClassifierSummary(BaseModel):
    id: str
    name: str
    slug: str
    template_type: TemplateType
    status: Literal["draft", "published"]
    updated_at: str


class TestRequest(BaseModel):
    state: str = Field(min_length=1)
    questions: list[QuestionIn] | None = None
    model: str | None = None


class QuestionAnswerFlag(BaseModel):
    key: str
    needs_review: bool
    effective_confidence: float | None


class TestResponse(BaseModel):
    model: str
    answers: dict[str, Any]
    flags: list[QuestionAnswerFlag]
    needs_review: bool
    usage: dict[str, Any] | None = None
    warnings: list[str] = Field(default_factory=list)


class PublishResponse(BaseModel):
    api_key: str
    endpoint_path: str
    classifier: ClassifierOut


class ClassifyRequest(BaseModel):
    state: str = Field(min_length=1)


class ClassifyResponse(BaseModel):
    model: str
    answers: dict[str, Any]
    meta: dict[str, Any]


class LogOut(BaseModel):
    id: str
    created_at: str
    state_excerpt: str | None
    answers: dict[str, Any] | None
    needs_review: bool
    latency_ms: int | None
    jev_model_version_used: str | None


class DraftAIRequest(BaseModel):
    description: str = Field(min_length=10, max_length=4000)
    template_type: TemplateType = "custom"


class DraftAIResponse(BaseModel):
    questions: list[QuestionIn]
    note: str | None = None
