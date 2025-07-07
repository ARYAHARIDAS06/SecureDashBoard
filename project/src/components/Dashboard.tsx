// src/components/Dashboard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Phone, Users, History, Menu, X } from 'lucide-react';
import ContactTable from './ContactTable';
import WebDialer from './WebDialer';
import CallHistory from './CallHistory';
import axios from 'axios';
import type { Contact, CallLog, CallStatus } from '../types';

const statusMap: Record<string, CallStatus['status']> = {
  queued:       'dialing',
  ringing:      'ringing',
  'in-progress':'connected',
  completed:    'ended',
  failed:       'ended',
  busy:         'ended',
  'no-answer':  'ended',
};

const Dashboard: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callHistory, setCallHistory] = useState<CallLog[]>([]);
  const [callStatus, setCallStatus] = useState<CallStatus>({ isActive: false, status: 'idle' });
  const [activeTab, setActiveTab] = useState<'contacts'|'dialer'|'history'>('contacts');
  const [mobileMenu, setMobileMenu] = useState(false);

  const statusInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    axios.get<Contact[]>('http://localhost:8000/api/contacts/')
      .then(resp => {
        setContacts(resp.data.map(c => ({
          id:           c.id,
          name:         c.name,
          phone:        c.phone,
          email:        c.email,
          notes:        c.notes,
          lastContacted:c.lastContacted,
          tags:         c.tags || []
        })));
      })
      .catch(console.error);

    axios.get<{ calls: any[] }>('http://localhost:8000/api/calls/')
      .then(resp => {
        setCallHistory(resp.data.calls.map((c, i) => ({
          id:           i.toString(),
          contactName:  c.from || 'Unknown',
          phone:        c.to,
          type:         c.direction === 'inbound' ? 'incoming' : 'outgoing',
          duration:     parseInt(c.duration) || 0,
          timestamp:    new Date(c.start_time),
          status:       c.status,
        })));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    return () => {
      if (statusInterval.current) clearInterval(statusInterval.current);
    };
  }, []);

  const handleCall = async (phone: string, contactName?: string) => {
    setCallStatus({
      isActive: true,
      status:   'dialing',
      currentCall: {
        phone,
        contactName: contactName || 'Unknown',
        startTime:   new Date(),
        duration:    0,
        sid:         undefined
      }
    });

    try {
      const resp = await axios.post('http://localhost:8000/api/call/', { to: phone });
      const sid = resp.data.sid as string;

      setCallStatus(cs => ({
        ...cs,
        currentCall: cs.currentCall && { ...cs.currentCall, sid }
      }));

      statusInterval.current = setInterval(async () => {
        try {
          const st = await axios.get<{ status: string }>(`http://localhost:8000/api/call/status/?sid=${sid}`);
          const twStatus = st.data.status;
          const uiStatus = statusMap[twStatus] || 'dialing';

          setCallStatus(cs => ({ ...cs, status: uiStatus }));

          if (uiStatus === 'ended') {
            if (statusInterval.current) {
              clearInterval(statusInterval.current);
              statusInterval.current = null;
            }

            const cc = callStatus.currentCall!;
            setCallHistory(ch => [
              {
                id:          Date.now().toString(),
                contactName: cc.contactName,
                phone:       cc.phone,
                type:        'outgoing',
                duration:    cc.duration,
                timestamp:   new Date(),
                status:      'completed'
              },
              ...ch
            ]);
            setCallStatus({ isActive: false, status: 'idle' });
          }
        } catch (e) {
          console.error('Status poll failed', e);
        }
      }, 2000);

    } catch (err: any) {
      console.error('Call failed', err);
      alert(`Failed to call ${contactName || phone}`);
      setCallStatus({ isActive: false, status: 'idle' });
    }
  };

  const handleEndCall = async () => {
    if (statusInterval.current) {
      clearInterval(statusInterval.current);
      statusInterval.current = null;
    }

    const sid = callStatus.currentCall?.sid;
    if (!sid) {
      alert('No call SID');
      return setCallStatus({ isActive: false, status: 'idle' });
    }

    try {
      await axios.post('http://localhost:8000/api/end_call/', { call_sid: sid });
    } catch (e) {
      console.error('Hangup failed', e);
    } finally {
      setCallStatus({ isActive: false, status: 'idle' });

      // Optionally disconnect Twilio Device if using
      if (window.Twilio?.Device?.disconnectAll) {
        window.Twilio.Device.disconnectAll();
      }
    }
  };

  useEffect(() => {
    let tmr: NodeJS.Timeout;
    if (callStatus.status === 'connected' && callStatus.currentCall) {
      tmr = setInterval(() => {
        setCallStatus(cs => ({
          ...cs,
          currentCall: {
            ...cs.currentCall!,
            duration: Math.floor((Date.now() - cs.currentCall!.startTime.getTime()) / 1000)
          }
        }));
      }, 1000);
    }
    return () => {
      if (tmr) clearInterval(tmr);
    };
  }, [callStatus.status]);

  const renderContent = () => {
    if (activeTab === 'contacts')
      return <ContactTable contacts={contacts} setContacts={setContacts} onCall={handleCall} />;
    if (activeTab === 'dialer')
      return <WebDialer callStatus={callStatus} onCall={handleCall} onEndCall={handleEndCall} />;
    return <CallHistory callHistory={callHistory} />;
  };

  const nav = [
    { id:'contacts', label:'Contacts', icon:Users },
    { id:'dialer',    label:'Dialer',   icon:Phone },
    { id:'history',   label:'History',  icon:History }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {mobileMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="w-64 bg-white h-full shadow p-4">
            <button onClick={()=>setMobileMenu(false)} className="mb-4"><X/></button>
            {nav.map(n => {
              const Icon = n.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => { setActiveTab(n.id as any); setMobileMenu(false); }}
                  className={`flex items-center gap-2 p-2 rounded w-full ${
                    activeTab===n.id?'bg-blue-100 text-blue-700':'hover:bg-gray-100'
                  }`}
                >
                  <Icon/> {n.label}
                </button>
              );
            })}
          </div>
        </div>
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
                  activeTab===n.id?'bg-blue-100 text-blue-700':'hover:bg-gray-100'
                }`}
              >
                <Icon/> {n.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="lg:pl-64">
        <div className="sticky top-0 bg-white shadow p-4 flex justify-between items-center">
          <button className="lg:hidden" onClick={()=>setMobileMenu(true)}><Menu/></button>
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
