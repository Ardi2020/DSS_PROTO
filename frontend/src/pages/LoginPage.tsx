import React from 'react';

export default function LoginPage(){
  async function onSubmit(e: React.FormEvent){
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const r = await fetch('http://localhost:3001/auth/login', {
      method:'POST', credentials:'include',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username: fd.get('u'), password: fd.get('p') })
    });
    if (r.ok) {
      window.location.href = '/dashboard';
    } else {
      alert('Login gagal. Periksa username/password.');
    }
  }

  return (
    <div style={{display:'grid',placeItems:'center',minHeight:'100vh'}}>
      <form onSubmit={onSubmit} style={{display:'grid',gap:12,minWidth:320}}>
        <h2>Login DSS</h2>
        <input name="u" placeholder="username" defaultValue="unand_view"/>
        <input name="p" type="password" placeholder="password" defaultValue="unandTI_24#"/>
        <button>Masuk</button>
      </form>
    </div>
  );
}
