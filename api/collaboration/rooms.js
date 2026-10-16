import {createHash,randomBytes,randomUUID,timingSafeEqual} from 'node:crypto';
const send=(res,status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));};
function cfg(){const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('Collaboration backend is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');return {url:url.replace(/\/$/,''),key};}
async function db(path,method='GET',body,prefer){const c=cfg(),headers={apikey:c.key,Authorization:'Bearer '+c.key,'Content-Type':'application/json'};if(prefer)headers.Prefer=prefer;const r=await fetch(c.url+'/rest/v1/'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});const raw=await r.text();let data=null;try{data=raw?JSON.parse(raw):null}catch{}if(!r.ok)throw new Error(data?.message||'Supabase database request failed ('+r.status+')');return data;}
async function readBody(req){if(req.body&&typeof req.body==='object')return req.body;let s='';for await(const c of req){s+=c;if(Buffer.byteLength(s)>1500000)throw Object.assign(new Error('Request body is too large.'),{status:413});}try{return JSON.parse(s||'{}')}catch{throw Object.assign(new Error('Invalid JSON body.'),{status:400})}}
const hash=t=>createHash('sha256').update(t).digest('hex');
function matches(expected,token){try{const a=Buffer.from(expected,'hex'),b=Buffer.from(hash(token),'hex');return a.length===b.length&&timingSafeEqual(a,b)}catch{return false}}
function validDoc(d){return !!d&&Array.isArray(d.pages)&&d.pages.length>0&&d.pages.length<=40&&Buffer.byteLength(JSON.stringify(d))<=1200000&&d.pages.every(p=>p&&typeof p.id==='string'&&Number.isFinite(p.width)&&Number.isFinite(p.height)&&Array.isArray(p.elements)&&p.elements.length<=300)}
function invite(b){const roomId=String(b.roomId||''),accessToken=String(b.accessToken||'');if(!/^[0-9a-f-]{36}$/i.test(roomId)||accessToken.length<40||accessToken.length>200)throw Object.assign(new Error('Invalid collaboration invite.'),{status:400});return {roomId,accessToken}}
async function authorized(b){const {roomId,accessToken}=invite(b),rows=await db('mosaic_rooms?id=eq.'+encodeURIComponent(roomId)+'&select=id,token_hash,document,updated_at');const room=Array.isArray(rows)?rows[0]:null;if(!room||!matches(room.token_hash,accessToken))throw Object.assign(new Error('This invite is invalid or has expired.'),{status:403});return room}
async function version(roomId,document,label){await db('mosaic_room_versions','POST',{room_id:roomId,document,label},{return:'minimal'});const old=await db('mosaic_room_versions?room_id=eq.'+encodeURIComponent(roomId)+'&select=id&order=created_at.desc&offset=50&limit=100');if(Array.isArray(old)&&old.length)await db('mosaic_room_versions?id=in.('+old.map(v=>v.id).join(',')+')','DELETE',undefined,'return=minimal')}
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return send(res,405,{error:'Method not allowed.'})}
 try{
  const b=await readBody(req);if(!['create','load','save','checkpoint','versions','restore'].includes(b.action))return send(res,400,{error:'Unsupported collaboration action.'});
  if(b.action==='create'){
   if(!validDoc(b.document))return send(res,400,{error:'A valid design document is required.'});
   const roomId=randomUUID(),accessToken=randomBytes(32).toString('base64url'),now=new Date().toISOString(),document={...b.document,updatedAt:Date.now()};
   await db('mosaic_rooms','POST',{id:roomId,token_hash:hash(accessToken),document,created_at:now,updated_at:now},'return=minimal');
   return send(res,201,{roomId,accessToken,document});
  }
  const room=await authorized(b),id=room.id;
  if(b.action==='load')return send(res,200,{roomId:id,document:room.document,updatedAt:room.updated_at});
  if(b.action==='save'||b.action==='checkpoint'){
   if(!validDoc(b.document))return send(res,400,{error:'The shared design is invalid or too large.'});
   const document={...b.document,updatedAt:Date.now()};
   if(b.action==='checkpoint')await version(id,room.document,'Before checkpoint');
   await db('mosaic_rooms?id=eq.'+encodeURIComponent(id),'PATCH',{document,updated_at:new Date().toISOString()},'return=minimal');
   if(b.action==='checkpoint')await version(id,document,'Manual checkpoint');
   return send(res,200,{ok:true,document,updatedAt:document.updatedAt});
  }
  if(b.action==='versions'){const rows=await db('mosaic_room_versions?room_id=eq.'+encodeURIComponent(id)+'&select=id,label,created_at&order=created_at.desc&limit=50');return send(res,200,{versions:rows||[]})}
  if(b.action==='restore'){
   const n=Number(b.versionId);if(!Number.isSafeInteger(n)||n<1)return send(res,400,{error:'Choose a valid version.'});
   const rows=await db('mosaic_room_versions?id=eq.'+n+'&room_id=eq.'+encodeURIComponent(id)+'&select=id,document'),v=Array.isArray(rows)?rows[0]:null;
   if(!v||!validDoc(v.document))return send(res,404,{error:'That version was not found.'});
   await version(id,room.document,'Before restore');const document={...v.document,updatedAt:Date.now()};
   await db('mosaic_rooms?id=eq.'+encodeURIComponent(id),'PATCH',{document,updated_at:new Date().toISOString()},'return=minimal');return send(res,200,{ok:true,document});
  }
  return send(res,400,{error:'Unsupported action.'});
 }catch(e){console.error('Mosaic collaboration API:',e);return send(res,e.status||500,{error:e.message||'Collaboration request failed.'})}
}