import React from 'react';

interface Props {
  from: string;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallModal: React.FC<Props> = ({ from, onAccept, onReject }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-white p-6 rounded shadow-xl text-center">
        <h2 className="text-xl font-bold mb-4">📞 Incoming Call</h2>
        <p className="mb-4">From: <strong>{from}</strong></p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onAccept}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Accept
          </button>
          <button
            onClick={onReject}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;