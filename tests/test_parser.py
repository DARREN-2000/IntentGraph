import os
from intentgraph.parser import CodeParser

def test_parser_extracts_nodes_and_edges() -> None:
    parser = CodeParser()
    sample_path = os.path.join(os.path.dirname(__file__), "sample.py")
    nodes, edges = parser.parse_file(sample_path)

    # File node + 1 import (sys) + 1 class + 2 class methods + 1 function
    assert len(nodes) >= 5

    # Check if the class is found
    class_nodes = [n for n in nodes if n.type == "class" and n.name == "DummyService"]
    assert len(class_nodes) == 1

    # Check if the function is found
    func_nodes = [n for n in nodes if n.type == "function" and n.name == "help_function"]
    assert len(func_nodes) == 1

    # Check imports
    import_nodes = [n for n in nodes if n.type == "import" and n.name == "sys"]
    assert len(import_nodes) == 1

    # Check that edges exist connecting file to class/functions
    assert len(edges) > 0
