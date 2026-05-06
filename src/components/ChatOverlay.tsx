"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Camera, Heart, ArrowUp } from "lucide-react";

interface VendorCardProps {
  name: string;
  desc: string;
  price: string;
  accentColor: string;
  iconBg: string;
}

function VendorCard({ name, desc, price, accentColor, iconBg }: VendorCardProps) {
  return (
    <div
      className="flex flex-row items-center gap-2.5 rounded-2xl cursor-pointer transition-colors"
      style={{
        backgroundColor: "#1A1428",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "11px",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.border = `1px solid ${accentColor}4D`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.border = "1px solid rgba(255,255,255,0.08)";
      }}
    >
      <div
        className="flex items-center justify-center rounded-xl flex-shrink-0"
        style={{ width: "46px", height: "46px", backgroundColor: iconBg }}
      >
        <Camera size={20} style={{ color: accentColor }} />
      </div>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="font-semibold" style={{ color: "#F5F0E8", fontSize: "13px" }}>
          {name}
        </span>
        <span style={{ color: "#7A7280", fontSize: "11px" }}>{desc}</span>
        <span className="font-medium" style={{ color: accentColor, fontSize: "12px" }}>
          {price}
        </span>
      </div>
      <Heart size={18} style={{ color: "#7A7280" }} className="flex-shrink-0" />
    </div>
  );
}

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChatOverlay({ isOpen, onClose }: ChatOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ backgroundColor: "#0F0A1A" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {/* Header */}
          <div
            className="flex-shrink-0 flex flex-row items-center gap-2.5"
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Back button */}
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "rgba(255,255,255,0.08)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <ChevronDown size={18} style={{ color: "#F5F0E8" }} />
            </button>

            {/* Center */}
            <div className="flex flex-col flex-1 items-center">
              <span className="font-semibold" style={{ color: "#F5F0E8", fontSize: "14px" }}>
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

            {/* Avatar */}
            <div
              className="flex items-center justify-center rounded-full font-bold flex-shrink-0"
              style={{
                width: "32px",
                height: "32px",
                backgroundColor: "#E8A87C",
                color: "#1A1428",
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
            {/* Message 1 – agent */}
            <div className="self-start" style={{ maxWidth: "84%" }}>
              <div
                className="text-sm leading-relaxed"
                style={{
                  backgroundColor: "#1A1428",
                  borderRadius: "16px 16px 4px 16px",
                  padding: "11px 14px",
                  color: "#F5F0E8",
                  whiteSpace: "pre-line",
                }}
              >
                {"שלום נועה! 127 ימים לחתונה.\nזה הזמן לסגור צלם - הכי חשוב שלא להשאיר לרגע האחרון. יש לי 3 המלצות שמדויקות לסגנון שלכם."}
              </div>
            </div>

            {/* Message 2 – user */}
            <div className="self-end" style={{ maxWidth: "84%" }}>
              <div
                className="text-sm leading-relaxed"
                style={{
                  backgroundColor: "rgba(232,168,124,0.10)",
                  border: "1px solid rgba(232,168,124,0.22)",
                  borderRadius: "16px 16px 16px 4px",
                  padding: "11px 14px",
                  color: "#F5F0E8",
                }}
              >
                אשמח לראות! ניסינו ליצור קשר עם דנה לוי אבל לא ענתה
              </div>
            </div>

            {/* Message 3 – agent with vendor cards */}
            <div className="self-start flex flex-col" style={{ maxWidth: "84%", gap: "8px" }}>
              <div
                className="text-sm leading-relaxed"
                style={{
                  backgroundColor: "#1A1428",
                  borderRadius: "16px 16px 4px 16px",
                  padding: "11px 14px",
                  color: "#F5F0E8",
                }}
              >
                אני אבדוק ישירות מולה. בינתיים - 3 צלמים שמדויקים לסגנון שלכם:
              </div>

              <VendorCard
                name="יובל כהן צילום"
                desc="סגנון דוקומנטרי · תל אביב"
                price="₪8,500–12,000"
                accentColor="#E8A87C"
                iconBg="rgba(232,168,124,0.10)"
              />
              <VendorCard
                name="מיכל ברק סטודיו"
                desc="בוהו-שיק · מרכז"
                price="₪7,000–10,000"
                accentColor="#9B7BC4"
                iconBg="rgba(155,123,196,0.10)"
              />
              <VendorCard
                name="לירן אביב"
                desc="לייטרום · כפר סבא"
                price="₪6,500–9,000"
                accentColor="#D4B896"
                iconBg="rgba(212,184,150,0.10)"
              />
            </div>
          </div>

          {/* Input bar */}
          <div
            className="flex-shrink-0"
            style={{
              padding: "10px 12px 20px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div
              className="flex flex-row items-center gap-2 rounded-full transition-colors"
              style={{
                backgroundColor: "#1A1428",
                border: "1px solid rgba(255,255,255,0.09)",
                paddingLeft: "16px",
                paddingRight: "8px",
                paddingTop: "8px",
                paddingBottom: "8px",
              }}
              onFocusCapture={(e) => {
                (e.currentTarget as HTMLDivElement).style.border =
                  "1px solid rgba(232,168,124,0.30)";
              }}
              onBlurCapture={(e) => {
                (e.currentTarget as HTMLDivElement).style.border =
                  "1px solid rgba(255,255,255,0.09)";
              }}
            >
              <input
                className="flex-1 bg-transparent text-sm outline-none"
                style={{
                  color: "#F5F0E8",
                  direction: "rtl",
                  fontFamily: "inherit",
                }}
                placeholder="כתוב הודעה..."
              />
              <button
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{
                  width: "34px",
                  height: "34px",
                  backgroundColor: "#E8A87C",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <ArrowUp size={16} style={{ color: "#1A1428" }} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
