'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface ChatMessage {
  id: string;
  content: string;
  senderType: 'user' | 'ai_assistant';
  createdAt: string;
}

interface BookingSlot {
  start: string;
  end: string;
}

interface ChatbotWidgetProps {
  pageId: string;
  businessName: string;
  accentColor?: string;
  calendarEnabled?: boolean;
}

type ViewState = 'chat' | 'booking-date' | 'booking-slots' | 'booking-form' | 'booking-success';

export function ChatbotWidget({
  pageId,
  businessName,
  accentColor = '#2563eb',
  calendarEnabled = false,
}: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [view, setView] = useState<ViewState>('chat');

  // Booking state
  const [bookingDate, setBookingDate] = useState('');
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [bookingName, setBookingName] = useState('');
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingLink, setBookingLink] = useState('');

  // Lead capture state
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadCaptured, setLeadCaptured] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageCountRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Show lead capture after 3 messages if not captured yet
  useEffect(() => {
    if (messages.length >= 6 && !leadCaptured && !showLeadCapture) {
      setShowLeadCapture(true);
    }
  }, [messages, leadCaptured, showLeadCapture]);

  async function handleSend() {
    if (!input.trim() || sending) return;

    const userMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      content: input.trim(),
      senderType: 'user',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const msgText = input;
    setInput('');
    setSending(true);
    messageCountRef.current += 1;

    try {
      const res = await fetch(`/api/chatbot/${pageId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msgText,
          conversationId,
          ...(leadCaptured && leadName && { visitorName: leadName }),
          ...(leadCaptured && leadEmail && { visitorEmail: leadEmail }),
          ...(leadCaptured && leadPhone && { visitorPhone: leadPhone }),
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      if (!conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: data.message.id,
          content: data.message.content,
          senderType: 'ai_assistant',
          createdAt: data.message.createdAt,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: "Sorry, I couldn't process that. Please try again.",
          senderType: 'ai_assistant',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function handleLeadSubmit() {
    setLeadCaptured(true);
    setShowLeadCapture(false);
  }

  async function fetchSlots(date: string) {
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/chatbot/${pageId}/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getSlots', date }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setSlots(data.slots || []);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleBooking() {
    if (!selectedSlot || !bookingName || !bookingEmail) return;
    setBookingSubmitting(true);

    try {
      const res = await fetch(`/api/chatbot/${pageId}/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'book',
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          name: bookingName,
          email: bookingEmail,
          phone: bookingPhone || undefined,
          notes: bookingNotes || undefined,
        }),
      });

      if (!res.ok) return;
      const data = await res.json();
      setBookingLink(data.eventLink || '');
      setView('booking-success');
    } finally {
      setBookingSubmitting(false);
    }
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function getMinDate() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
        style={{ backgroundColor: accentColor }}
        aria-label="Open chat"
      >
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 end-6 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" style={{ height: '500px' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{ backgroundColor: accentColor }}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
            AI
          </div>
          <div>
            <p className="text-sm font-semibold">{businessName}</p>
            <p className="text-xs opacity-80">AI Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {calendarEnabled && view === 'chat' && (
            <button
              onClick={() => setView('booking-date')}
              className="rounded-lg p-1.5 hover:bg-white/20"
              title="Book appointment"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1.5 hover:bg-white/20"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Body */}
      {view === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-3">
            {messages.length === 0 && (
              <div className="mb-3 rounded-2xl rounded-tl-sm bg-gray-100 px-3.5 py-2.5 text-sm text-gray-800">
                Hi! How can I help you today? Ask me anything about {businessName}.
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-2 flex ${msg.senderType === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    msg.senderType === 'user'
                      ? 'rounded-br-sm text-white'
                      : 'rounded-bl-sm bg-gray-100 text-gray-800'
                  }`}
                  style={msg.senderType === 'user' ? { backgroundColor: accentColor } : undefined}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {sending && (
              <div className="mb-2 flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Lead capture prompt */}
            {showLeadCapture && !leadCaptured && (
              <div className="mb-2 rounded-xl border border-blue-200 bg-blue-50 p-3">
                <p className="mb-2 text-xs font-medium text-blue-800">
                  Want me to remember you? Share your details so we can follow up.
                </p>
                <input
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Name"
                  className="mb-1.5 w-full rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs"
                />
                <input
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="Email"
                  type="email"
                  className="mb-1.5 w-full rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs"
                />
                <input
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  placeholder="Phone (optional)"
                  className="mb-2 w-full rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleLeadSubmit}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                    style={{ backgroundColor: accentColor }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowLeadCapture(false)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Skip
                  </button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-2.5">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 rounded-full border border-gray-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ '--tw-ring-color': accentColor } as React.CSSProperties}
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Booking: Date Selection */}
      {view === 'booking-date' && (
        <div className="flex flex-1 flex-col p-4">
          <button onClick={() => setView('chat')} className="mb-3 self-start text-sm text-gray-500 hover:text-gray-700">
            ← Back to chat
          </button>
          <h3 className="mb-1 text-lg font-bold">Book an Appointment</h3>
          <p className="mb-4 text-sm text-gray-500">Select a date to see available times</p>
          <input
            type="date"
            min={getMinDate()}
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            className="mb-4 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            onClick={() => {
              if (!bookingDate) return;
              fetchSlots(bookingDate);
              setView('booking-slots');
            }}
            disabled={!bookingDate}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            View Available Times
          </button>
        </div>
      )}

      {/* Booking: Slot Selection */}
      {view === 'booking-slots' && (
        <div className="flex flex-1 flex-col p-4">
          <button onClick={() => setView('booking-date')} className="mb-3 self-start text-sm text-gray-500 hover:text-gray-700">
            ← Change date
          </button>
          <h3 className="mb-1 text-lg font-bold">{new Date(bookingDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          <p className="mb-3 text-sm text-gray-500">Select a time slot</p>

          {loadingSlots ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : slots.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No available slots for this date</p>
          ) : (
            <div className="flex-1 space-y-1.5 overflow-y-auto">
              {slots.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedSlot(slot);
                    setView('booking-form');
                  }}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-start text-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  {formatTime(slot.start)} — {formatTime(slot.end)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking: Form */}
      {view === 'booking-form' && selectedSlot && (
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <button onClick={() => setView('booking-slots')} className="mb-3 self-start text-sm text-gray-500 hover:text-gray-700">
            ← Change time
          </button>
          <h3 className="mb-1 text-lg font-bold">Complete Booking</h3>
          <p className="mb-4 text-sm text-gray-500">
            {new Date(bookingDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} at {formatTime(selectedSlot.start)}
          </p>

          <div className="space-y-3">
            <input
              value={bookingName}
              onChange={(e) => setBookingName(e.target.value)}
              placeholder="Your name *"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={bookingEmail}
              onChange={(e) => setBookingEmail(e.target.value)}
              placeholder="Email address *"
              type="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              value={bookingPhone}
              onChange={(e) => setBookingPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <textarea
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
              placeholder="Notes (optional)"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            onClick={handleBooking}
            disabled={bookingSubmitting || !bookingName || !bookingEmail}
            className="mt-4 rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            style={{ backgroundColor: accentColor }}
          >
            {bookingSubmitting ? 'Booking...' : 'Confirm Booking'}
          </button>
        </div>
      )}

      {/* Booking: Success */}
      {view === 'booking-success' && (
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: `${accentColor}15` }}
          >
            <svg className="h-8 w-8" style={{ color: accentColor }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold">Booking Confirmed!</h3>
          <p className="mb-4 text-sm text-gray-500">
            You&apos;ll receive a calendar invite at {bookingEmail}
          </p>
          {bookingLink && (
            <a
              href={bookingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 text-sm underline"
              style={{ color: accentColor }}
            >
              View in Google Calendar
            </a>
          )}
          <button
            onClick={() => {
              setView('chat');
              setSelectedSlot(null);
              setBookingDate('');
              setBookingName('');
              setBookingEmail('');
              setBookingPhone('');
              setBookingNotes('');
            }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Back to chat
          </button>
        </div>
      )}

      {/* Powered by */}
      <div className="border-t border-gray-100 py-1.5 text-center text-[10px] text-gray-400">
        Powered by SNAP.Cards
      </div>
    </div>
  );
}
