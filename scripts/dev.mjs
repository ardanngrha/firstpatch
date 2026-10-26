import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {base} from './config.mjs';
import {handleAccount} from '../server/account.mjs';
execFileSync(process.execPath,['scripts/build.mjs'],{stdio:'inherit'});
const args=process.argv.slice(2);const port=Number(args[args.indexOf('--port')+1])||4173;
const root=path.resolve('dist');
let accountEnv={};try{accountEnv=Object.fromEntries((await readFile('.dev.vars','utf8')).trim().split('\n').filter(s=>s&&!s.startsWith('#')).map(s=>s.split(/=(.*)/s).slice(0,2)));}catch{}
accountEnv.APP_ORIGIN=`http://127.0.0.1:${port}`;
accountEnv.ASSETS={fetch:async request=>{const pathname=new URL(request.url).pathname;const target=path.resolve(root,'.'+pathname);if(!target.startsWith(root+path.sep))return new Response(null,{status:403});try{return new Response(await readFile(target),{headers:{'Content-Type':'application/json'}});}catch{return new Response(null,{status:404});}}};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.md':'text/plain; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.xml':'application/xml; charset=utf-8','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
if((pathname.startsWith('/api/')||pathname.startsWith('/auth/'))&&!pathname.startsWith('/auth/return/')){
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>8192){res.writeHead(413).end('Request too large');return;}chunks.push(chunk);}
  const response=await handleAccount(new Request(accountEnv.APP_ORIGIN+req.url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(chunks)}:{})}),accountEnv);
  for(const [key,value] of response.headers)if(key!=='set-cookie')res.setHeader(key,value);
  const setCookies=response.headers.getSetCookie();if(setCookies.length)res.setHeader('Set-Cookie',setCookies);
  res.writeHead(response.status);res.end(Buffer.from(await response.arrayBuffer()));return;
}
if(base&&pathname==='/'){res.writeHead(302,{Location:base+'/'}).end();return;}if(!pathname.startsWith(base+'/')){res.writeHead(404).end('Not found');return;}let file=path.resolve(root,'.'+pathname.slice(base.length));if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return;}if((await stat(file)).isDirectory())file=path.join(file,'index.html');const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','X-Content-Type-Options':'nosniff'});res.end(data);}catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(path.join(root,'404.html')).catch(()=>'<h1>Page not found</h1>'));}});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}${base}/`));
