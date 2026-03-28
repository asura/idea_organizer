"""Enumerations for the Research Idea Organizer graph model."""

from enum import StrEnum


class NodeType(StrEnum):
    CONCEPT = "concept"
    PAPER = "paper"
    IDEA = "idea"
    QUESTION = "question"
    EVIDENCE = "evidence"
    HYPOTHESIS = "hypothesis"
    DECISION = "decision"


class EdgeType(StrEnum):
    RELATES_TO = "RELATES_TO"
    SUPPORTS = "SUPPORTS"
    CONTRADICTS = "CONTRADICTS"
    EXTENDS = "EXTENDS"
    REQUIRES = "REQUIRES"
    INSPIRES = "INSPIRES"
    EVALUATES = "EVALUATES"
    COMPETES_WITH = "COMPETES_WITH"


class Confidence(StrEnum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class HypothesisStatus(StrEnum):
    DRAFT = "draft"
    TESTING = "testing"
    SUPPORTED = "supported"
    REFUTED = "refuted"
    REVISED = "revised"


class DecisionType(StrEnum):
    ADOPT = "adopt"
    HOLD = "hold"
    REJECT = "reject"
    PARK = "park"


class DecisionStatus(StrEnum):
    ACTIVE = "active"
    SUPERSEDED = "superseded"


class EdgeStatus(StrEnum):
    IDEA = "idea"
    PLAUSIBLE = "plausible"
    CHECKED = "checked"
    REJECTED = "rejected"
