#!/usr/bin/env -S npx --no-install tsx
import{spawnSync as x}from"node:child_process";
import{existsSync}from"node:fs";
import{basename,resolve}from"node:path";
const g=(cwd:string,a:string[],stdio:"pipe"|"ignore"="pipe")=>x("git",a,{cwd,encoding:"utf8",stdio}), o=(cwd:string,a:string[])=>{const r=g(cwd,a);return r.stdout?.trim()||r.stderr?.trim()||"<empty>"}, ok=(cwd:string,a:string[])=>g(cwd,a,"ignore").status===0, s=(n:string,v:string)=>console.log(`\n== ${n} ==\n${v}`);
const home=(process.env.CODEX_HOME||`${process.env.HOME||"~"}/.alphal-goal`).replace(/\/+$/,""), session=process.cwd(), state=`${home}/${basename(session)||"workspace"}/`;
const raw=process.argv.slice(2), ti=raw.indexOf("--task"), task=ti>=0&&raw[ti+1]?raw[ti+1]:"<YYYYMMDD-TaskName>", args=ti>=0?raw.filter((_,i)=>i!==ti&&i!==ti+1):raw, targets=(args.length?args:[session]).map(p=>resolve(session,p)), taskDir=`${state}${task}/`;
s("cwd",session); s("alpha goal state root",state); s("multi-repo preflight",targets.length>1?`${targets.length} repos`:"single repo");
s("run profile path",`${taskDir}run-profile.md`); s("trigger","record Run mode and Trigger Contract from run-profile.md / Goal Contract"); s("autonomy level","record Autonomy level and requested action gate"); s("loop-state path",`${taskDir}loop-state.md`); s("memory path",`${taskDir}memory.md`); s("evaluator route","record Evaluator route and required $evidence-verify handoff");
for(const [i,target]of targets.entries()){
  console.log(`\n## repo ${i+1}: ${target}`);
  if(!existsSync(target)){s("path","missing");continue}
  if(!ok(target,["rev-parse","--is-inside-work-tree"])){s("git","not inside work tree");continue}
  const root=o(target,["rev-parse","--show-toplevel"]), b=o(root,["branch","--show-current"]);
  s("git root",root); s("branch",b); s("primary branch risk",["main","master","trunk"].includes(b)?"yes":"no/unknown"); s("status",o(root,["status","--short"])); s("worktrees",o(root,["worktree","list"])); s("submodules",o(root,["submodule","status"]));
  console.log(`.worktrees/codex/preflight-check: ${ok(root,["check-ignore","-q",".worktrees/codex/preflight-check"])?"ignored":"NOT ignored"}`);
  s("diff check",ok(root,["diff","--check"])?"pass":"fail");
}
s("reminder","Git evidence only; inspect rules, ownership, tests, repo manifest, integration evidence, and semantics separately.");
