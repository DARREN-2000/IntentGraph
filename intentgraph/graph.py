import networkx as nx
from typing import List, Dict

from intentgraph.models import Node, Edge, GraphData

class DependencyGraph:
    def __init__(self) -> None:
        self.graph: nx.DiGraph[str] = nx.DiGraph()
        self.node_data: Dict[str, Node] = {}

    def add_node(self, node: Node) -> None:
        self.node_data[node.id] = node
        # Avoiding Pydantic's model_dump() for performance
        self.graph.add_node(
            node.id,
            id=node.id,
            name=node.name,
            type=node.type,
            filepath=node.filepath,
            start_line=node.start_line,
            end_line=node.end_line,
            docstring=node.docstring,
            metadata=node.metadata,
        )

    def add_nodes(self, nodes: List[Node]) -> None:
        # Update node data dictionary in bulk
        self.node_data.update({node.id: node for node in nodes})

        # Use add_nodes_from with a generator for better performance
        # Avoiding Pydantic's model_dump() for performance
        self.graph.add_nodes_from(
            (
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
            )
            for node in nodes
        )

    def add_edge(self, edge: Edge) -> None:
        # We might add edges where the target doesn't exist yet (e.g. external imports or unparsed files)
        self.graph.add_edge(edge.source, edge.target, type=edge.type, metadata=edge.metadata)

    def add_edges(self, edges: List[Edge]) -> None:
        # Use add_edges_from with a generator for better performance
        self.graph.add_edges_from(
            (edge.source, edge.target, {"type": edge.type, "metadata": edge.metadata})
            for edge in edges
        )

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
