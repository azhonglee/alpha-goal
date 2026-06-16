#!/usr/bin/env -S npx --yes tsx
import{spawnSync as x}from"node:child_process";import fs from"node:fs";
const r=(a:string[])=>x("git",a,{encoding:"utf8"}).stdout?.trim()||"<empty>", ok=(a:string[])=>x("git",a,{stdio:"ignore"}).status===0, s=(n:string,v:string)=>console.log(`\n== ${n} ==\n${v}`);
s("cwd",process.cwd()); if(ok(["rev-parse","--is-inside-work-tree"])){for(const [n,a] of [["git root",["rev-parse","--show-toplevel"]],["branch",["branch","--show-current"]],["status",["status","--short"]],["worktrees",["worktree","list"]],["submodules",["submodule","status"]]] as [string,string[]][])s(n,r(a));}
const names=["AGENTS.md","AGENTS.override.md","CLAUDE.md","code_review.md","README.md","package.json","pyproject.toml","go.mod","Cargo.toml","Makefile"];s("top-level hints",names.filter(n=>fs.existsSync(n)).join("\n")||"<none>");s("reminder","Snapshot only; not semantic validation.");
