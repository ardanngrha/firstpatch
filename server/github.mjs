import {HttpError,githubPR} from './security.mjs';
export async function readPR(url,token,fetcher=fetch){
  const p=githubPR(url);
  const response=await fetcher(`https://api.github.com/repos/${p.owner}/${p.repo}/pulls/${p.number}`,{
    headers:{Accept:'application/vnd.github+json','User-Agent':'FirstPatch','X-GitHub-Api-Version':'2022-11-28',...(token?{Authorization:`Bearer ${token}`}:{})},
    signal:AbortSignal.timeout(12000)
  });
  if(response.status===401&&token)return readPR(url,null,fetcher);
  if(response.status===404)throw new HttpError(404,'This public pull request is unavailable.');
  if(response.status===403||response.status===429)throw new HttpError(429,'GitHub checks are temporarily limited. Please try later.');
  if(!response.ok)throw new HttpError(503,'GitHub could not be checked. Existing progress is unchanged.');
  const pr=await response.json();
  if(pr.base?.repo?.private!==false)throw new HttpError(400,'Only public repository pull requests can be tracked.');
  return {url:pr.html_url,repository:pr.base.repo.full_name,author_id:String(pr.user.id),title:pr.title,state:pr.merged_at?'merged':pr.state==='open'?'open':'closed',opened_at:pr.created_at,merged_at:pr.merged_at||null};
}
export function verifyPR(fact,identity,saved){if(!identity||fact.author_id!==String(identity))throw new HttpError(400,'Link a pull request authored by your signed-in GitHub account.');if(fact.repository.toLowerCase()!==saved.repository.toLowerCase())throw new HttpError(400,'The pull request must target the saved issue’s repository.');return fact;}
