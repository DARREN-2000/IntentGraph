import os
from intentgraph.orchestrator import Orchestrator

def test_orchestrator_process_directory() -> None:
    orchestrator = Orchestrator()

    # Run orchestrator on tests directory which has sample.py
    current_dir = os.path.dirname(__file__)

    graph_data = orchestrator.process_directory(current_dir)

    # Verify graph data contains nodes
    assert len(graph_data.nodes) > 0

    # Check that sample.py contents were included
    sample_nodes = [n for n in graph_data.nodes if "sample.py" in n.filepath and n.name == "DummyService"]
    assert len(sample_nodes) > 0
