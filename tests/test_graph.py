from intentgraph.graph import DependencyGraph
from intentgraph.models import Node, Edge

def test_graph_add_nodes_edges() -> None:
    graph = DependencyGraph()

    n1 = Node(id="file1.py", name="file1.py", type="file", filepath="file1.py")
    n2 = Node(id="file1.py:MyClass", name="MyClass", type="class", filepath="file1.py")

    e1 = Edge(source="file1.py", target="file1.py:MyClass", type="contains")

    graph.add_nodes([n1, n2])
    graph.add_edges([e1])

    exported = graph.export_to_pydantic()
    assert len(exported.nodes) == 2
    assert len(exported.edges) == 1
    assert exported.nodes[0].id == "file1.py"
    assert exported.edges[0].target == "file1.py:MyClass"
