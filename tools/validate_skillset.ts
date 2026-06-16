#!/usr/bin/env -S npx --yes tsx
// 技能套件校验的兼容入口。

import { main } from "./validate_skills.ts";

process.exit(main(process.argv.slice(2)));
