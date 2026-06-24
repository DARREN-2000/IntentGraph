import networkx as nx
from typing import List, Dict

from intentgraph.models import Node, Edge, GraphData

class DependencyGraph:
    def __init__(self) -> None:
        self.graph: nx.DiGraph[str] = nx.DiGraph()
        self.node_data: Dict[str, Node] = {}

    def add_node(self, node: Node) -> None:
        self.node_data[node.id] = node
        # Manual dict conversion to avoid Pydantic model_dump overhead in tight loops
        node_dict = {
            "id": node.id,
            "name": node.name,
            "type": node.type,
            "filepath": node.filepath,
            "start_line": node.start_line,
            "end_line": node.end_line,
            "docstring": node.docstring,
            "metadata": node.metadata,
        }
        self.graph.add_node(node.id, **node_dict)

    def add_nodes(self, nodes: List[Node]) -> None:
        # Batch populate node data and use networkx add_nodes_from for performance
        node_batch = []
        for node in nodes:
            self.node_data[node.id] = node
            node_batch.append((
                node.id,
                {
                    "id": node.id,
                    "name": node.name,
                    "type": node.type,
                    "filepath": node.filepath,
                    "start_line": node.start_line,
                    "end_line": node.end_line,
                    "docstring": node.docstring,
                    "metadata": node.metadata,
                }
            ))
        self.graph.add_nodes_from(node_batch)

    def add_edge(self, edge: Edge) -> None:
        # We might add edges where the target doesn't exist yet (e.g. external imports or unparsed files)
        self.graph.add_edge(edge.source, edge.target, type=edge.type, metadata=edge.metadata)

    def add_edges(self, edges: List[Edge]) -> None:
        # Batch populate edges using networkx add_edges_from for performance
        edge_batch = [
            (edge.source, edge.target, {"type": edge.type, "metadata": edge.metadata})
            for edge in edges
        ]
        self.graph.add_edges_from(edge_batch)

    def export_to_pydantic(self) -> GraphData:
        exported_nodes: List[Node] = []
        exported_edges: List[Edge] = []

        for node_id in self.graph.nodes:
            if node_id in self.node_data:
                exported_nodes.append(self.node_data[node_id])
            else:
                # Stub node for unresolved dependencies
                exported_nodes.append(Node(
                    id=node_id,
                    name=node_id.split("_", 1)[-1] if "_" in node_id else node_id,
                    type="module",
                    filepath="unknown"
                ))

        for source, target, data in self.graph.edges(data=True):
            exported_edges.append(Edge(
                source=source,
                target=target,
                type=data.get("type", "unknown"),
                metadata=data.get("metadata", {})
            ))

        return GraphData(nodes=exported_nodes, edges=exported_edges)
