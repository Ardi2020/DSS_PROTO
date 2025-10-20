import React from 'react';

function fmt(sec: number){
  const s = Math.max(0, sec|0);
  const m = Math.floor(s/60), r = s%60;
  const h = Math.floor(m/60), mm = m%60;
  return (h>0? `${h}j `:'') + `${mm.toString().padStart(2,'0')}:${r.toString().padStart(2,'0')}`;
}

export default function DashboardPage(){
  const [remain, setRemain] = React.useState<number|null>(null);
  const warnAt = 300; // 5 menit

  React.useEffect(() => {
    fetch('http://localhost:3001/auth/session', { credentials:'include' })
      .then(r => r.json())
      .then(j => setRemain(j?.remainingSec ?? 0))
      .catch(() => setRemain(0));
  }, []);

  async function relogin(){
    await fetch('http://localhost:3001/auth/logout', { method:'POST', credentials:'include' });
    window.location.href = '/';
  }

  return (
    <div style={{padding:16}}>
      <h2>Dashboard DSS</h2>
      {remain===null ? <p>Memuat status sesi…</p> :
        <p>Sisa waktu token: <b>{fmt(remain)}</b></p>
      }

      {typeof remain==='number' && remain>0 && remain<=warnAt && (
        <div style={{background:'#fff3cd', padding:12, border:'1px solid #ffeeba', borderRadius:8, marginTop:12}}>
          <b>Peringatan:</b> Sesi akan habis dalam {fmt(remain)}.
          <div style={{marginTop:8}}>
            <button onClick={relogin}>Login ulang sekarang</button>
          </div>
        </div>
      )}

      <div style={{marginTop:24}}>
        <p>Konten dashboard akan ditempatkan di sini.</p>
      </div>
    </div>
  );
}
