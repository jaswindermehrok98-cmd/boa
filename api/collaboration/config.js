export default function handler(req,res) {
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET'){res.setHeader('Allow','GET');res.statusCode=405;return res.end(JSON.stringify({error:'Method not allowed.'}));}
  const supabaseUrl=process.env.SUPABASE_URL;
  const publishableKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY;
  if(!supabaseUrl||!publishableKey){res.statusCode=503;return res.end(JSON.stringify({error:'Collaboration is not configured. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY on the server.'}));}
  res.statusCode=200;return res.end(JSON.stringify({supabaseUrl,publishableKey}));
}