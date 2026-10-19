const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent((req.url||'/').split('?')[0])}catch{res.writeHead(400);return res.end('Bad URL')}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);return res.end('Not found')}
    res.writeHead(200,{'Content-Type':types[path.extname(file).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data)
  })
}).listen(4187,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4187'));
