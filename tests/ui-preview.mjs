// Local, in-memory UI fixtures. This server never contacts Supabase or GitHub.
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist');
const snapshot=JSON.parse(await readFile(path.join(root,'data/issues.json'),'utf8'));
let user={id:'qa-fixture',username:'QA fixture'},preferences={theme:'light',presets:[]},saved=[],prs=[];
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://127.0.0.1:4184');
    if(url.pathname.startsWith('/api/')){
      const chunks=[];for await(const c of req)chunks.push(c);
      const body=chunks.length?JSON.parse(Buffer.concat(chunks).toString()):{};
      let result={ok:true};
      if(url.pathname==='/api/session')result={user,preferences};
      else if(!user){res.writeHead(401,{'Content-Type':'application/json'}).end(JSON.stringify({error:'QA fixture session expired.'}));return;}
      else if(url.pathname==='/api/saved'&&req.method==='GET')result={items:saved};
      else if(url.pathname==='/api/saved'&&req.method==='POST'){
        const issue=snapshot.items.find(i=>i.id===body.issue_id);
        if(!issue)throw Error('Unknown fixture issue');
        if(!saved.some(s=>s.issue_id===issue.id))saved.push({id:crypto.randomUUID(),issue_id:issue.id,issue_url:issue.url,repository:issue.repo,title:issue.title,language:issue.language,status:'saved',note:'',created_at:new Date().toISOString(),updated_at:new Date().toISOString()});
      }
      else if(url.pathname.startsWith('/api/saved/')){
        const id=url.pathname.split('/').pop();
        if(req.method==='DELETE')saved=saved.filter(s=>s.id!==id);
        else{const row=saved.find(s=>s.id===id);Object.assign(row,{status:body.status,note:body.note,updated_at:new Date().toISOString()});result={item:row};}
      }
      else if(url.pathname==='/api/prs'&&req.method==='GET')result={items:prs};
      else if(url.pathname==='/api/prs'&&req.method==='POST'){prs.push({id:crypto.randomUUID(),saved_id:body.saved_id,fp_pr_facts:{url:body.url,repository:saved.find(s=>s.id===body.saved_id).repository,title:'QA fixture PR: simulated verification',state:'open',opened_at:new Date().toISOString(),checked_at:new Date().toISOString()}});}
      else if(url.pathname==='/api/prs'&&req.method==='DELETE')prs=prs.filter(p=>p.fp_pr_facts.url!==body.url);
      else if(url.pathname==='/api/preferences')preferences=body;
      else if(url.pathname==='/api/export')result={fixture:true,user,preferences,saved,pull_requests:prs};
      else if(url.pathname==='/api/logout'||url.pathname==='/api/account')user=null;
      res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(result));return;
    }
    let file=path.resolve(root,'.'+url.pathname);if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}
    if((await stat(file)).isDirectory())file=path.join(file,'index.html');
    let data=await readFile(file);
    if(file.endsWith('.html'))data=Buffer.from(data.toString().replace('<body>','<body><aside class="snapshot-notice" role="note">QA fixture environment. Account, notes and PR verification are simulated in memory. No real account data is changed.</aside>'));
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Set-Cookie':'fp-signed-in=1; Path=/; SameSite=Lax'}).end(data);
  }catch{res.writeHead(500).end('QA fixture error');}
}).listen(4184,'127.0.0.1',()=>console.log('UI fixture server: http://127.0.0.1:4184 (not a production preview)'));
