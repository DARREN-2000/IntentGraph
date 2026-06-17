## 2024-06-16 - Timing attack fix via crypto.timingSafeEqual
**Vulnerability:** Timing attack possible via variable-time string comparison for authorization headers (`===` instead of `crypto.timingSafeEqual`).
**Learning:** `crypto.timingSafeEqual` strictly checks that both `Buffer` inputs are of equal length. Checking string length prior to comparison with `timingSafeEqual` is insufficient and risks a DoS due to potential differences between string length and byte length (e.g. unicode multi-byte characters).
**Prevention:** Convert strings to buffers *before* checking their `.byteLength` property, and only if `.byteLength` matches should the buffers be passed to `crypto.timingSafeEqual`.
