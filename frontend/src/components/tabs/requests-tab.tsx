'use client';

import { useState } from 'react';
import { Check, X, Clock, Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserUsername: string;
  fromUserEmail: string;
  message?: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface OutgoingRequest {
  id: string;
  toUserId: string;
  toUserName: string;
  toUserUsername: string;
  timestamp: string;
  status: 'pending' | 'accepted' | 'rejected';
}

// Mock data - will be replaced with real API calls
const mockIncomingRequests: FriendRequest[] = [
  {
    id: '1',
    fromUserId: 'user1',
    fromUserName: 'Alice Johnson',
    fromUserUsername: 'alice_j',
    fromUserEmail: 'alice@example.com',
    message: 'Hi! I saw your profile and would love to connect.',
    timestamp: '2 hours ago',
    status: 'pending',
  },
  {
    id: '2',
    fromUserId: 'user2',
    fromUserName: 'Bob Smith',
    fromUserUsername: 'bob_smith',
    fromUserEmail: 'bob@example.com',
    timestamp: '1 day ago',
    status: 'pending',
  },
];

const mockOutgoingRequests: OutgoingRequest[] = [
  {
    id: '3',
    toUserId: 'user3',
    toUserName: 'Charlie Brown',
    toUserUsername: 'charlie_b',
    timestamp: '3 hours ago',
    status: 'pending',
  },
  {
    id: '4',
    toUserId: 'user4',
    toUserName: 'Diana Prince',
    toUserUsername: 'diana_p',
    timestamp: '2 days ago',
    status: 'pending',
  },
];

interface RequestsTabProps {
  onAcceptRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
  onCancelRequest?: (requestId: string) => void;
}

export function RequestsTab({ 
  onAcceptRequest, 
  onRejectRequest, 
  onCancelRequest 
}: RequestsTabProps) {
  const [activeSection, setActiveSection] = useState<'incoming' | 'outgoing'>('incoming');
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>(mockIncomingRequests);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingRequest[]>(mockOutgoingRequests);

  const pendingIncoming = incomingRequests.filter(req => req.status === 'pending');
  const pendingOutgoing = outgoingRequests.filter(req => req.status === 'pending');

  const handleAcceptRequest = (requestId: string) => {
    setIncomingRequests(requests =>
      requests.map(req =>
        req.id === requestId ? { ...req, status: 'accepted' as const } : req
      )
    );
    onAcceptRequest?.(requestId);
  };

  const handleRejectRequest = (requestId: string) => {
    setIncomingRequests(requests =>
      requests.map(req =>
        req.id === requestId ? { ...req, status: 'rejected' as const } : req
      )
    );
    onRejectRequest?.(requestId);
  };

  const handleCancelRequest = (requestId: string) => {
    setOutgoingRequests(requests =>
      requests.filter(req => req.id !== requestId)
    );
    onCancelRequest?.(requestId);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Section Toggle */}
      <div className="border-b border-border">
        <div className="flex">
          <button
            onClick={() => setActiveSection('incoming')}
            className={cn(
              "flex-1 flex items-center justify-center",
              "py-3 px-4 text-sm font-medium",
              "border-b-2 transition-colors",
              activeSection === 'incoming'
                ? "text-accent border-accent"
                : "text-secondary border-transparent hover:text-white"
            )}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Incoming
            {pendingIncoming.length > 0 && (
              <span className="ml-2 bg-accent text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingIncoming.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveSection('outgoing')}
            className={cn(
              "flex-1 flex items-center justify-center",
              "py-3 px-4 text-sm font-medium",
              "border-b-2 transition-colors",
              activeSection === 'outgoing'
                ? "text-accent border-accent"
                : "text-secondary border-transparent hover:text-white"
            )}
          >
            <Clock className="w-4 h-4 mr-2" />
            Sent
            {pendingOutgoing.length > 0 && (
              <span className="ml-2 bg-secondary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pendingOutgoing.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSection === 'incoming' && (
          <IncomingRequestsContent
            requests={pendingIncoming}
            onAccept={handleAcceptRequest}
            onReject={handleRejectRequest}
          />
        )}
        
        {activeSection === 'outgoing' && (
          <OutgoingRequestsContent
            requests={pendingOutgoing}
            onCancel={handleCancelRequest}
          />
        )}
      </div>
    </div>
  );
}

// Incoming Requests Component
function IncomingRequestsContent({
  requests,
  onAccept,
  onReject,
}: {
  requests: FriendRequest[];
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <UserPlus className="w-12 h-12 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Friend Requests</h3>
          <p className="text-secondary">
            When people send you friend requests, they'll appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {requests.map((request) => (
        <div key={request.id} className="p-4">
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                <span className="text-accent font-medium text-lg">
                  {request.fromUserName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Request Info */}
            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <h4 className="font-medium text-white">
                  {request.fromUserName}
                </h4>
                <p className="text-sm text-secondary">
                  @{request.fromUserUsername}
                </p>
                <p className="text-xs text-secondary mt-1">
                  {request.timestamp}
                </p>
              </div>

              {/* Message */}
              {request.message && (
                <div className="mb-3 p-3 bg-secondary/10 rounded-lg border border-border">
                  <p className="text-sm text-white">
                    "{request.message}"
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => onAccept(request.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onReject(request.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Outgoing Requests Component
function OutgoingRequestsContent({
  requests,
  onCancel,
}: {
  requests: OutgoingRequest[];
  onCancel: (requestId: string) => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <Clock className="w-12 h-12 text-secondary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Pending Requests</h3>
          <p className="text-secondary">
            Friend requests you send will appear here while they're pending.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {requests.map((request) => (
        <div key={request.id} className="p-4">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                <span className="text-accent font-medium text-lg">
                  {request.toUserName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white">
                {request.toUserName}
              </h4>
              <p className="text-sm text-secondary">
                @{request.toUserUsername}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="w-3 h-3 text-secondary" />
                <span className="text-xs text-secondary">
                  Sent {request.timestamp}
                </span>
              </div>
            </div>

            {/* Cancel Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCancel(request.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
