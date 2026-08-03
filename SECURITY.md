# Security policy

## Supported versions

Security fixes are provided for the latest released version of the current major.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Email `2875616188@qq.com` with the subject `fast-vite-plugins security report` and include:

- affected version and environment;
- a minimal reproduction or proof of concept;
- impact and attack prerequisites;
- any suggested mitigation.

Do not include production credentials or personal data. Maintainers should acknowledge a complete report within seven days and coordinate disclosure after a fix is available.

## Security boundaries

- `svgIcons` must only process trusted repository SVG files.
- `htmlTemplate({ escape: false })` must only receive trusted data.
- `cdnImport` executes resources selected by project maintainers; pin versions and use integrity attributes when your deployment requires them.
- `staticCopy` restricts destinations to Vite `outDir`, but source paths remain an explicit maintainer-controlled capability.
