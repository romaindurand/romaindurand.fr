#!/usr/bin/bash

# prisma and twoslash are using __dirname ,__filename and require which are not available in esm
# based on https://github.com/prisma/prisma/issues/15614#issuecomment-2126271831

sed -i '/await server.init/i \
import { createRequire } from "module"; \
globalThis.require = createRequire(import.meta.url); \
globalThis.__filename = fileURLToPath(import.meta.url); \
globalThis.__dirname = path.dirname(__filename);' build/handler.js