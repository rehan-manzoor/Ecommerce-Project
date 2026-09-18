import { useEffect, useState } from 'react';
import api from '../api/axios';
import { notify } from '../components/Toast';
export default function Returns() {
  const [returns, setReturns] = useState([]);
  useEffect(() => { api.get('/returns/my').then((response) => setReturns(response.data.data)).catch(() => notify('Unable to load returns','error')); }, []);
  return <main className="container page-shell"><div className="page-title"><h1>My returns</h1></div>{!returns.length ? <div className="state-card">No return requests. Delivered items can be requested from Orders within 14 days.</div> : <div className="management-list">{returns.map((entry) => <article className="management-card panel" key={entry._id}><div><h3>{entry.product?.name}</h3><p>{entry.reason} · Qty {entry.quantity}</p></div><span className={`status-badge ${entry.status}`}>{entry.status}</span></article>)}</div>}</main>;
}
