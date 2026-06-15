#!/usr/bin/env -S npx --yes tsx
// Compatibility entry point for validating this skill suite.

import { main } from "./validate_skills.ts";

process.exit(main(process.argv.slice(2)));
