import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from intentgraph.parser import CodeParser
from intentgraph.graph import DependencyGraph
import os
from typing import Dict, Any

app = FastAPI()

class AnalyzeRequest(BaseModel):
    directory: str


@app.post("/api/v1/analyze")
def analyze(req: AnalyzeRequest) -> Dict[str, Any]:
    parser = CodeParser()
    graph = DependencyGraph()

    total_nodes = 0

    for root, _, files in os.walk(req.directory):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                nodes, edges = parser.parse_file(path)
                graph.add_nodes(nodes)
                graph.add_edges(edges)
                total_nodes += len(nodes)

    return {"status": "success", "data": {"nodes": total_nodes, "edges": len(graph.graph.edges())}}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
