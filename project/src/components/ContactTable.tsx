import React, { useState, useMemo } from 'react';
import { Search, Plus, PhoneCall, Edit2, Trash2, Filter } from 'lucide-react';
import type { Contact } from '../types';
import ContactModal from './ContactModal';
import axios from 'axios';

interface ContactTableProps {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  onCall: (phone: string, contactName?: string) => void;
}

const ContactTable: React.FC<ContactTableProps> = ({ contacts, setContacts, onCall }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    contacts.forEach(c => c.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [contacts]);

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm);
      const matchesTag = !selectedTag || c.tags?.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [contacts, searchTerm, selectedTag]);

  const openAdd = () => {
    setEditingContact(null);
    setIsModalOpen(true);
  };
  const openEdit = (c: Contact) => {
    setEditingContact(c);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    try {
      await axios.delete(`http://localhost:8000/api/contacts/${id}/`);
      setContacts(cs => cs.filter(x => x.id !== id));
    } catch {
      alert('Delete failed');
    }
  };

  const handleSave = async (data: Omit<Contact, 'id'>) => {
    try {
      if (editingContact) {
        // EDIT
        const resp = await axios.put(
          `http://localhost:8000/api/contacts/${editingContact.id}/`,
          {
            name: data.name,
            phone: data.phone,
            email: data.email,
            notes: data.notes,
            last_contacted: data.lastContacted || null,
          }
        );
        setContacts(cs =>
          cs.map(c => (c.id === editingContact.id ? { ...resp.data, tags: data.tags || [] } : c))
        );
      } else {
        // ADD
        const resp = await axios.post('http://localhost:8000/api/contacts/', {
          name: data.name,
          phone: data.phone,
          email: data.email,
          notes: data.notes,
          last_contacted: data.lastContacted || null,
        });
        setContacts(cs => [...cs, { ...resp.data, tags: data.tags || [] }]);
      }
      setIsModalOpen(false);
    } catch {
      alert('Save failed');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border">
      {/* header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-2 top-2 text-gray-400" />
            <input
              className="pl-8 pr-3 py-2 border rounded"
              placeholder="Search…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-2 top-2 text-gray-400" />
            <select
              className="pl-8 pr-3 py-2 border rounded"
              value={selectedTag}
              onChange={e => setSelectedTag(e.target.value)}
            >
              <option value="">All Tags</option>
              {allTags.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >
          <Plus /> Add Contact
        </button>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Phone</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Notes</th>
              <th className="px-4 py-2 text-left">Tags</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{c.name}</td>
                <td className="px-4 py-2">{c.phone}</td>
                <td className="px-4 py-2">{c.email || '–'}</td>
                <td className="px-4 py-2">{c.notes}</td>
                <td className="px-4 py-2">
                  {c.tags?.map(t => (
                    <span key={t} className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs mr-1">
                      {t}
                    </span>
                  ))}
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => onCall(c.phone, c.name)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    <PhoneCall />
                  </button>
                  <button
                    onClick={() => openEdit(c)}
                    className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                  >
                    <Edit2 />
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  No contacts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ContactModal
          contact={editingContact}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default ContactTable;
