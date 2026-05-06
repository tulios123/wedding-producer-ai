"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Camera,
  Music,
  UtensilsCrossed,
  Shirt,
  Sparkles,
  ArrowUp,
} from "lucide-react";
import ChatOverlay from "@/components/ChatOverlay";

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <>
      <ChatOverlay isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <motion.div
        className="flex flex-col h-screen w-full"
        style={{ backgroundColor: "#0F0A1A" }}
        animate={{ opacity: chatOpen ? 0.3 : 1 }}
        transition={{ duration: 0.25 }}
      >
        {/* Max-width container */}
        <div
          className="flex flex-col h-full mx-auto w-full"
          style={{
            maxWidth: "430px",
            borderLeft: "1px solid rgba(255,255,255,0.05)",
            borderRight: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-row items-center justify-between px-4 py-4">
              <div className="flex flex-col">
                <span style={{ color: "#7A7280", fontSize: "11px" }}>AI Wedding Producer</span>
                <span className="font-bold" style={{ color: "#F5F0E8", fontSize: "18px" }}>
                  שלום, נועה
                </span>
              </div>
              <div
                className="flex items-center justify-center rounded-full font-bold text-sm flex-shrink-0"
                style={{ width: "36px", height: "36px", backgroundColor: "#E8A87C", color: "#1A1428" }}
              >
                נ
              </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-2" style={{ gap: "10px", padding: "0 16px 100px" }}>

              {/* Widget 1 – Hero */}
              <div
                className="col-span-2 rounded-3xl relative overflow-hidden"
                style={{
                  backgroundColor: "#1A1428",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "20px",
                }}
              >
                {/* Glow overlay */}
                <div style={{
                  position: "absolute",
                  top: "-60px",
                  right: "-60px",
                  width: "250px",
                  height: "250px",
                  background: "radial-gradient(circle, rgba(232,168,124,0.12) 0%, transparent 70%)",
                  pointerEvents: "none",
                  borderRadius: "50%",
                }} />

                <p style={{ color: "#7A7280", fontSize: "11px", marginBottom: "8px" }}>
                  נועה & אור · 12.09.2025
                </p>
                <div className="flex flex-row items-baseline gap-2">
                  <span
                    className="font-extrabold leading-none"
                    style={{
                      fontSize: "60px",
                      background: "linear-gradient(135deg, #F8B4A6 0%, #E89579 50%, #D4A574 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    127
                  </span>
                  <span style={{ color: "#B8B0A8", fontSize: "20px" }}>ימים</span>
                </div>
                <p style={{ color: "#B8B0A8", fontSize: "14px", marginTop: "2px", marginBottom: "14px" }}>
                  לחתונה שלכם
                </p>
                <CtaBox />
              </div>

              {/* Widget 2 – מקום signed */}
              <div
                className="col-span-2 flex flex-row items-center rounded-2xl"
                style={{
                  backgroundColor: "#1A1428",
                  border: "1px solid rgba(143,188,143,0.30)",
                  padding: "14px",
                  gap: "12px",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl flex-shrink-0"
                  style={{ width: "38px", height: "38px", backgroundColor: "rgba(143,188,143,0.10)" }}
                >
                  <Building2 size={18} style={{ color: "#8FBC8F" }} />
                </div>
                <div className="flex flex-col flex-1">
                  <span style={{ color: "#7A7280", fontSize: "10px" }}>מקום</span>
                  <span className="font-semibold" style={{ color: "#F5F0E8", fontSize: "15px" }}>
                    גן האגם הקסום
                  </span>
                </div>
                <span
                  className="font-semibold flex-shrink-0 rounded-full"
                  style={{
                    backgroundColor: "rgba(143,188,143,0.10)",
                    color: "#8FBC8F",
                    fontSize: "12px",
                    padding: "4px 10px",
                  }}
                >
                  ✓✓ חתום
                </span>
              </div>

              {/* Widget 3 – צילום סטילס */}
              <VendorWidget
                name="צילום סטילס"
                sub="דנה לוי"
                badgeLabel='במו"מ'
                badgeColor="#E8A87C"
                borderColor="rgba(232,168,124,0.20)"
                hoverBorderColor="rgba(232,168,124,0.40)"
                icon={<Camera size={16} style={{ color: "#E8A87C" }} />}
                iconBg="rgba(232,168,124,0.12)"
              />

              {/* Widget 4 – מוזיקה */}
              <VendorWidget
                name="מוזיקה"
                sub="3 אופציות"
                badgeLabel="אוספים"
                badgeColor="#B8A4D9"
                borderColor="rgba(184,164,217,0.20)"
                hoverBorderColor="rgba(184,164,217,0.40)"
                icon={<Music size={16} style={{ color: "#B8A4D9" }} />}
                iconBg="rgba(184,164,217,0.12)"
              />

              {/* Widget 5 – קייטרינג */}
              <VendorWidget
                name="קייטרינג"
                sub="בית מטבח"
                badgeLabel="Hold"
                badgeColor="#D4A574"
                borderColor="rgba(212,165,116,0.20)"
                hoverBorderColor="rgba(212,165,116,0.40)"
                icon={<UtensilsCrossed size={16} style={{ color: "#D4A574" }} />}
                iconBg="rgba(212,165,116,0.12)"
              />

              {/* Widget 6 – שמלת כלה */}
              <VendorWidget
                name="שמלת כלה"
                sub="בוא נדבר"
                badgeLabel="לא טופל"
                badgeColor="#6B6478"
                borderColor="rgba(107,100,120,0.20)"
                hoverBorderColor="rgba(107,100,120,0.38)"
                icon={<Shirt size={16} style={{ color: "#6B6478" }} />}
                iconBg="rgba(107,100,120,0.12)"
                dimmed
              />

              {/* Widget 7 – Budget */}
              <div
                className="col-span-2 rounded-2xl"
                style={{
                  backgroundColor: "#1A1428",
                  border: "1px solid rgba(255,255,255,0.08)",
                  padding: "14px",
                }}
              >
                <p
                  className="font-medium"
                  style={{ color: "#7A7280", fontSize: "11px", marginBottom: "12px" }}
                >
                  תקציב
                </p>
                <div className="flex flex-row justify-between" style={{ marginBottom: "12px" }}>
                  <BudgetCol label="מתוכנן" value="₪120K" valueColor="#F5F0E8" />
                  <BudgetCol label="הוצאה" value="₪47K" valueColor="#E8A87C" />
                  <BudgetCol label="נותר" value="₪73K" valueColor="#8FBC8F" />
                </div>
                <div
                  className="rounded-full"
                  style={{ height: "6px", backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="rounded-full"
                    style={{ width: "39%", height: "100%", backgroundColor: "#E8A87C" }}
                  />
                </div>
                <p style={{ color: "#7A7280", fontSize: "12px", marginTop: "6px" }}>
                  39% מהתקציב נוצל
                </p>
              </div>
            </div>
          </div>

          {/* Chat Bar */}
          <div
            className="sticky bottom-0"
            style={{
              padding: "12px 16px 20px",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              background: "rgba(15, 10, 26, 0.8)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="flex flex-row items-center rounded-full cursor-pointer"
              style={{
                height: "52px",
                backgroundColor: "#221A33",
                border: "1px solid rgba(255,255,255,0.10)",
                gap: "10px",
                paddingLeft: "16px",
                paddingRight: "16px",
              }}
              onClick={() => setChatOpen(true)}
            >
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{ width: "30px", height: "30px", backgroundColor: "#E8A87C" }}
              >
                <Sparkles size={14} style={{ color: "#1A1428" }} />
              </div>
              <span className="flex-1 text-sm" style={{ color: "#7A7280" }}>
                שאל את הסוכן...
              </span>
              <div
                className="flex items-center justify-center rounded-full flex-shrink-0"
                style={{ width: "34px", height: "34px", backgroundColor: "rgba(232,168,124,0.15)" }}
              >
                <ArrowUp size={16} style={{ color: "#E8A87C" }} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function CtaBox() {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex flex-row items-center justify-between rounded-xl cursor-pointer"
      style={{
        background: hovered ? "rgba(232,168,124,0.18)" : "rgba(232,168,124,0.12)",
        border: "1px solid rgba(232,168,124,0.25)",
        padding: "10px 14px",
        transition: "background 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex flex-col">
        <span style={{ color: "#7A7280", fontSize: "10px" }}>הדבר הבא</span>
        <span className="font-semibold" style={{ color: "#E8A87C", fontSize: "14px" }}>
          לסגור צלם
        </span>
      </div>
      <span
        className="font-bold rounded-full"
        style={{
          backgroundColor: "#E8A87C",
          color: "#1A1428",
          fontSize: "12px",
          padding: "4px 12px",
        }}
      >
        דחוף
      </span>
    </div>
  );
}

function VendorWidget({
  name,
  sub,
  badgeLabel,
  badgeColor,
  borderColor,
  hoverBorderColor,
  icon,
  iconBg,
  dimmed = false,
}: {
  name: string;
  sub: string;
  badgeLabel: string;
  badgeColor: string;
  borderColor: string;
  hoverBorderColor: string;
  icon: React.ReactNode;
  iconBg: string;
  dimmed?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex flex-col justify-between rounded-2xl relative cursor-pointer"
      style={{
        backgroundColor: "#1A1428",
        border: `1px solid ${hovered ? hoverBorderColor : borderColor}`,
        padding: "13px",
        minHeight: "108px",
        opacity: dimmed ? 0.6 : 1,
        transition: "border-color 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        className="absolute font-semibold rounded-full"
        style={{
          top: "10px",
          right: "10px",
          backgroundColor: `${badgeColor}1A`,
          color: badgeColor,
          fontSize: "10px",
          padding: "2px 8px",
        }}
      >
        {badgeLabel}
      </span>
      <div
        className="flex items-center justify-center rounded-lg"
        style={{ width: "32px", height: "32px", backgroundColor: iconBg, marginTop: "2px" }}
      >
        {icon}
      </div>
      <div className="flex flex-col" style={{ marginTop: "8px" }}>
        <span className="font-semibold text-sm" style={{ color: "#F5F0E8" }}>
          {name}
        </span>
        <span style={{ color: "#7A7280", fontSize: "12px" }}>{sub}</span>
      </div>
    </div>
  );
}

function BudgetCol({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span style={{ color: "#7A7280", fontSize: "11px" }}>{label}</span>
      <span className="font-semibold" style={{ color: valueColor, fontSize: "15px" }}>
        {value}
      </span>
    </div>
  );
}
