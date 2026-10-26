const origin=process.env.FIRSTPATCH_ORIGIN||'https://firstpatch.pages.dev';
if(!process.env.FIRSTPATCH_JOB_KEY)throw new Error('FIRSTPATCH_JOB_KEY is required.');
let checked=0;
for(let batch=0;batch<20;batch++){
  const result=await fetch(origin+'/api/jobs/progress',{method:'POST',headers:{Authorization:'Bearer '+process.env.FIRSTPATCH_JOB_KEY,...(process.env.GH_TOKEN?{'X-GitHub-Token':process.env.GH_TOKEN}:{})},signal:AbortSignal.timeout(90000)});
  if(!result.ok)throw new Error(`Progress sync endpoint returned ${result.status}. No private response data is logged.`);
  const status=await result.json();checked+=status.checked;
  if(status.failed)throw new Error('Some PR checks failed; previous facts were retained.');
  if(status.limited)throw new Error('GitHub deferred checks due to rate limiting; previous facts were retained.');
  if(status.checked<status.batchLimit)break;
}
console.log(`Checked ${checked} tracked PRs. No deploy was requested.`);
