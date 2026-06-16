#!/usr/bin/env -S npx --yes tsx
import {spawnSync} from "node:child_process";
function out(c:string,a:string[],stdio:any="pipe"){return spawnSync(c,a,{encoding:"utf8",stdio}).stdout?.trim()||""}
function ok(c:string,a:string[]){return spawnSync(c,a,{stdio:"ignore"}).status===0}
function s(n:string,v:string){console.log(`\n== ${n} ==\n${v||"<empty>"}`)}
s("cwd",process.cwd());
if(!ok("git",["rev-parse","--is-inside-work-tree"])) {s("git","not inside work tree"); process.exit(0)}
const root=out("git",["rev-parse","--show-toplevel"]); const branch=out("git",["branch","--show-current"]);
s("git root",root); s("branch",branch||"<detached>");
s("primary branch risk",["main","master","trunk"].includes(branch)?"yes":"no/unknown");
s("status",out("git",["status","--short"])); s("worktrees",out("git",["worktree","list"])); s("submodules",out("git",["submodule","status"]));
for(const p of [".worktrees/codex/preflight-check",".alpha-goal/preflight-check"]){console.log(`${p}: ${ok("git",["check-ignore","-q",p])?"ignored":"NOT ignored"}`)}
s("diff check",ok("git",["diff","--check"])?"pass":"fail");
s("reminder","Read-only preflight. Decide mutation safety from contract, rules, dirty state, ownership, and evidence floor.");
