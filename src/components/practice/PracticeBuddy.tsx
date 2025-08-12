'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Users, Copy, Check, Video, Mic, MicOff, Share2 } from '@/lib/icons';

interface PracticeBuddyProps {
  sessionId?: string;
  onCreateSession?: () => void;
  onJoinSession?: (sessionId: string) => void;
}

export const PracticeBuddy: React.FC<PracticeBuddyProps> = ({
  sessionId,
  onCreateSession,
  onJoinSession,
}) => {
  const [isHost, setIsHost] = useState(false);
  const [buddyJoined, setBuddyJoined] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [partnerAnswer, setPartnerAnswer] = useState('');
  const [myAnswer, setMyAnswer] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (sessionId) {
      const link = `${window.location.origin}/practice-buddy?session=${sessionId}`;
      setShareLink(link);
    }
  }, [sessionId]);

  const handleCreateSession = () => {
    setIsHost(true);
    onCreateSession?.();
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Simulated question for demo
  useEffect(() => {
    if (buddyJoined) {
      setCurrentQuestion("Tell me about a time you worked effectively in a team environment.");
    }
  }, [buddyJoined]);

  if (!sessionId) {
    return (
      <GlassCard className="max-w-2xl mx-auto p-8 text-center">
        <Users className="w-16 h-16 mx-auto mb-4 text-blue-500" />
        <h2 className="text-2xl font-bold mb-4">Practice with a Buddy</h2>
        <p className="text-gray-600 mb-6">
          Practice interviews together in real-time. Share a session link with a friend 
          and practice answering questions simultaneously.
        </p>
        <div className="space-y-4">
          <Button
            onClick={handleCreateSession}
            variant="primary"
            size="lg"
            className="w-full"
          >
            <Users className="w-5 h-5 mr-2" />
            Create Practice Session
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or</span>
            </div>
          </div>
          <input
            type="text"
            placeholder="Enter session code"
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                onJoinSession?.(e.currentTarget.value);
              }
            }}
          />
        </div>
      </GlassCard>
    );
  }

  if (!buddyJoined) {
    return (
      <GlassCard className="max-w-2xl mx-auto p-8 text-center">
        <Share2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h2 className="text-2xl font-bold mb-4">Waiting for Your Practice Buddy</h2>
        <p className="text-gray-600 mb-6">
          Share this link with your practice partner:
        </p>
        <div className="flex items-center space-x-2 mb-6">
          <input
            type="text"
            value={shareLink}
            readOnly
            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
          />
          <Button
            onClick={handleCopyLink}
            variant="secondary"
            className="flex items-center"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <div className="animate-pulse">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-slide"></div>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Your Side */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">You</h3>
          <div className="flex space-x-2">
            <Button
              onClick={handleToggleMute}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <Video className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Current Question:</p>
            <p className="font-medium">{currentQuestion}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Answer
            </label>
            <textarea
              value={myAnswer}
              onChange={(e) => setMyAnswer(e.target.value)}
              className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Type your answer here..."
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {myAnswer.split(' ').filter(w => w).length} words
            </span>
            <Button variant="primary" size="sm">
              Submit Answer
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Buddy's Side */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Buddy</h3>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500">Connected</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">Current Question:</p>
            <p className="font-medium">{currentQuestion}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buddy's Answer
            </label>
            <div className="w-full h-32 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
              {partnerAnswer ? (
                <p className="text-gray-700">{partnerAnswer}</p>
              ) : (
                <p className="text-gray-400 italic">Waiting for buddy's response...</p>
              )}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              {partnerAnswer ? `${partnerAnswer.split(' ').filter(w => w).length} words` : 'No response yet'}
            </span>
            {partnerAnswer && (
              <span className="text-sm text-green-600 font-medium">
                ✓ Answered
              </span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Timer and Controls */}
      <div className="lg:col-span-2">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-sm text-gray-500">Time Remaining</p>
                <p className="text-2xl font-bold text-blue-600">2:45</p>
              </div>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="text-center">
                <p className="text-sm text-gray-500">Question</p>
                <p className="text-2xl font-bold">1 / 10</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="secondary">
                Skip Question
              </Button>
              <Button variant="primary">
                Next Question →
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default PracticeBuddy;