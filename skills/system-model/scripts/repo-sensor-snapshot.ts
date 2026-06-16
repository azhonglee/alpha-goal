#!/usr/bin/env -S npx --yes tsx
import {spawnSync} from "node:child_process";
import fs from "node:fs";
function run(c:string,a:string[]){const r=spawnSync(c,a,{encoding:"utf8"}); return r.status===0?(r.stdout.trim()||"<empty>"):`<failed:${r.status}>`;}
function section(n:string,v:string){console.log(`\n== ${n} ==\n${v}`)}
section("cwd",process.cwd());
section("git root",run("git",["rev-parse","--show-toplevel"]));
section("branch",run("git",["branch","--show-current"]));
section("status",run("git",["status","--short"]));
section("worktrees",run("git",["worktree","list"]));
section("submodules",run("git",["submodule","status"]));
const names=["AGENTS.md","AGENTS.override.md","CLAUDE.md","code_review.md","README.md","package.json","pyproject.toml","go.mod","Cargo.toml","Makefile"];
const hits:string[]=[]; for(const n of names){if(fs.existsSync(n)) hits.push(n)}
section("top-level hints",hits.join("\n")||"<none>");
section("reminder","Read-only snapshot; interpret before mutation.");
