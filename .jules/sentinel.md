## 2025-02-14 - Prevent Denial of Service in File Parsers
**Vulnerability:** File parsing operations were reading contents directly into memory without ensuring the file size was bounded and the path was a regular file, creating potential Denial of Service (DoS) and infinite read issues (e.g. from `/dev/urandom` or massively large files).
**Learning:** All file loading methods must implement size limits and file type validations before interacting with the file content.
**Prevention:** Implement `os.path.isfile(filepath)` and check `os.path.getsize(filepath) <= MAX_FILE_SIZE` prior to executing `open()` across the codebase.
