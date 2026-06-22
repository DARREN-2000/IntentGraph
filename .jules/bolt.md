## 2024-06-25 - Avoid Pydantic model_dump in tight loops
**Learning:** Calling Pydantic's `model_dump()` inside tight data ingestion loops (like NetworkX graph edge/node addition) introduces significant overhead.
**Action:** Prefer manual dictionary construction and batched networkx methods (`add_nodes_from`, `add_edges_from`) for performance-critical paths.
