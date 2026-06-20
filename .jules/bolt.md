## 2024-06-11 - Pydantic model_dump in hot loops
**Learning:** Calling Pydantic's `model_dump()` inside tight loops (like graph edge/node insertion) introduces significant overhead compared to manual dictionary construction.
**Action:** Avoid `model_dump()` in performance-critical ingestion loops. Unpack models manually into dicts and use batched `add_nodes_from`/`add_edges_from` with generator expressions.
