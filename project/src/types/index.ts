export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  lastContacted?: Date;
  notes?: string;
  avatar?: string;
}

export interface CallLog {
  id: string;
  contactId?: string;
  contactName: string;
  phone: string;
  type: 'incoming' | 'outgoing' | 'missed';
  duration: number;
  timestamp: Date;
  status: 'completed' | 'failed' | 'busy' | 'no-answer';
}

export interface CallStatus {
  isActive: boolean;

  status: 'idle' | 'dialing' | 'ringing' | 'connected' | 'ended';
  currentCall?: {
    sid: any;
    contactName: string;
    phone: string;
    startTime: Date;
    duration: number;
  };
}