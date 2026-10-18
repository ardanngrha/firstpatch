// Shared by static pages and browser-rendered rows, including no-JavaScript visits.
export function externalLinks(html,site='https://firstpatch.pages.dev'){
  const origin=new URL(site).origin;
  return html.replace(/<a\b([^>]*)>/g,(tag,attributes)=>{
    const href=attributes.match(/\bhref="([^"]*)"/)?.[1];
    if(!href)return tag;
    let url;try{url=new URL(href,site);}catch{return tag;}
    if(!['http:','https:'].includes(url.protocol)||url.origin===origin)return tag;
    const rel=new Set((attributes.match(/\brel="([^"]*)"/)?.[1]||'').split(/\s+/).filter(Boolean));
    if(/\btarget="_blank"/.test(attributes)&&rel.has('noopener')&&rel.has('noreferrer')&&/\baria-description=/.test(attributes))return tag;
    rel.add('noopener');rel.add('noreferrer');
    const clean=attributes.replace(/\s+(?:target|rel)="[^"]*"/g,'');
    const notice=/\baria-description=/.test(clean)?'':' aria-description="Opens in a new tab"';
    return `<a${clean} target="_blank" rel="${[...rel].join(' ')}"${notice}>`;
  });
}
