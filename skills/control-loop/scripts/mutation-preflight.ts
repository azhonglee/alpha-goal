#!/usr/bin/env -S npx --yes tsx
import{spawnSync as x}from"node:child_process";
import{basename}from"node:path";
const o=(a:string[])=>x("git",a,{encoding:"utf8"}).stdout?.trim()||"<empty>", ok=(a:string[])=>x("git",a,{stdio:"ignore"}).status===0, s=(n:string,v:string)=>console.log(`\n== ${n} ==\n${v}`);
const home=(process.env.CODEX_HOME||`${process.env.HOME||"~"}/.alphal-goal`).replace(/\/+$/,""), session=process.cwd(), state=`${home}/${basename(session)||"workspace"}/`;
s("cwd",session); if(!ok(["rev-parse","--is-inside-work-tree"])){s("alpha goal state root",state);s("git","not inside work tree");process.exit(0)}
const root=o(["rev-parse","--show-toplevel"]), b=o(["branch","--show-current"]); s("git root",root); s("branch",b); s("primary branch risk",["main","master","trunk"].includes(b)?"yes":"no/unknown"); s("status",o(["status","--short"])); s("worktrees",o(["worktree","list"])); s("submodules",o(["submodule","status"]));
s("alpha goal state root",state);
console.log(`.worktrees/codex/preflight-check: ${ok(["check-ignore","-q",".worktrees/codex/preflight-check"])?"ignored":"NOT ignored"}`);
s("diff check",ok(["diff","--check"])?"pass":"fail"); s("reminder","Git evidence only; inspect rules, ownership, tests, and semantics separately.");
