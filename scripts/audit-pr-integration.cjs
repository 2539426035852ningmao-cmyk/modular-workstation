// Read-only branch preflight: writes Git objects and a report, never moves refs.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync, spawnSync} = require('node:child_process');
const git = args => execFileSync('git', args, {encoding: 'utf8'}).trim();
const refs = {
  13: 'origin/docs/s1-lobehub-figma-design-handoff',
  14: 'origin/docs/s1-d1-design-proposal',
  15: 'origin/docs/s1-d2-home-dark',
  16: 'origin/docs/s1-d2-assets-dark',
  17: 'origin/docs/confirmed-workstation-decisions-20261020',
  18: 'origin/docs/s1-d2-plugins-dark',
  19: 'origin/docs/s1-d2-light-comparison',
  20: 'HEAD',
};
const order = [13,14,15,16,18,19,20,17];
const report = {kind: 'simulation only; no branches merged', main: git(['rev-parse','origin/main']), order, steps: []};
let current = report.main;
for (const n of order) {
  const sha = git(['rev-parse',refs[n]]);
  const result = spawnSync('git',['merge-tree','--write-tree',current,sha],{encoding:'utf8'});
  if (![0,1].includes(result.status)) throw new Error(result.stderr || result.stdout);
  let tree = result.stdout.split(/\r?\n/)[0];
  const entry = {pr:n,sha,clean:result.status===0,diagnostics:result.status===1?result.stdout:null};
  if (result.status === 1) {
    if (n !== 17) throw new Error('Unexpected conflict: '+result.stdout);
    const conflicts = [...result.stdout.matchAll(/^CONFLICT .* in (.+)$/gm)].map(m=>m[1].trim());
    if (conflicts.length !== 1 || conflicts[0] !== 'docs/DECISIONS.md') throw new Error('Unexpected conflict paths');
    // Proposed resolution: the reviewed canonical file already includes all 13 decisions.
    const folder = fs.mkdtempSync(path.join(os.tmpdir(),'workstation-p0-index-'));
    const index = path.join(folder,'index');
    const env = {...process.env,GIT_INDEX_FILE:index};
    try {
      execFileSync('git',['read-tree',tree],{env});
      const blob = git(['hash-object','-w','docs/DECISIONS.md']);
      execFileSync('git',['update-index','--add','--cacheinfo','100644',blob,'docs/DECISIONS.md'],{env});
      tree = execFileSync('git',['write-tree'],{env,encoding:'utf8'}).trim();
      entry.proposedResolution = 'Use current docs/DECISIONS.md; approval required before real merge';
    } finally {
      if (fs.existsSync(index)) fs.unlinkSync(index);
      fs.rmdirSync(folder);
    }
  }
  current = git(['commit-tree',tree,'-p',current,'-p',sha,'-m','P0 simulation only']);
  entry.resultTree = tree;
  report.steps.push(entry);
}
report.handoffs = [];
for (const [n,file] of [[13,'docs/HANDOFF_S1_LOBEHUB_FIGMA.md'],[17,'docs/HANDOFF_WORKSTATION_DECISIONS_2026-10-20.md']]) {
  const original = execFileSync('git',['show',refs[n]+':'+file]);
  const integrated = execFileSync('git',['show',current+':'+file]);
  if (!original.equals(integrated)) throw new Error('Handoff changed: '+file);
  report.handoffs.push({pr:n,file,originalPreserved:true});
}
report.finalTree = git(['rev-parse',current+'^{tree}']);
fs.mkdirSync('docs/p0',{recursive:true});
fs.writeFileSync('docs/p0/integration-preflight.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
