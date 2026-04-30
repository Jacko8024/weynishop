import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../../api/client.js';

export default function AdminDisputes() {
  const [items, setItems] = useState([]);
  const load = () => api.get('/admin/disputes').then(({ data }) => setItems(data.items));
  useEffect(() => { load(); }, []);

  const resolve = async (id, status) => {
    const resolution = prompt('Resolution note?') || '';
    try {
      await api.put(`/admin/disputes/${id}`, { status, resolution });
      toast.success('Updated');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-3">Disputes</h1>
      {!items.length ? (
        <div className="card p-10 text-center text-slate-500">No disputes 🎉</div>
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <div key={d._id} className="card p-4">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{d.subject}</div>
                  <div className="text-xs text-slate-500">By {d.raisedBy?.name} ({d.raisedBy?.role}) against {d.against}</div>
                </div>
                <span className={`badge ${d.status === 'open' ? 'bg-amber-100 text-amber-700' : d.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-danger-100 text-danger-700'}`}>{d.status}</span>
              </div>
              <p className="text-sm mt-2 text-slate-600">{d.description}</p>
              {d.resolution && <p className="text-sm mt-1 text-slate-500"><strong>Resolution:</strong> {d.resolution}</p>}
              {d.status === 'open' && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => resolve(d._id, 'resolved')} className="btn-primary text-xs">Resolve</button>
                  <button onClick={() => resolve(d._id, 'rejected')} className="btn-danger text-xs">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
