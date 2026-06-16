#!/usr/bin/env -S npx --yes tsx
import {spawnSync} from "node:child_process";
function out(c:string,a:string[]){const r=spawnSync(c,a,{encoding:"utf8"}); return r.status===0?(r.stdout.trim()||"<empty>"):`<failed:${r.status}>`}
function ok(c:string,a:string[]){return spawnSync(c,a,{stdio:"ignore"}).status===0}
function s(n:string,v:string){console.log(`\n== ${n} ==\n${v}`)}
s("cwd",process.cwd());
if(!ok("git",["rev-parse","--is-inside-work-tree"])) {s("git","not inside work tree"); process.exit(0)}
s("git root",out("git",["rev-parse","--show-toplevel"])); s("branch",out("git",["branch","--show-current"]));
s("status",out("git",["status","--short"])); s("unstaged files",out("git",["diff","--name-only"])); s("staged files",out("git",["diff","--cached","--name-only"]));
s("diff stat",out("git",["diff","--stat"])); s("cached diff stat",out("git",["diff","--cached","--stat"]));
s("diff check",ok("git",["diff","--check"])?"pass":"fail"); s("recent commits",out("git",["log","--oneline","-5"]));
s("reminder","Read-only evidence summary. Map every requirement to authoritative evidence manually.");
