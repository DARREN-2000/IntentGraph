import typer
from rich import print as rprint
import os

from intentgraph.orchestrator import Orchestrator

app = typer.Typer(
    help="IntentGraph CLI - Build cross-file dependency graphs for AI context."
)

@app.command()
def parse(
    directory: str = typer.Argument(
        ".", help="The directory to parse. Defaults to current directory."
    ),
    output: str = typer.Option(
        None, "--output", "-o", help="Optional output file to save the JSON graph."
    ),
    pretty: bool = typer.Option(
        False, "--pretty", "-p", help="Pretty print the JSON output."
    )
) -> None:
    """
    Parse a codebase and generate a dependency graph.
    """
    if not os.path.isdir(directory):
        rprint(f"[red]Error: Directory '{directory}' does not exist.[/red]")
        raise typer.Exit(code=1)

    rprint(f"[blue]Starting analysis of {directory}...[/blue]")
    orchestrator = Orchestrator()
    graph_data = orchestrator.process_directory(directory)

    # Use pydantic's model_dump_json for serialization
    json_data = graph_data.model_dump_json(indent=2 if pretty else None)

    if output:
        with open(output, "w", encoding="utf-8") as f:
            f.write(json_data)
        rprint(f"[green]Successfully generated graph and saved to {output}[/green]")
    else:
        rprint("[green]Successfully generated graph:[/green]")
        print(json_data)

if __name__ == "__main__":
    app()
