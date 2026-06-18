## 2026-06-18 - [DoS Prevention added in parser]
**Vulnerability:** File parser could read unboundingly large files into memory, potentially causing DoS.
**Learning:** `os.path.getsize` check added to prevent opening excessively large files. Added `os.path.isdir` check for orchestration logic.
**Prevention:** Always validate sizes for file opening in parsers to prevent resource exhaustion.
