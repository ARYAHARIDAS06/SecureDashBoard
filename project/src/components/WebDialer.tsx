import React, { useState } from 'react';
import { Phone, PhoneOff, Backpack as Backspace, Volume2, Mic, MicOff } from 'lucide-react';
import type { CallStatus } from '../types';

interface WebDialerProps {
  callStatus: CallStatus;
  onCall: (phone: string, contactName?: string) => void;
  onEndCall: () => void;
}

const WebDialer: React.FC<WebDialerProps> = ({ callStatus, onCall, onEndCall }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(75);

  const keypadButtons = [
    { key: '1', letters: '' },
    { key: '2', letters: 'ABC' },
    { key: '3', letters: 'DEF' },
    { key: '4', letters: 'GHI' },
    { key: '5', letters: 'JKL' },
    { key: '6', letters: 'MNO' },
    { key: '7', letters: 'PQRS' },
    { key: '8', letters: 'TUV' },
    { key: '9', letters: 'WXYZ' },
    { key: '*', letters: '' },
    { key: '0', letters: '+' }, // This now appends `+` if needed
    { key: '#', letters: '' },
  ];

  const handleKeyPress = (key: string) => {
    if (callStatus.isActive) {
      console.log('Sending DTMF:', key);
      return;
    }

    // Add '+' only once at the start
    if (key === '+' && !phoneNumber.includes('+')) {
      setPhoneNumber((prev) => '+' + prev);
      return;
    }

    if (key === '+' && phoneNumber.includes('+')) return;

    if (phoneNumber.length < 20) {
      setPhoneNumber((prev) => prev + key);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (phoneNumber.trim()) {
      // Only validate it's not just '+' or empty
      const trimmed = phoneNumber.trim();
      if (/^\+?\d+$/.test(trimmed)) {
        onCall(trimmed);
      } else {
        alert('Invalid phone number format.');
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Call Status Display */}
        {callStatus.isActive && callStatus.currentCall && (
          <div className="mb-6 text-center">
            <div className="mb-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-gray-600">
                  {callStatus.currentCall.contactName.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {callStatus.currentCall.contactName}
              </h3>
              <p className="text-sm text-gray-500">{callStatus.currentCall.phone}</p>
            </div>
            <div className="mb-4">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                callStatus.status === 'dialing' ? 'bg-yellow-100 text-yellow-800' :
                callStatus.status === 'ringing' ? 'bg-blue-100 text-blue-800' :
                callStatus.status === 'connected' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {callStatus.status === 'dialing' && 'Dialing...'}
                {callStatus.status === 'ringing' && 'Ringing...'}
                {callStatus.status === 'connected' && `Connected • ${formatDuration(callStatus.currentCall.duration)}`}
              </div>
            </div>
            <div className="flex justify-center space-x-4 mb-6">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-full transition-colors ${
                  isMuted ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </button>
              <button
                onClick={onEndCall}
                className="p-3 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                <PhoneOff className="h-6 w-6" />
              </button>
              <button className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200">
                <Volume2 className="h-6 w-6" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-gray-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500">{volume}%</span>
            </div>
          </div>
        )}

        {/* Phone Input */}
        {!callStatus.isActive && (
          <div className="mb-6">
            <div className="text-center mb-4">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone number"
                className="text-2xl font-mono text-center w-full border-none outline-none bg-transparent"
                maxLength={20}
              />
            </div>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {keypadButtons.map(({ key, letters }) => (
            <button
              key={key}
              onClick={() => handleKeyPress(key === '+' ? '+' : key)}
              className="aspect-square flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 rounded-lg"
            >
              <span className="text-xl font-semibold text-gray-900">{key}</span>
              {letters && (
                <span className="text-xs text-gray-500 mt-1">{letters}</span>
              )}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {!callStatus.isActive && (
            <>
              <button
                onClick={handleBackspace}
                disabled={phoneNumber.length === 0}
                className="p-3 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 disabled:opacity-50"
              >
                <Backspace className="h-6 w-6" />
              </button>
              <button
                onClick={handleCall}
                disabled={phoneNumber.length === 0}
                className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50"
              >
                <Phone className="h-6 w-6" />
              </button>
            </>
          )}
        </div>

        {/* Recents */}
        {!callStatus.isActive && phoneNumber.length === 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Recent</h4>
            <div className="space-y-2">
              {['+919876543210', '+447911123456', '+15551234567'].map((number, index) => (
                <button
                  key={index}
                  onClick={() => setPhoneNumber(number)}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  {number}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebDialer;
