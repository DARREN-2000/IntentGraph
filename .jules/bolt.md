## 2024-06-16 - Avoid Chained Array Methods on Large Data
**Learning:** In the `services/audit/src/index.ts` file, the `query` method was applying multiple chained `.filter()` operations on the audit log events array (potentially large sets of data). This created an intermediate array for each query condition, leading to multiple passes over the dataset and unnecessary memory allocations.
**Action:** Always combine conditions into a single `.filter()` pass when working with potentially large datasets to improve performance, save memory, and reduce iteration time.
