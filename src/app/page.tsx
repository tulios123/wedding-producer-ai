"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Camera,
  UtensilsCrossed,
  Music,
  Shirt,
  Palette,
  Leaf,
  BookOpen,
  Sparkles,
  ArrowUp,
  RotateCcw,
  LucideIcon,
} from "lucide-react";
import ChatOverlay from "@/components/ChatOverlay";
import WelcomeScreen from "@/components/WelcomeScreen";
import { usePersistedState, clearAll } from "@/hooks/usePersistedState";
import type { Slot, Profile, UpdateTag, SlotStatus, Message } from "@/types";

const SLOT_ICONS: Record<string, LucideIcon> = {
  venue: Building2,
  photography: Camera,
  catering: UtensilsCrossed,
  music: Music,
  dress: Shirt,
  makeup: Palette,
  decor: Leaf,
  rabbi: BookOpen,
};

const statusConfig: Record<SlotStatus, { label: string; color: string; bg: string }> = {
  idle:        { label: "לא טופל", color: "#6B6478", bg: "rgba(107,100,120,0.12)" },
  collecting:  { label: "אוספים",  color: "#B8A4D9", bg: "rgba(184,164,217,0.12)" },
  negotiating: { label: 'במו"מ',   color: "#E8A87C", bg: "rgba(232,168,124,0.12)" },
  hold:        { label: "Hold",    color: "#D4A574", bg: "rgba(212,180,150,0.12)" },
  signed:      { label: "חתום",    color: "#8FBC8F", bg: "rgba(143,188,143,0.12)" },
};

const INITIAL_SLOTS: Slot[] = [
  { id: "venue",       label: "מקום",        status: "idle" },
  { id: "photography", label: "צילום סטילס", status: "idle" },
  { id: "catering",    label: "קייטרינג",    status: "idle" },
];

const PLACEHOLDER_SLOTS = [
  { id: "music",  label: "מוזיקה" },
  { id: "dress",  label: "שמלת כלה" },
  { id: "makeup", label: "איפור" },
  { id: "decor",  label: "עיצוב ופרחים" },
  { id: "rabbi",  label: "רב מסדר" },
] as const;

function isExactDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

type DateDisplay =
  | { kind: "countdown"; days: number; formatted: string }
  | { kind: "past" }
  | { kind: "freetext"; text: string }
  | { kind: "none" };

function resolveDateDisplay(weddingDate: string | undefined): DateDisplay {
  if (!weddingDate) return { kind: "none" };
  if (isExactDate(weddingDate)) {
    const d = daysUntil(weddingDate);
    return d >= 0
      ? { kind: "countdown", days: d, formatted: formatDate(weddingDate) }
      : { kind: "past" };
  }
  return { kind: "freetext", text: weddingDate };
}

const INITIAL_CHAT_MESSAGES: Message[] = [
  {
    role: "assistant",
    content: "שלום! אני המפיק שלכם. ספרו לי - מי אתם ומתי החתונה?",
  },
];

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false);
  const [appScreen, setAppScreen] = usePersistedState<'welcome' | 'dashboard'>('screen', 'welcome');
  const [chatHistory, setChatHistory] = usePersistedState<Message[]>("chatHistory", INITIAL_CHAT_MESSAGES);
  const [profile, setProfile] = usePersistedState<Profile>("profile", {});
  const [slots, setSlots] = usePersistedState<Slot[]>("slots", INITIAL_SLOTS);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const handleUpdate = (update: UpdateTag) => {
    if (update.type === "slot") {
      setSlots((prev) =>
        prev.map((s) =>
          s.id === update.slot
            ? {
                ...s,
                status: update.status,
                vendor: update.vendor ?? s.vendor,
                estimate: update.estimate ?? s.estimate,
                amount: update.amount ?? s.amount,
              }
            : s
        )
      );
    } else if (update.type === "profile") {
      setProfile((prev) => ({ ...prev, [update.field]: update.value }));
    }
  };

  if (appScreen === 'welcome') {
    return (
      <WelcomeScreen
        messages={chatHistory}
        setMessages={setChatHistory}
        onUpdate={handleUpdate}
        onNavigate={() => setAppScreen('dashboard')}
        profile={profile}
        slots={slots}
      />
    );
  }

  const venueSlot = slots.find((s) => s.id === "venue");
  const activeSlots = slots.filter((s) => s.id !== "venue");
  const venueCfg = statusConfig[venueSlot?.status ?? "idle"];

  const dateDisplay = resolveDateDisplay(profile.weddingDate);

  const totalBudget = profile.budget ?? 0;
  const totalSpent = slots.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const remaining = totalBudget - totalSpent;
  const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  const greetingName =
    profile.partner1 && profile.partner2
      ? `${profile.partner1} ו${profile.partner2}`
      : null;

  return (
    <>
      <ChatOverlay
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        onUpdate={handleUpdate}
        messages={chatHistory}
        setMessages={setChatHistory}
        profile={profile}
        slots={slots}
      />

      {/* Toast */}
      {toast && (
        <div
          className="fixed z-40 rounded-full text-sm font-medium"
          style={{
            bottom: "96px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#221A33",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#B8B0A8",
            padding: "10px 20px",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}

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
                  {greetingName ? `שלום, ${greetingName}` : "שלום!"}
                </span>
              </div>
              <div className="flex flex-row items-center gap-2">
                {process.env.NODE_ENV !== "production" && (
                  <button
                    onClick={() => {
                      if (window.confirm("איפוס יחזיר הכל למצב התחלתי. בטוח?")) {
                        clearAll();
                        window.location.reload();
                      }
                    }}
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      cursor: "pointer",
                    }}
                  >
                    <RotateCcw size={14} style={{ color: "#7A7280" }} />
                  </button>
                )}
                <div
                  className="flex items-center justify-center rounded-full font-bold text-sm flex-shrink-0"
                  style={{ width: "36px", height: "36px", backgroundColor: "#E8A87C", color: "#1A1428" }}
                >
                  {profile.partner1 ? profile.partner1[0].toUpperCase() : "?"}
                </div>
              </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-2" style={{ gap: "10px", padding: "0 16px 100px" }}>

              {/* Widget 1 – Hero */}
              <div
                className="col-span-2 rounded-3xl relative overflow-hidden"
                style={{
                  backgroundColor: "#1A1428",
                  border: "1px solid rgba(255,255,255,0.11)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
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
                  {profile.partner1 && profile.partner2
                    ? `${profile.partner1} & ${profile.partner2}${dateDisplay.kind === "countdown" ? ` · ${dateDisplay.formatted}` : ""}`
                    : "AI Wedding Producer"}
                </p>

                {dateDisplay.kind === "countdown" ? (
                  <>
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
                        {dateDisplay.days}
                      </span>
                      <span style={{ color: "#B8B0A8", fontSize: "20px" }}>ימים</span>
                    </div>
                    <p style={{ color: "#B8B0A8", fontSize: "14px", marginTop: "2px", marginBottom: "14px" }}>
                      לחתונה שלכם
                    </p>
                  </>
                ) : dateDisplay.kind === "freetext" ? (
                  <div style={{ marginBottom: "14px", marginTop: "8px" }}>
                    <p
                      className="font-extrabold leading-none"
                      style={{
                        fontSize: "36px",
                        background: "linear-gradient(135deg, #F8B4A6 0%, #E89579 50%, #D4A574 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {dateDisplay.text}
                    </p>
                    <p style={{ color: "#B8B0A8", fontSize: "14px", marginTop: "6px" }}>
                      לחתונה שלכם
                    </p>
                  </div>
                ) : dateDisplay.kind === "past" ? (
                  <div style={{ marginBottom: "14px", marginTop: "8px" }}>
                    <p style={{ color: "#E8A87C", fontSize: "22px", fontWeight: "700" }}>
                      בדוק את התאריך
                    </p>
                    <p style={{ color: "#6B6478", fontSize: "13px", marginTop: "4px" }}>
                      התאריך שנשמר כבר עבר
                    </p>
                  </div>
                ) : (
                  <div style={{ marginBottom: "14px", marginTop: "8px" }}>
                    <p style={{ color: "#B8B0A8", fontSize: "22px", fontWeight: "700" }}>
                      התאריך עוד לא נקבע
                    </p>
                    <p style={{ color: "#6B6478", fontSize: "13px", marginTop: "4px" }}>
                      ספרו לי מתי — ואתחיל לתכנן
                    </p>
                  </div>
                )}
              </div>

              {/* Widget 2 – Venue (dynamic) */}
              <div
                className="col-span-2 flex flex-row items-center rounded-2xl overflow-hidden relative"
                style={{
                  border: `1px solid ${venueCfg.color}4D`,
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                  minHeight: "80px",
                  padding: "14px",
                  gap: "12px",
                  ...(venueSlot?.vendor
                    ? {
                        backgroundImage:
                          "url(https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : { backgroundColor: "#1A1428" }),
                }}
              >
                {venueSlot?.vendor && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to left, rgba(15,10,26,0.85) 0%, rgba(15,10,26,0.5) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                )}
                <div
                  className="flex items-center justify-center rounded-xl flex-shrink-0 relative"
                  style={{ width: "38px", height: "38px", backgroundColor: venueCfg.bg }}
                >
                  <Building2 size={18} style={{ color: venueCfg.color }} />
                </div>
                <div className="flex flex-col flex-1 relative">
                  <span style={{ color: "rgba(255,255,255,0.55)", fontSize: "10px" }}>מקום</span>
                  <span className="font-semibold" style={{ color: "#F5F0E8", fontSize: "15px" }}>
                    {venueSlot?.vendor ?? "בוא נדבר על מקום"}
                  </span>
                </div>
                <span
                  className="font-semibold flex-shrink-0 rounded-full relative"
                  style={{
                    backgroundColor: `${venueCfg.color}2E`,
                    color: venueCfg.color,
                    fontSize: "12px",
                    padding: "4px 10px",
                  }}
                >
                  {venueSlot?.status === "signed" ? "✓✓ חתום" : venueCfg.label}
                </span>
              </div>

              {/* Active slot widgets (photography + catering) */}
              {activeSlots.map((slot) => {
                const cfg = statusConfig[slot.status] ?? statusConfig.idle;
                const IconComp = SLOT_ICONS[slot.id];
                return (
                  <VendorWidget
                    key={slot.id}
                    name={slot.label}
                    sub={slot.vendor ?? "בוא נדבר"}
                    badgeLabel={cfg.label}
                    badgeColor={cfg.color}
                    borderColor={`${cfg.color}33`}
                    hoverBorderColor={`${cfg.color}66`}
                    icon={<IconComp size={16} style={{ color: cfg.color }} />}
                    iconBg={cfg.bg}
                    dimmed={slot.status === "idle" && !slot.vendor}
                  />
                );
              })}

              {/* Placeholder slots */}
              {PLACEHOLDER_SLOTS.map((p) => {
                const IconComp = SLOT_ICONS[p.id];
                return (
                  <VendorWidget
                    key={p.id}
                    name={p.label}
                    sub="בקרוב"
                    badgeLabel="לא טופל"
                    badgeColor="#6B6478"
                    borderColor="rgba(107,100,120,0.18)"
                    hoverBorderColor="rgba(107,100,120,0.28)"
                    icon={<IconComp size={16} style={{ color: "#6B6478" }} />}
                    iconBg="rgba(107,100,120,0.08)"
                    dimmed
                    onClick={() =>
                      showToast("בקרוב - הפרוטוטייפ מתמקד ב-3 ספקי המפתח")
                    }
                  />
                );
              })}

              {/* Budget Widget */}
              <div
                className="col-span-2 rounded-2xl"
                style={{
                  backgroundColor: "#1A1428",
                  border: "1px solid rgba(255,255,255,0.11)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                  padding: "14px",
                }}
              >
                <p
                  className="font-medium"
                  style={{ color: "#7A7280", fontSize: "11px", marginBottom: "12px" }}
                >
                  תקציב
                </p>
                {totalBudget > 0 ? (
                  <>
                    <div className="flex flex-row justify-between" style={{ marginBottom: "12px" }}>
                      <BudgetCol
                        label="מתוכנן"
                        value={`₪${Math.round(totalBudget / 1000)}K`}
                        valueColor="#F5F0E8"
                      />
                      <BudgetCol
                        label="הוצאה"
                        value={`₪${Math.round(totalSpent / 1000)}K`}
                        valueColor="#E8A87C"
                      />
                      <BudgetCol
                        label="נותר"
                        value={`₪${Math.round(remaining / 1000)}K`}
                        valueColor="#8FBC8F"
                      />
                    </div>
                    <div
                      className="rounded-full"
                      style={{ height: "6px", backgroundColor: "rgba(255,255,255,0.08)" }}
                    >
                      <div
                        className="rounded-full"
                        style={{ width: `${pct}%`, height: "100%", backgroundColor: "#E8A87C" }}
                      />
                    </div>
                    <p style={{ color: "#7A7280", fontSize: "12px", marginTop: "6px" }}>
                      {pct}% מהתקציב נוצל
                    </p>
                  </>
                ) : (
                  <p style={{ color: "#6B6478", fontSize: "14px" }}>
                    תקציב יוגדר בשיחה
                  </p>
                )}
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
  onClick,
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
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex flex-col justify-between rounded-2xl relative cursor-pointer"
      style={{
        backgroundColor: "#1A1428",
        border: `1px solid ${hovered ? hoverBorderColor : borderColor}`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        padding: "13px",
        minHeight: "108px",
        opacity: dimmed ? 0.6 : 1,
        transition: "border-color 0.2s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
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
