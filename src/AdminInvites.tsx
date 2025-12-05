import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminInvites: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [invites, setInvites] = useState<any[]>([]);
  const [tokenDisplay, setTokenDisplay] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(7);
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState<any[]>([]);
  const [userRequested, setUserRequested] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const check = async () => {
      if (!token) {
        alert('Authentication required');
        navigate('/loginregistersite');
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/me', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('Not authorized');
        const me = await res.json();
        if (me.role !== 'admin') {
          alert('Admin access required');
          navigate('/');
          return;
        }
        setIsAdmin(true);
      } catch (err) {
        console.error(err);
        alert('Admin access required');
        navigate('/');
        return;
      }

      await loadInvites();
      await loadRequests();
      setLoading(false);
    };
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInvites = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/invites', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setInvites(data);
    } catch (err) {
      console.error('Error loading invites', err);
    }
  };

  const createInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:5000/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ expiresInDays: expiresIn })
      });
      if (!res.ok) throw new Error('Failed to create');
      const data = await res.json();
      // display the raw token that the server returns once
      setTokenDisplay(data.token);
      await loadInvites();
    } catch (err) {
      console.error(err);
      alert('Failed to create invite');
    }
  };

  const revokeInvite = async (id: number) => {
    if (!confirm('Revoke this invite?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/invites/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      await loadInvites();
    } catch (err) {
      console.error(err);
      alert('Failed to revoke invite');
    }
  };

  const loadRequests = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/admin-requests', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return setRequests([]);
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      console.error('Error loading requests', err);
    }
  };

  const makeDisplayCode = (inv: any) => {
    try {
      const time = inv.created_at ? new Date(inv.created_at).getTime() : Date.now();
      const base = Math.abs(time).toString(36).slice(-6).toUpperCase();
      return `INV-${String(inv.id).padStart(3, '0')}-${base}`;
    } catch {
      return `INV-${inv.id}`;
    }
  };

  const copyToClipboard = async (text: string | null) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard');
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  const approveRequest = async (id: number) => {
    if (!confirm('Promote this user to admin?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/admin-requests/${id}/approve`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      await loadRequests();
      alert('User promoted');
    } catch (err) {
      console.error(err);
      alert('Failed to promote');
    }
  };

  const denyRequest = async (id: number) => {
    if (!confirm('Deny request?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/admin-requests/${id}/deny`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      await loadRequests();
    } catch (err) {
      console.error(err);
      alert('Failed to deny');
    }
  };

  const submitUserRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { alert('Login required'); return; }
    try {
      const res = await fetch('http://localhost:5000/api/request-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message })
      });
      if (!res.ok) throw new Error('Failed');
      setUserRequested(true);
      alert('Request submitted');
    } catch (err) {
      console.error(err);
      alert('Failed to submit request');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Admin Invite Management</h2>

      <section className="mb-6 p-4 border rounded">
        <h3 className="font-semibold mb-2">Create Invite</h3>
        <form onSubmit={createInvite} className="flex gap-2 items-center">
          <label htmlFor="expiresIn" className="text-sm">Expires (days):</label>
          <input id="expiresIn" type="number" value={expiresIn} onChange={(e)=>setExpiresIn(Number(e.target.value))} className="border px-2 py-1 rounded w-24" />
          <button className="px-3 py-1 bg-green-600 text-white rounded">Create</button>
        </form>
        {tokenDisplay && (
          <div className="mt-3 bg-yellow-50 p-3 rounded border">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <strong>Invite token (copy now):</strong>
                <div className="break-all mt-2 font-mono text-sm">{tokenDisplay}</div>
              </div>
              <div className="flex-shrink-0">
                <button onClick={() => copyToClipboard(tokenDisplay)} className="px-3 py-1 bg-blue-600 text-white rounded">Copy</button>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mb-6">
        <h3 className="font-semibold mb-3">Active Invites</h3>
        {invites.length === 0 ? (
          <div className="p-4 rounded border">No invites</div>
        ) : (
          <div className="space-y-4">
            {invites.map(inv => (
              <div key={inv.id} className="p-4 rounded shadow-sm border bg-blue-50 flex justify-between items-start">
                <div className="min-w-0">
                  <div className="text-sm text-gray-700">Id: <span className="font-semibold">{inv.id}</span></div>
                  <div className="text-sm text-gray-700">Code: <span className="font-mono text-sm">{inv.display_code || makeDisplayCode(inv)}</span></div>
                  <div className="text-sm text-gray-600 mt-2">Created: <span className="font-medium">{new Date(inv.created_at).toLocaleString()}</span></div>
                  <div className="text-sm text-gray-600">Expires: <span className="font-medium">{inv.expires_at ? new Date(inv.expires_at).toLocaleString() : '—'}</span></div>
                  <div className="text-sm text-gray-600">Used: <span className="font-medium">{inv.used_by ? `Yes (by ${inv.used_by})` : 'No'}</span></div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {tokenDisplay && (
                    // show copy button for the most recently created token
                    <button onClick={() => copyToClipboard(tokenDisplay)} className="px-3 py-1 bg-blue-600 text-white rounded">Copy Latest Token</button>
                  )}
                  <button onClick={()=>revokeInvite(inv.id)} className="px-3 py-2 bg-red-500 text-white rounded">Revoke</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mb-6 p-4 border rounded">
        <h3 className="font-semibold mb-2">User Requests to become Admin</h3>
        {requests.length === 0 ? <div>No pending requests</div> : (
          <ul className="space-y-2">
            {requests.map(r => (
              <li key={r.id} className="flex justify-between items-center">
                <div>
                  <div>{r.user_login} ({r.user_email})</div>
                  <div className="text-sm text-gray-600">{r.message}</div>
                  <div className="text-sm">Requested: {new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>approveRequest(r.id)} className="px-2 py-1 bg-green-600 text-white rounded">Approve</button>
                  <button onClick={()=>denyRequest(r.id)} className="px-2 py-1 bg-red-600 text-white rounded">Deny</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="p-4 border rounded">
        <h3 className="font-semibold mb-2">Request Admin Access</h3>
        {userRequested ? <div className="text-green-600">You have submitted a request.</div> : (
          <form onSubmit={submitUserRequest} className="flex flex-col gap-2">
            <textarea value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Why do you need admin access?" className="border p-2 rounded" />
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-blue-600 text-white rounded">Submit Request</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
};

export default AdminInvites;
