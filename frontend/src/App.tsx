import React from 'react';

function Login() {
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    await fetch('http://localhost:3001/auth/login', {
      method:'POST', credentials:'include',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username: fd.get('u'), password: fd.get('p') })
    });
  }
  return (
    <form onSubmit={onSubmit} style={{display:'grid',gap:8,maxWidth:320}}>
      <input name="u" defaultValue="unand_view" />
      <input name="p" type="password" defaultValue="unandTI_24#" />
      <button>Login</button>
    </form>
  );
}

export default function App(){
  const [data,setData] = React.useState<any>(null);
  async function load(){
    const r = await fetch(
      'http://localhost:3001/proxy/parameter/trend-parameter-bko?page=1&limit=100',
      { credentials:'include' }
    );
    setData(await r.json());
  }
  return (
    <div style={{padding:16}}>
      <h3>DSS Balis SMILE — Quick Test</h3>
      <Login/>
      <button onClick={load} style={{marginTop:12}}>Load Trend BKO</button>
      <pre style={{maxHeight:300,overflow:'auto',marginTop:12}}>
        {JSON.stringify(data,null,2)}
      </pre>
    </div>
  );
}
