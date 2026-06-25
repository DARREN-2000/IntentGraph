## 2024-05-24 - DoS risk from unrestricted file reads
**Vulnerability:** The application reads file contents into memory without verifying the file is a regular file or checking its size. This could lead to infinite reads from device files or memory exhaustion from large files, resulting in Denial of Service (DoS).
**Learning:** File parsing operations must include input validation. `open(filepath).read()` is unsafe without prior checks.
**Prevention:** Implement an application-level constant `MAX_FILE_SIZE` and ensure the path is a regular file via `os.path.isfile(filepath)` and within size limits via `os.path.getsize(filepath)` prior to reading content into memory.
