# Dashboard Navigation Delay

- [x] Reproduce the likely delay path from the current production route timings and route code.
- [x] Trace dashboard data loading and header navigation behavior.
- [x] Remove blocking dashboard story preload from the initial route render.
- [x] Warm the dashboard route from the header before the user clicks.
- [x] Run build verification and review the resulting diff.

## Review

Build passed. Local production route check passed for `/` and `/dashboard` on port 4567. The build now marks `/dashboard` as static, so clicking Dashboard no longer waits on the server story/enrichment preload before rendering the page shell.
