<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Build policy

- Do not run `npm run build` automatically in this repository.
- Treat build verification as opt-in only. Use lighter checks first when possible.
- Only run a build when the user explicitly asks for it or explicitly invokes the custom `check-build` Codex prompt for this project (shown in the slash menu as `/prompts:check-build`).
- When build verification is authorized, prefer `npm run check-build` over `npm run build`.
