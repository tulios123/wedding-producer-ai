"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowUp, RotateCcw } from "lucide-react";
import type { Profile, Slot, UpdateTag, Message } from "@/types";
import { VendorCard } from "@/components/VendorCard";
import { CalendarPicker } from "@/components/CalendarPicker";
import vendorsData from "@/data/vendors.json";
import { clearAll } from "@/hooks/usePersistedState";

function renderMessage(content: string): string {
  return content
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

interface WelcomeScreenProps {
  messages: Message[];
  setMessages: (value: Message[] | ((prev: Message[]) => Message[])) => void;
  onUpdate: (update: UpdateTag) => void;
  onNavigate: (screen: "dashboard") => void;
  profile: Profile;
  slots: Slot[];
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
}

export default function WelcomeScreen({ messages, setMessages, onUpdate, onNavigate, profile, slots, favorites = [], onToggleFavorite }: WelcomeScreenProps) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasMessages = messages.some((m) => m.role === "user");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? inputValue).trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    if (!overrideText) setInputValue("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, profile, slots }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const assistantMsg: Message = { role: "assistant", content: data.reply };
      if (data.cards?.length) assistantMsg.cards = data.cards;
      if (data.datePicker) assistantMsg.datePicker = data.datePicker;
      setMessages((prev) => [...prev, assistantMsg]);
      for (const update of data.updates ?? []) {
        if (update.type === "navigation") {
          if (update.action === "go_to_dashboard") onNavigate("dashboard");
        } else {
          onUpdate(update);
        }
      }
    } catch (e) {
      console.error("[WelcomeScreen] sendMessage error:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "אירעה שגיאה, נסה שוב" },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 overflow-y-auto"
      style={{ backgroundColor: "#FBF6F2", direction: "rtl" }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "fixed",
          top: "35%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "700px",
          height: "700px",
          background: "radial-gradient(circle, rgba(201,123,143,0.10) 0%, transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Content column */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "600px",
          margin: "0 auto",
          padding: "28vh 20px max(80px, calc(60px + env(safe-area-inset-bottom)))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Hero text */}
        <motion.div
          style={{ textAlign: "center", width: "100%", marginBottom: "32px" }}
          animate={{
            opacity: hasMessages ? 0.3 : 1,
            y: hasMessages ? -20 : 0,
          }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <h1
            style={{
              fontSize: "clamp(32px, 6vw, 48px)",
              fontWeight: "400",
              color: "#1A0F14",
              lineHeight: 1.15,
              marginBottom: "12px",
              fontFamily: "'DM Serif Display', serif",
            }}
          >
            תכננו את החתונה שלכם
          </h1>
          <p style={{ color: "#A89098", fontSize: "18px", lineHeight: 1.5, margin: 0 }}>
            המפיק שלכם כאן לעזור — שאלו הכל
          </p>
        </motion.div>

        {/* Input box */}
        <div
          style={{
            width: "100%",
            backgroundColor: "#FFFFFF",
            border: "1px solid rgba(180,120,140,0.15)",
            borderRadius: "16px",
            padding: "14px 14px 14px 20px",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: "10px",
            boxShadow: "0 2px 20px rgba(201,123,143,0.10)",
          }}
        >
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none"
            style={{
              color: "#1A0F14",
              fontSize: "15px",
              direction: "rtl",
              fontFamily: "inherit",
            }}
            placeholder="ספרו לי עליכם — מי אתם ומתי החתונה."
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
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              backgroundColor: isLoading ? "rgba(201,123,143,0.4)" : "#C97B8F",
              border: "none",
              cursor: isLoading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "background-color 0.2s",
            }}
          >
            <ArrowUp size={16} style={{ color: "#FFFFFF" }} />
          </button>
        </div>

        {/* Skip link + dev reset */}
        <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={() => {
            if (window.confirm("איפוס יחזיר הכל למצב התחלתי. בטוח?")) {
              clearAll();
              window.location.reload();
            }
          }}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: "28px", height: "28px", borderRadius: "50%",
            backgroundColor: "rgba(180,120,140,0.10)",
            border: "1px solid rgba(180,120,140,0.15)",
            cursor: "pointer", flexShrink: 0,
          }}
        >
          <RotateCcw size={13} style={{ color: "#A89098" }} />
        </button>
        <button
          onClick={() => onNavigate("dashboard")}
          style={{
            color: "#A89098",
            fontSize: "13px",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          כבר יש לי נתונים — עבור לדשבורד
        </button>
        </div>

        {/* Conversation */}
        {hasMessages && (
          <div
            style={{
              width: "100%",
              marginTop: "28px",
              maxHeight: "50vh",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "11px",
            }}
          >
            {messages.map((msg, i) =>
              msg.role === "assistant" ? (
                <div key={i} style={{ alignSelf: "flex-start", display: "flex", flexDirection: "column" }}>
                  <div
                    style={{
                      maxWidth: "84%",
                      backgroundColor: "#FFFFFF",
                      borderRadius: "16px 16px 4px 16px",
                      padding: "11px 14px",
                      color: "#1A0F14",
                      fontSize: "14px",
                      lineHeight: 1.6,
                      boxShadow: "0 1px 8px rgba(180,120,140,0.08)",
                    }}
                    dangerouslySetInnerHTML={{ __html: renderMessage(msg.content) }}
                  />
                  {msg.cards && msg.cards.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                      {msg.cards.map((id) => (
                        <VendorCard
                          key={id}
                          vendorId={id}
                          onTap={() => {
                            const vendor = vendorsData.vendors.find((v) => v.id === id);
                            if (vendor) sendMessage(`ספר לי עוד על ${vendor.name}`);
                          }}
                          onHeartClick={() => onToggleFavorite?.(id)}
                          isFavorite={favorites.includes(id)}
                        />
                      ))}
                    </div>
                  )}
                  {msg.datePicker && i === messages.length - 1 && (
                    <div style={{ marginTop: "8px", maxWidth: "360px" }}>
                      <CalendarPicker onSelect={(val) => sendMessage(val)} />
                    </div>
                  )}
                </div>
              ) : (
                <div key={i} style={{ alignSelf: "flex-end", maxWidth: "84%" }}>
                  <div
                    style={{
                      backgroundColor: "rgba(201,123,143,0.10)",
                      border: "1px solid rgba(201,123,143,0.20)",
                      borderRadius: "16px 16px 16px 4px",
                      padding: "11px 14px",
                      color: "#1A0F14",
                      fontSize: "14px",
                      lineHeight: 1.6,
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              )
            )}

            {isLoading && (
              <div style={{ alignSelf: "flex-start" }}>
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: "16px 16px 4px 16px",
                    padding: "14px 16px",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                    boxShadow: "0 1px 8px rgba(180,120,140,0.08)",
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

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
