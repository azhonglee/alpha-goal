#!/usr/bin/env -S npx --no-install tsx
import{spawnSync as x}from"node:child_process";
const o=(a:string[])=>{const r=x("git",a,{encoding:"utf8"});return r.status===0?(r.stdout.trim()||"<empty>"):`<failed:${r.status}>`}, ok=(a:string[])=>x("git",a,{stdio:"ignore"}).status===0, s=(n:string,v:string)=>console.log(`\n== ${n} ==\n${v}`);
s("cwd",process.cwd()); if(!ok(["rev-parse","--is-inside-work-tree"])){s("git","not inside work tree");process.exit(0)}
for(const [n,a] of [["git root",["rev-parse","--show-toplevel"]],["branch",["branch","--show-current"]],["status",["status","--short"]],["unstaged",["diff","--name-only"]],["staged",["diff","--cached","--name-only"]],["diff stat",["diff","--stat"]],["cached stat",["diff","--cached","--stat"]],["recent commits",["log","--oneline","-5"]]] as [string,string[]][])s(n,o(a));
s("diff check",ok(["diff","--check"])?"pass":"fail"); s("reminder","Git evidence only; map requirements to semantic/test evidence manually.");
