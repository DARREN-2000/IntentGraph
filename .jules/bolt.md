## 2024-05-15 - Pydantic model_dump overhead in NetworkX graphs
**Learning:** Calling Pydantic's `model_dump()` inside tight data ingestion loops (like NetworkX graph edge/node addition) introduces significant performance overhead, leading to slower execution times, especially when handling large dependency graphs.
**Action:** Prefer manual dictionary construction and batched networkx methods (`add_nodes_from`, `add_edges_from`) over individual additions with `model_dump()` for performance-critical paths in graph construction.
