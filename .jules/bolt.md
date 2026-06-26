## 2025-06-25 - Avoid Pydantic model_dump() in NetworkX Ingestion Loops
**Learning:** Calling Pydantic's `model_dump()` inside tight data ingestion loops (like NetworkX graph edge/node addition) introduces significant performance overhead (~40% slower) in this architecture.
**Action:** Prefer manual dictionary construction and batched networkx methods (`add_nodes_from`, `add_edges_from`) for performance-critical paths when ingesting node or edge lists.
