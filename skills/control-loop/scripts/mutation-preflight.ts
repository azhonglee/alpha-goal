#!/usr/bin/env -S npx --yes tsx
import{spawnSync as x}from"node:child_process";
const o=(a:string[])=>x("git",a,{encoding:"utf8"}).stdout?.trim()||"<empty>", ok=(a:string[])=>x("git",a,{stdio:"ignore"}).status===0, s=(n:string,v:string)=>console.log(`\n== ${n} ==\n${v}`);
s("cwd",process.cwd()); if(!ok(["rev-parse","--is-inside-work-tree"])){s("git","not inside work tree");process.exit(0)}
const b=o(["branch","--show-current"]); s("git root",o(["rev-parse","--show-toplevel"])); s("branch",b); s("primary branch risk",["main","master","trunk"].includes(b)?"yes":"no/unknown"); s("status",o(["status","--short"])); s("worktrees",o(["worktree","list"])); s("submodules",o(["submodule","status"]));
for(const p of[".worktrees/codex/preflight-check",".alpha-goal/preflight-check"])console.log(`${p}: ${ok(["check-ignore","-q",p])?"ignored":"NOT ignored"}`);
s("diff check",ok(["diff","--check"])?"pass":"fail"); s("reminder","Git evidence only; inspect rules, ownership, tests, and semantics separately.");
