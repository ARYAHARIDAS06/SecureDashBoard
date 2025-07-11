import React, { useState, useEffect, useRef } from 'react';
import { Phone, Users, History, Menu, X } from 'lucide-react';
import ContactTable from './ContactTable';
import WebDialer from './WebDialer';
import CallHistory from './CallHistory';
import IncomingCallModal from './IncomingCallModal';
import api from '../utils/axios';
import type { Contact, CallLog, CallStatus } from '../types';

const statusMap: Record<string, CallStatus['status']> = {
  queued: 'dialing',
  ringing: 'ringing',
  'in-progress': 'connected',
  completed: 'ended',
  failed: 'ended',
  busy: 'ended',
  'no-answer': 'ended',
};

const Dashboard: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callHistory, setCallHistory] = useState<CallLog[]>([]);
  const [callStatus, setCallStatus] = useState<CallStatus>({ isActive: false, status: 'idle' });
  const [activeTab, setActiveTab] = useState<'contacts' | 'dialer' | 'history'>('contacts');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ from: string; accept: () => void; reject: () => void } | null>(null);

  const statusInterval = useRef<NodeJS.Timeout | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    api.get<Contact[]>('contacts/')
      .then((resp: { data: any[]; }) => setContacts(resp.data.map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email,
        notes: c.notes,
        lastContacted: c.lastContacted,
        tags: c.tags || []
      }))))
      .catch(console.error);

    api.get<{ calls: any[] }>('calls/')
      .then((resp: { data: { calls: { map: (arg0: (c: any, i: any) => { id: any; contactName: any; phone: any; type: string; duration: number; timestamp: Date; status: any; }) => React.SetStateAction<CallLog[]>; }; }; }) => setCallHistory(resp.data.calls.map((c, i) => ({
        id: i.toString(),
        contactName: c.from || 'Unknown',
        phone: c.to,
        type: c.direction === 'inbound' ? 'incoming' : 'outgoing',
        duration: parseInt(c.duration) || 0,
        timestamp: new Date(c.start_time),
        status: c.status,
      }))))
      .catch(console.error);
  }, []);

  useEffect(() => {
    return () => {
      if (statusInterval.current) clearInterval(statusInterval.current);
      if (durationInterval.current) clearInterval(durationInterval.current);
    };
  }, []);

  const handleCall = async (phone: string, contactName?: string) => {
    setCallStatus({
      isActive: true,
      status: 'dialing',
      currentCall: { phone, contactName: contactName || 'Unknown', startTime: new Date(), duration: 0, sid: undefined }
    });

    try {
      const resp = await api.post('call/', { to: phone });
      const sid = resp.data.sid as string;

      setCallStatus(cs => ({
        ...cs,
        currentCall: cs.currentCall && { ...cs.currentCall, sid }
      }));

      statusInterval.current = setInterval(async () => {
        const st = await api.get<{ status: string }>(`call/status/?sid=${sid}`);
        const uiStatus = statusMap[st.data.status] || 'dialing';
        setCallStatus(cs => ({ ...cs, status: uiStatus }));

        if (uiStatus === 'ended') {
          if (statusInterval.current) clearInterval(statusInterval.current);
          const cc = callStatus.currentCall!;
          setCallHistory(ch => [{
            id: Date.now().toString(),
            contactName: cc.contactName,
            phone: cc.phone,
            type: 'outgoing',
            duration: cc.duration,
            timestamp: new Date(),
            status: 'completed'
          }, ...ch]);
          setCallStatus({ isActive: false, status: 'idle' });
        }
      }, 2000);
    } catch (err) {
      console.error('Call failed', err);
      alert(`Failed to call ${contactName || phone}`);
      setCallStatus({ isActive: false, status: 'idle' });
    }
  };

  const handleEndCall = async () => {
    if (statusInterval.current) clearInterval(statusInterval.current);
    if (durationInterval.current) clearInterval(durationInterval.current);

    const sid = callStatus.currentCall?.sid;
    if (!sid) {
      setCallStatus({ isActive: false, status: 'idle' });
      return;
    }

    try {
      await api.post('end_call/', { call_sid: sid });
    } catch (e) {
      console.error('Hangup failed', e);
    } finally {
      setCallStatus({ isActive: false, status: 'idle' });
    }
  };

  const handleIncomingCall = (from: string, accept: () => void, reject: () => void) => {
    setIncomingCall({ from, accept, reject });
    setCallStatus({ isActive: true, status: 'ringing', currentCall: { phone: from, contactName: 'Incoming Caller', startTime: new Date(), duration: 0, sid: undefined } });
  };

  const acceptIncomingCall = () => {
    if (incomingCall) {
      incomingCall.accept();
      setCallStatus(cs => ({ ...cs, status: 'connected' }));
      durationInterval.current = setInterval(() => {
        setCallStatus(cs => ({
          ...cs,
          currentCall: { ...cs.currentCall!, duration: Math.floor((Date.now() - cs.currentCall!.startTime.getTime()) / 1000) }
        }));
      }, 1000);
      setIncomingCall(null);
    }
  };

  const rejectIncomingCall = () => {
    if (incomingCall) {
      incomingCall.reject();
      setCallHistory(ch => [{
        id: Date.now().toString(),
        contactName: 'Incoming Caller',
        phone: incomingCall.from,
        type: 'incoming',
        duration: 0,
        timestamp: new Date(),
        status: 'rejected'
      }, ...ch]);
      setCallStatus({ isActive: false, status: 'idle' });
      setIncomingCall(null);
    }
  };

  useEffect(() => {
    if (callStatus.status === 'connected' && callStatus.currentCall && !durationInterval.current) {
      durationInterval.current = setInterval(() => {
        setCallStatus(cs => ({
          ...cs,
          currentCall: { ...cs.currentCall!, duration: Math.floor((Date.now() - cs.currentCall!.startTime.getTime()) / 1000) }
        }));
      }, 1000);
    }
    if (callStatus.status === 'ended' && durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  }, [callStatus.status]);

  const renderContent = () => {
    if (activeTab === 'contacts') return <ContactTable contacts={contacts} setContacts={setContacts} onCall={handleCall} />;
    if (activeTab === 'dialer') return <WebDialer callStatus={callStatus} onCall={handleCall} onEndCall={handleEndCall} onIncomingCall={handleIncomingCall} />;
    return <CallHistory callHistory={callHistory} />;
  };

  const nav = [
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'dialer', label: 'Dialer', icon: Phone },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {mobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="w-64 bg-white h-full shadow p-4">
            <button onClick={() => setMobileMenu(false)} className="mb-4"><X /></button>
            {nav.map(n => {
              const Icon = n.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => { setActiveTab(n.id as any); setMobileMenu(false); }}
                  className={`flex items-center gap-2 p-2 rounded w-full ${
                    activeTab === n.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <Icon /> {n.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {incomingCall && (
        <IncomingCallModal
          from={incomingCall.from}
          onAccept={acceptIncomingCall}
          onReject={rejectIncomingCall}
        />
      )}

      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="bg-white h-full shadow p-4">
          <h1 className="text-2xl font-bold mb-6">SecureDash</h1>
          {nav.map(n => {
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                onClick={() => setActiveTab(n.id as any)}
                className={`flex items-center gap-2 p-2 rounded w-full mb-2 ${
                  activeTab === n.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
              >
                <Icon /> {n.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:pl-64">
        <div className="sticky top-0 bg-white shadow p-4 flex justify-between items-center">
          <button className="lg:hidden" onClick={() => setMobileMenu(true)}><Menu /></button>
          <h2 className="text-xl font-semibold capitalize">{activeTab}</h2>
          {callStatus.isActive && (
            <button onClick={handleEndCall} className="bg-red-600 text-white px-3 py-1 rounded">
              Hang Up
            </button>
          )}
        </div>
        <main className="p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;