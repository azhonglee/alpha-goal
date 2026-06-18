#!/usr/bin/env -S npx --yes tsx
import{spawnSync as x}from"node:child_process";
const o=(a:string[])=>x("git",a,{encoding:"utf8"}).stdout?.trim()||"<empty>", ok=(a:string[])=>x("git",a,{stdio:"ignore"}).status===0, s=(n:string,v:string)=>console.log(`\n== ${n} ==\n${v}`);
const home=process.env.CODEX_HOME||`${process.env.HOME||"~"}/.codex`, slug=(p:string)=>p.replace(/^\/+/,"").replace(/[^A-Za-z0-9_.-]+/g,"-").slice(-80)||"workspace", state=(p:string)=>process.env.ALPHA_GOAL_STATE_ROOT||`${home}/state/alpha-goal/${slug(p)}`, local=(r:string,v:string)=>v===".alpha-goal"||v.startsWith(".alpha-goal/")||v===`${r}/.alpha-goal`||v.startsWith(`${r}/.alpha-goal/`);
s("cwd",process.cwd()); if(!ok(["rev-parse","--is-inside-work-tree"])){s("alpha goal state root",state(process.cwd()));s("git","not inside work tree");process.exit(0)}
const root=o(["rev-parse","--show-toplevel"]), b=o(["branch","--show-current"]); s("git root",root); s("branch",b); s("primary branch risk",["main","master","trunk"].includes(b)?"yes":"no/unknown"); s("status",o(["status","--short"])); s("worktrees",o(["worktree","list"])); s("submodules",o(["submodule","status"]));
const stateRoot=state(root); s("alpha goal state root",stateRoot);
console.log(`.worktrees/codex/preflight-check: ${ok(["check-ignore","-q",".worktrees/codex/preflight-check"])?"ignored":"NOT ignored"}`);
if(local(root,stateRoot))console.log(`.alpha-goal/preflight-check: ${ok(["check-ignore","-q",".alpha-goal/preflight-check"])?"ignored":"NOT ignored"} (required because repo-local state root is used)`);
s("diff check",ok(["diff","--check"])?"pass":"fail"); s("reminder","Git evidence only; inspect rules, ownership, tests, and semantics separately.");
