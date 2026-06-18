import React, { useEffect, useState, useCallback } from 'react';
import { Mail, UserPlus, Eye } from 'lucide-react';
import { contactAPI } from '../../api';
import { useApp } from '../../context/AppContext';
import PageHeader from '../../components/shared/PageHeader';
import EmptyState from '../../components/shared/EmptyState';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Modal from '../../components/shared/Modal';
import { formatDate } from '../../utils/helpers';

export default function ContactsPage() {
  const { showToast } = useApp();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewContact, setViewContact] = useState(null);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await contactAPI.getAll({ isRead: filter !== '' ? filter === 'unread' ? 'false' : 'true' : undefined });
      setContacts(r.data || []);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleRead = async (id) => {
    await contactAPI.markRead(id);
    load();
  };

  const handleConvert = async (id) => {
    try {
      await contactAPI.convertToClient(id);
      showToast('Converted to client successfully');
      load();
    } catch (e) { showToast('Error converting', 'error'); }
  };

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  return (
    <div>
      <PageHeader title="Website Enquiries" subtitle={`${contacts.filter(c => !c.isRead).length} unread`} />

      <div className="flex gap-2 mb-5">
        {[['', 'All'], ['unread', 'Unread'], ['read', 'Read']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${filter === v ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{l}</button>
        ))}
      </div>

      {contacts.length === 0 ? (
        <EmptyState icon={Mail} title="No enquiries" description="Website contact form submissions will appear here" />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>{['Name', 'Phone', 'Location', 'Budget', 'Date', 'Status', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs text-gray-500">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {contacts.map(c => (
                  <tr key={c._id} className={`hover:bg-gray-50 ${!c.isRead ? 'font-medium' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!c.isRead && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                        <span className="text-secondary">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.phone}</td>
                    <td className="px-4 py-3 text-gray-500">{c.location || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{c.budget || '—'}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3">
                      {c.isConverted ? <span className="badge bg-green-100 text-green-700">Converted</span> : c.isRead ? <span className="badge bg-gray-100 text-gray-600">Read</span> : <span className="badge bg-blue-100 text-blue-700">New</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => { setViewContact(c); if (!c.isRead) handleRead(c._id); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-primary"><Eye className="w-3.5 h-3.5" /></button>
                        {!c.isConverted && <button onClick={() => handleConvert(c._id)} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 font-medium px-2 py-1 hover:bg-green-50 rounded"><UserPlus className="w-3.5 h-3.5" /> Convert</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewContact && (
        <Modal open={!!viewContact} onClose={() => setViewContact(null)} title="Enquiry Details">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[['Name', viewContact.name], ['Phone', viewContact.phone], ['Email', viewContact.email || '—'], ['Location', viewContact.location || '—'], ['Plot Size', viewContact.plotSize || '—'], ['Budget', viewContact.budget || '—']].map(([k, v]) => (
                <div key={k}><p className="text-gray-400 text-xs">{k}</p><p className="font-medium text-secondary">{v}</p></div>
              ))}
            </div>
            {viewContact.message && <div><p className="text-gray-400 text-xs mb-1">Message</p><p className="bg-gray-50 p-3 rounded-lg text-gray-700 text-sm">{viewContact.message}</p></div>}
            {!viewContact.isConverted && <button onClick={() => { handleConvert(viewContact._id); setViewContact(null); }} className="btn-primary w-full justify-center"><UserPlus className="w-4 h-4" /> Convert to Client</button>}
          </div>
        </Modal>
      )}
    </div>
  );
}
