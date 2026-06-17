from typing import List, Dict, Optional, Literal
from pydantic import BaseModel, Field

class Node(BaseModel):
    id: str
    name: str
    type: Literal["file", "class", "function", "import", "module"]
    filepath: str
    start_line: Optional[int] = None
    end_line: Optional[int] = None
    docstring: Optional[str] = None
    metadata: Dict[str, str] = Field(default_factory=dict)

class Edge(BaseModel):
    source: str
    target: str
    type: Literal["contains", "calls", "inherits", "imports"]
    metadata: Dict[str, str] = Field(default_factory=dict)

class GraphData(BaseModel):
    nodes: List[Node]
    edges: List[Edge]
    metadata: Dict[str, str] = Field(default_factory=dict)
