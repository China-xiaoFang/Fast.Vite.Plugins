# Risk guide

These plugins run with the build process's file and network trust. Review every path, remote resource, and generated HTML value as code or deployment configuration.

## Remote CDN code

`cdnImport` injects maintainer-selected remote JavaScript. Pin package versions, restrict allowed origins with CSP, validate availability and CORS, and provide SRI metadata separately when the CDN supports stable bytes. The plugin does not make remote code trusted.

## SVG and raw HTML

`svgIcons` writes SVG markup directly into generated TSX source; only scan reviewed repository SVG files. `htmlTemplate({ escape: false })` must receive trusted static content, never user-controlled values.

## Build metadata

`buildInfo` and the SRI manifest can disclose versions, commit identifiers, build modes, file names, and deployment structure. Emit and cache only the fields your public deployment may expose.

## Static copy and filesystem boundaries

`staticCopy` can read maintainer-selected sources and write into the active output directory. Sources and destinations must not overlap, target each other, or traverse symlinks/junctions. Review transformed content and every multi-output destination.

## SRI and publicDir

SRI only hashes files in the current bundle. `publicDir` files are outside that bundle and cannot be validated automatically; either move them into the build graph, manage their hashes independently, or leave strict mode disabled with a documented exception.

## Precompressed deployment

Compression only emits `.gz` and `.br` siblings. Configure the server to negotiate `Accept-Encoding`, return the correct `Content-Encoding` and content type, vary caches by encoding, and deploy compressed and original files atomically. Keep plugin order SRI → budget → compression.
