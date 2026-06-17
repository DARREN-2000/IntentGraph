import ast
import os
from typing import List, Tuple

from intentgraph.models import Node, Edge
from intentgraph.logger import setup_logger

logger = setup_logger(__name__)

class CodeParser:
    def __init__(self) -> None:
        pass

    def parse_file(self, filepath: str) -> Tuple[List[Node], List[Edge]]:
        nodes: List[Node] = []
        edges: List[Edge] = []

        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
        except OSError as e:
            logger.error(f"Failed to read file {filepath}: {e}")
            return nodes, edges
        except UnicodeDecodeError as e:
            logger.error(f"Encoding error in file {filepath}: {e}")
            return nodes, edges

        try:
            tree = ast.parse(content, filename=filepath)
        except SyntaxError as e:
            logger.error(f"Syntax error in file {filepath}: {e}")
            return nodes, edges
        except Exception as e:
            logger.error(f"Unexpected error parsing file {filepath}: {e}")
            return nodes, edges

        file_id = filepath
        nodes.append(Node(
            id=file_id,
            name=os.path.basename(filepath),
            type="file",
            filepath=filepath,
        ))

        # We'll use an AST visitor to extract classes, functions, and imports
        class DependencyVisitor(ast.NodeVisitor):
            def __init__(self) -> None:
                self.current_parent = file_id

            def visit_Import(self, node: ast.Import) -> None:
                for alias in node.names:
                    import_id = f"import_{alias.name}"
                    nodes.append(Node(
                        id=import_id,
                        name=alias.name,
                        type="import",
                        filepath=filepath,
                        start_line=node.lineno,
                        end_line=node.end_lineno
                    ))
                    edges.append(Edge(source=self.current_parent, target=import_id, type="imports"))
                self.generic_visit(node)

            def visit_ImportFrom(self, node: ast.ImportFrom) -> None:
                module = node.module or ""
                for alias in node.names:
                    name = f"{module}.{alias.name}" if module else alias.name
                    import_id = f"import_{name}"
                    nodes.append(Node(
                        id=import_id,
                        name=name,
                        type="import",
                        filepath=filepath,
                        start_line=node.lineno,
                        end_line=node.end_lineno
                    ))
                    edges.append(Edge(source=self.current_parent, target=import_id, type="imports"))
                self.generic_visit(node)

            def visit_ClassDef(self, node: ast.ClassDef) -> None:
                class_id = f"{filepath}:{node.name}"
                docstring = ast.get_docstring(node)
                nodes.append(Node(
                    id=class_id,
                    name=node.name,
                    type="class",
                    filepath=filepath,
                    start_line=node.lineno,
                    end_line=node.end_lineno,
                    docstring=docstring
                ))
                edges.append(Edge(source=self.current_parent, target=class_id, type="contains"))

                old_parent = self.current_parent
                self.current_parent = class_id
                self.generic_visit(node)
                self.current_parent = old_parent

            def visit_FunctionDef(self, node: ast.FunctionDef) -> None:
                func_id = f"{self.current_parent}:{node.name}"
                docstring = ast.get_docstring(node)
                nodes.append(Node(
                    id=func_id,
                    name=node.name,
                    type="function",
                    filepath=filepath,
                    start_line=node.lineno,
                    end_line=node.end_lineno,
                    docstring=docstring
                ))
                edges.append(Edge(source=self.current_parent, target=func_id, type="contains"))

                old_parent = self.current_parent
                self.current_parent = func_id
                self.generic_visit(node)
                self.current_parent = old_parent

            def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef) -> None:
                self.visit_FunctionDef(node) # type: ignore

            def visit_Call(self, node: ast.Call) -> None:
                if isinstance(node.func, ast.Name):
                    target_name = node.func.id
                    edges.append(Edge(source=self.current_parent, target=f"call_{target_name}", type="calls"))
                elif isinstance(node.func, ast.Attribute) and isinstance(node.func.value, ast.Name):
                    target_name = f"{node.func.value.id}.{node.func.attr}"
                    edges.append(Edge(source=self.current_parent, target=f"call_{target_name}", type="calls"))
                self.generic_visit(node)

        visitor = DependencyVisitor()
        visitor.visit(tree)

        return nodes, edges
