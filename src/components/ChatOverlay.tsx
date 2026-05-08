"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowUp } from "lucide-react";
import type { Profile, Slot, UpdateTag, Message } from "@/types";
import { VendorCard } from "@/components/VendorCard";
import { CalendarPicker } from "@/components/CalendarPicker";
import vendorsData from "@/data/vendors.json";

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (update: UpdateTag) => void;
  onNavigate?: (screen: 'dashboard') => void;
  messages: Message[];
  setMessages: (value: Message[] | ((prev: Message[]) => Message[])) => void;
  profile: Profile;
  slots: Slot[];
  mode?: 'welcome' | 'overlay';
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  onVendorTap?: (vendorId: string) => void;
  initialInput?: string;
  autoSend?: boolean;
  onInitialInputConsumed?: () => void;
  vendorContext?: { slotLabel: string; vendorName?: string } | null;
  initialVendorNote?: string;
}

function renderMessage(content: string): string {
  return content
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

export default function ChatOverlay({ isOpen, onClose, onUpdate, onNavigate, messages, setMessages, profile, slots, mode = 'overlay', favorites = [], onToggleFavorite, onVendorTap, initialInput, autoSend, onInitialInputConsumed, vendorContext, initialVendorNote }: ChatOverlayProps) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoSendRef = useRef(autoSend);
  autoSendRef.current = autoSend;
  const vendorContextRef = useRef(vendorContext);
  vendorContextRef.current = vendorContext;
  const initialVendorNoteRef = useRef(initialVendorNote);
  initialVendorNoteRef.current = initialVendorNote;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialInput) {
      if (autoSendRef.current) {
        sendMessage(initialInput, initialVendorNoteRef.current);
      } else {
        setInputValue(initialInput);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      onInitialInputConsumed?.();
    }
  }, [isOpen, initialInput]); // autoSend / vendorNote intentionally read via ref

  async function sendMessage(overrideText?: string, noteOverride?: string) {
    const text = (overrideText ?? inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    if (noteOverride) userMessage.vendorNote = noteOverride;
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    if (!overrideText) setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, profile, slots, vendorContext: vendorContextRef.current ?? null }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      console.log("[chat] data.updates received:", data.updates);
      const assistantMsg: Message = { role: "assistant", content: data.reply };
      if (data.cards?.length) assistantMsg.cards = data.cards;
      if (data.datePicker) assistantMsg.datePicker = data.datePicker;
      setMessages((prev) => [...prev, assistantMsg]);
      for (const update of (data.updates ?? [])) {
        if (update.type === "navigation") {
          if (update.action === "go_to_dashboard") onNavigate?.("dashboard");
        } else {
          onUpdate(update);
        }
      }
    } catch (e) {
      console.error("[ChatOverlay] sendMessage error:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "אירעה שגיאה, נסה שוב" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: "#FBF6F2" }}
          initial={{ y: mode === 'welcome' ? 0 : "100%" }}
          animate={{ y: 0 }}
          exit={{ y: mode === 'welcome' ? 0 : "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div
            className="flex-shrink-0 flex flex-row items-center gap-2.5"
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(180,120,140,0.12)",
            }}
          >
            {mode === 'welcome' ? (
              <button
                onClick={() => onNavigate?.("dashboard")}
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  height: "32px",
                  padding: "0 12px",
                  backgroundColor: "rgba(180,120,140,0.08)",
                  border: "1px solid rgba(180,120,140,0.12)",
                  cursor: "pointer",
                  color: "#7A5060",
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                עבור לדשבורד
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: "32px",
                  height: "32px",
                  backgroundColor: "rgba(180,120,140,0.10)",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <ChevronDown size={18} style={{ color: "#1A0F14" }} />
              </button>
            )}

            <div className="flex flex-col flex-1 items-center">
              <span className="font-semibold" style={{ color: "#1A0F14", fontSize: "14px" }}>
                מפיק החתונה
              </span>
              <div className="flex flex-row items-center gap-1">
                <span
                  className="rounded-full inline-block"
                  style={{ width: "6px", height: "6px", backgroundColor: "#8FBC8F" }}
                />
                <span style={{ color: "#8FBC8F", fontSize: "12px" }}>פעיל</span>
              </div>
            </div>

            <div
              className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "#C97B8F",
                color: "#FFFFFF",
                fontSize: "14px",
              }}
            >
              מ
            </div>
          </div>

          {/* Messages area */}
          <div
            className="flex-1 overflow-y-auto flex flex-col"
            style={{ padding: "14px 12px", gap: "11px", direction: "rtl" }}
          >
            {messages.map((msg, i) =>
              msg.role === "assistant" ? (
                <div key={i} className="self-start flex flex-col">
                  <div
                    className="text-sm leading-relaxed"
                    style={{
                      maxWidth: "84%",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "16px 16px 4px 16px",
                      padding: "11px 14px",
                      color: "#1A0F14",
                      boxShadow: "0 1px 4px rgba(180,120,140,0.10)",
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }}
                  />
                  {msg.cards && msg.cards.length > 0 && (
                    <div className="flex flex-col gap-2 mt-3">
                      {msg.cards.map((id) => (
                        <VendorCard
                          key={id}
                          vendorId={id}
                          onTap={() => onVendorTap?.(id)}
                          onHeartClick={() => onToggleFavorite?.(id)}
                          isFavorite={favorites.includes(id)}
                        />
                      ))}
                    </div>
                  )}
                  {msg.datePicker && i === messages.length - 1 && (
                    <div style={{ maxWidth: "84%", marginTop: "6px" }}>
                      <CalendarPicker onSelect={(val) => sendMessage(val)} />
                    </div>
                  )}
                </div>
              ) : (
                <div key={i} className="self-end flex flex-col items-end" style={{ maxWidth: "84%" }}>
                  {msg.vendorNote && (
                    <span style={{
                      fontSize: '11px', color: '#E8A87C', marginBottom: '4px',
                      backgroundColor: 'rgba(232,168,124,0.12)', borderRadius: '10px',
                      padding: '2px 9px', fontWeight: 600,
                    }}>
                      בנוגע ל-{msg.vendorNote}
                    </span>
                  )}
                  <div
                    className="text-sm leading-relaxed"
                    style={{
                      backgroundColor: "rgba(201,123,143,0.10)",
                      border: "1px solid rgba(201,123,143,0.22)",
                      borderRadius: "16px 16px 16px 4px",
                      padding: "11px 14px",
                      color: "#1A0F14",
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              )
            )}

            {/* Typing indicator */}
            {isLoading && (
              <div className="self-start" style={{ maxWidth: "84%" }}>
                <div
                  className="flex flex-row items-center gap-1"
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "16px 16px 4px 16px",
                    padding: "14px 16px",
                    boxShadow: "0 1px 4px rgba(180,120,140,0.10)",
                  }}
                >
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      style={{
                        display: "inline-block",
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        backgroundColor: "#C97B8F",
                        animation: "dotPulse 1s ease-in-out infinite",
                        animationDelay: `${delay}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input bar */}
          <div
            className="flex-shrink-0 pb-safe-6"
            style={{
              paddingTop: "10px",
              paddingLeft: "12px",
              paddingRight: "12px",
              borderTop: "1px solid rgba(180,120,140,0.12)",
            }}
          >
            <div
              className="flex flex-row items-center gap-2 rounded-full transition-colors"
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid rgba(180,120,140,0.14)",
                paddingLeft: "16px",
                paddingRight: "8px",
                paddingTop: "8px",
                paddingBottom: "8px",
              }}
              onFocusCapture={(e) => {
                (e.currentTarget as HTMLDivElement).style.border =
                  "1px solid rgba(201,123,143,0.40)";
              }}
              onBlurCapture={(e) => {
                (e.currentTarget as HTMLDivElement).style.border =
                  "1px solid rgba(180,120,140,0.14)";
              }}
            >
              <input
                ref={inputRef}
                className="flex-1 bg-transparent text-sm outline-none"
                style={{
                  color: "#1A0F14",
                  direction: "rtl",
                  fontFamily: "inherit",
                }}
                placeholder="כתוב הודעה..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <button
                onClick={() => sendMessage()}
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: "34px",
                  height: "34px",
                  backgroundColor: isLoading ? "rgba(201,123,143,0.4)" : "#C97B8F",
                  border: "none",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "background-color 0.2s",
                }}
              >
                <ArrowUp size={16} style={{ color: "#FFFFFF" }} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
