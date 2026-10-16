import test from 'node:test';
import assert from 'node:assert/strict';
import ai from './api/ai/design.js';
import config from './api/collaboration/config.js';
import rooms from './api/collaboration/rooms.js';
function response(){return {statusCode:200,headers:{},body:'',setHeader(k,v){this.headers[k]=v},end(s=''){this.body=s}}}
test('AI route rejects unsupported methods',async()=>{const r=response();await ai({method:'GET'},r);assert.equal(r.statusCode,405)});
test('AI route reports missing key clearly',async()=>{const old=process.env.OPENAI_API_KEY;delete process.env.OPENAI_API_KEY;const r=response();await ai({method:'POST',body:{}},r);assert.equal(r.statusCode,503);assert.match(r.body,/OPENAI_API_KEY/);if(old!==undefined)process.env.OPENAI_API_KEY=old});
test('config endpoint never exposes service-role key',()=>{const old={url:process.env.SUPABASE_URL,pub:process.env.SUPABASE_PUBLISHABLE_KEY,anon:process.env.SUPABASE_ANON_KEY,service:process.env.SUPABASE_SERVICE_ROLE_KEY};process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_PUBLISHABLE_KEY='public-key';process.env.SUPABASE_SERVICE_ROLE_KEY='secret-server-key';const r=response();config({method:'GET'},r);assert.equal(r.statusCode,200);assert.equal(JSON.parse(r.body).publishableKey,'public-key');assert.equal(r.body.includes('secret-server-key'),false);for(const [k,v] of Object.entries({SUPABASE_URL:old.url,SUPABASE_PUBLISHABLE_KEY:old.pub,SUPABASE_ANON_KEY:old.anon,SUPABASE_SERVICE_ROLE_KEY:old.service})){if(v===undefined)delete process.env[k];else process.env[k]=v}});
test('collaboration route rejects unsupported methods',async()=>{const r=response();await rooms({method:'GET'},r);assert.equal(r.statusCode,405)});