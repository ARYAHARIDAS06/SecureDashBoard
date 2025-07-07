import React, { useState } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Calendar, Filter } from 'lucide-react';
import type { CallLog } from '../types';

interface CallHistoryProps {
  callHistory: CallLog[];
}

const CallHistory: React.FC<CallHistoryProps> = ({ callHistory }) => {
  const [filterType, setFilterType] = useState<'all' | 'incoming' | 'outgoing' | 'missed'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');

  const getCallIcon = (type: string, status: string) => {
    if (type === 'missed' || (type === 'incoming' && status === 'no-answer')) {
      return <PhoneMissed className="h-4 w-4 text-red-500" />;
    }
    if (type === 'incoming') {
      return <PhoneIncoming className="h-4 w-4 text-blue-500" />;
    }
    return <PhoneOutgoing className="h-4 w-4 text-green-500" />;
  };

  const getCallTypeColor = (type: string, status: string) => {
    if (type === 'missed' || (type === 'incoming' && status === 'no-answer')) {
      return 'text-red-600';
    }
    if (type === 'incoming') {
      return 'text-blue-600';
    }
    return 'text-green-600';
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const callDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (callDate.getTime() === today.getTime()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (callDate.getTime() === yesterday.getTime()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const filteredHistory = callHistory.filter(call => {
    const matchesType = filterType === 'all' || call.type === filterType || 
                       (filterType === 'missed' && (call.type === 'missed' || call.status === 'no-answer'));
    
    const now = new Date();
    let matchesDate = true;
    
    switch (dateRange) {
      case 'today':
        matchesDate = call.timestamp.toDateString() === now.toDateString();
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = call.timestamp >= weekAgo;
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = call.timestamp >= monthAgo;
        break;
      default:
        matchesDate = true;
    }
    
    return matchesType && matchesDate;
  });

  const getCallStats = () => {
    const total = callHistory.length;
    const incoming = callHistory.filter(call => call.type === 'incoming').length;
    const outgoing = callHistory.filter(call => call.type === 'outgoing').length;
    const missed = callHistory.filter(call => call.type === 'missed' || call.status === 'no-answer').length;
    const totalDuration = callHistory.reduce((sum, call) => sum + call.duration, 0);
    
    return { total, incoming, outgoing, missed, totalDuration };
  };

  const stats = getCallStats();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Calls</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Phone className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Incoming</p>
              <p className="text-2xl font-bold text-blue-600">{stats.incoming}</p>
            </div>
            <PhoneIncoming className="h-8 w-8 text-blue-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Outgoing</p>
              <p className="text-2xl font-bold text-green-600">{stats.outgoing}</p>
            </div>
            <PhoneOutgoing className="h-8 w-8 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Time</p>
              <p className="text-2xl font-bold text-gray-900">{Math.floor(stats.totalDuration / 60)}m</p>
            </div>
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Call History Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Call History</h3>
            
            <div className="flex items-center space-x-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Calls</option>
                <option value="incoming">Incoming</option>
                <option value="outgoing">Outgoing</option>
                <option value="missed">Missed</option>
              </select>
              
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Call List */}
        <div className="divide-y divide-gray-200">
          {filteredHistory.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No calls found matching your criteria.</p>
            </div>
          ) : (
            filteredHistory.map((call) => (
              <div key={call.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getCallIcon(call.type, call.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {call.contactName}
                        </p>
                        <span className={`text-xs font-medium ${getCallTypeColor(call.type, call.status)}`}>
                          {call.type === 'missed' || call.status === 'no-answer' ? 'Missed' : 
                           call.type === 'incoming' ? 'Incoming' : 'Outgoing'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm text-gray-500">{call.phone}</p>
                        <span className="text-gray-300">•</span>
                        <p className="text-sm text-gray-500">{formatTimestamp(call.timestamp)}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDuration(call.duration)}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{call.status}</p>
                    </div>
                    
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                      <Phone className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CallHistory;