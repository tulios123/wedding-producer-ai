"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Camera,
  UtensilsCrossed,
  Sparkles,
  ArrowUp,
  RotateCcw,
  ChevronDown,
  Heart,
  Store,
  LucideIcon,
} from "lucide-react";
import ChatOverlay from "@/components/ChatOverlay";
import WelcomeScreen from "@/components/WelcomeScreen";
import { VendorCard } from "@/components/VendorCard";
import { VendorDetailSheet } from "@/components/VendorDetailSheet";
import { SlotVendorSheet } from "@/components/SlotVendorSheet";
import { usePersistedState, clearAll } from "@/hooks/usePersistedState";
import vendorsData from "@/data/vendors.json";
import type { Slot, SlotId, Profile, UpdateTag, SlotStatus, Message } from "@/types";

const SLOT_ICONS: Record<string, LucideIcon> = {
  venue: Building2,
  photography: Camera,
  catering: UtensilsCrossed,
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
  const [favorites, setFavorites] = usePersistedState<string[]>("favorites", []);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<"favorites" | "vendors" | null>(null);
  const [openSlotId, setOpenSlotId] = useState<SlotId | null>(null);
  const [chatInitialInput, setChatInitialInput] = useState("");
  const [chatAutoSend, setChatAutoSend] = useState(false);
  const [chatVendorContext, setChatVendorContext] = useState<{ slotLabel: string; vendorName?: string } | null>(null);

  function toggleFavorite(id: string) {
    setFavorites((prev) => prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]);
  }

  function handleSlotSend(text: string, slot: Slot) {
    setChatVendorContext({ slotLabel: slot.label, vendorName: slot.vendor });
    setChatInitialInput(text);
    setChatAutoSend(true);
    setOpenSlotId(null);
    setChatOpen(true);
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
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />
    );
  }

  const venueSlot = slots.find((s) => s.id === "venue");
  const activeSlots = slots.filter((s) => s.id !== "venue");
  const openSlot = openSlotId ? slots.find((s) => s.id === openSlotId) ?? null : null;
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
      <SlotVendorSheet
        slot={openSlot}
        isFavorite={openSlot?.vendor
          ? favorites.includes(
              (vendorsData.vendors.find(v => v.name === openSlot.vendor)?.id ?? "")
            )
          : false}
        onClose={() => setOpenSlotId(null)}
        onToggleFavorite={toggleFavorite}
        onSend={(text) => openSlot && handleSlotSend(text, openSlot)}
      />

      <VendorDetailSheet
        vendorId={selectedVendorId}
        isFavorite={selectedVendorId ? favorites.includes(selectedVendorId) : false}
        onClose={() => setSelectedVendorId(null)}
        onToggleFavorite={() => selectedVendorId && toggleFavorite(selectedVendorId)}
        onAskAgent={() => {
          if (selectedVendorId) {
            const v = vendorsData.vendors.find((v) => v.id === selectedVendorId);
            if (v) {
              const CAT: Record<string, string> = { venue: "מקום", catering: "קייטרינג", photography: "צילום" };
              setChatVendorContext({ slotLabel: CAT[v.category] ?? v.category, vendorName: v.name });
            }
          }
          setSelectedVendorId(null);
          setChatOpen(true);
        }}
        onChatSend={(text, vendorId) => {
          const v = vendorsData.vendors.find((v) => v.id === vendorId);
          if (!v) return;
          const CAT: Record<string, string> = { venue: "מקום", catering: "קייטרינג", photography: "צילום" };
          setChatVendorContext({ slotLabel: CAT[v.category] ?? v.category, vendorName: v.name });
          setChatInitialInput(text);
          setChatAutoSend(true);
          setSelectedVendorId(null);
          setChatOpen(true);
        }}
      />

      <ChatOverlay
        isOpen={chatOpen}
        onClose={() => { setChatOpen(false); setChatVendorContext(null); }}
        onUpdate={handleUpdate}
        messages={chatHistory}
        setMessages={setChatHistory}
        profile={profile}
        slots={slots}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
        onVendorTap={(id) => setSelectedVendorId(id)}
        initialInput={chatInitialInput}
        autoSend={chatAutoSend}
        onInitialInputConsumed={() => { setChatInitialInput(""); setChatAutoSend(false); }}
        vendorContext={chatVendorContext}
      />


      <motion.div
        className="flex flex-col h-screen w-full"
        style={{ backgroundColor: "#100C1C" }}
        animate={{ opacity: chatOpen ? 0.3 : 1 }}
        transition={{ duration: 0.25 }}
      >
        {/* Max-width container */}
        <div className="flex flex-col h-full mx-auto w-full" style={{ maxWidth: "430px" }}>
          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-row items-center justify-between px-4" style={{ paddingTop: "16px", paddingBottom: "8px" }}>
              <div className="flex flex-col">
                <span style={{ color: "rgba(245,240,232,0.35)", fontSize: "11px", letterSpacing: "0.04em" }}>AI Wedding Producer</span>
                <span className="font-bold" style={{ color: "#F5F0E8", fontSize: "20px", letterSpacing: "-0.3px" }}>
                  {greetingName ? `${greetingName}` : "שלום!"}
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
                    style={{ width: "30px", height: "30px", backgroundColor: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer" }}
                  >
                    <RotateCcw size={13} style={{ color: "rgba(245,240,232,0.3)" }} />
                  </button>
                )}
                <div
                  className="flex items-center justify-center rounded-full font-bold text-sm flex-shrink-0"
                  style={{ width: "34px", height: "34px", backgroundColor: "#E8A87C", color: "#1A1428", fontSize: "13px" }}
                >
                  {profile.partner1 ? profile.partner1[0].toUpperCase() : "?"}
                </div>
              </div>
            </div>

            {/* Widget Grid */}
            <div className="grid grid-cols-2" style={{ gap: "8px", padding: "8px 12px 110px" }}>

              {/* Widget 1 – Hero */}
              <div
                className="col-span-2 rounded-[22px] relative overflow-hidden"
                style={{
                  backgroundColor: "#1C1828",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
                  padding: "18px 18px 16px",
                  minHeight: "130px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                {/* top row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <span style={{ color: "rgba(245,240,232,0.4)", fontSize: "12px", fontWeight: "500" }}>
                    {dateDisplay.kind === "countdown" ? "ימים לחתונה" : "מועד החתונה"}
                  </span>
                  {profile.partner1 && profile.partner2 && (
                    <span style={{
                      backgroundColor: "rgba(232,168,124,0.15)", color: "#E8A87C",
                      fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "20px",
                    }}>
                      {profile.partner1} & {profile.partner2}
                    </span>
                  )}
                </div>

                {/* main value */}
                {dateDisplay.kind === "countdown" ? (
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
                    <span style={{
                      fontSize: "80px", fontWeight: "800", lineHeight: 1, letterSpacing: "-4px",
                      color: "#F5F0E8",
                    }}>
                      {dateDisplay.days}
                    </span>
                    <span style={{ color: "rgba(245,240,232,0.5)", fontSize: "22px", fontWeight: "300", paddingBottom: "10px" }}>
                      ימים
                    </span>
                  </div>
                ) : dateDisplay.kind === "freetext" ? (
                  <p style={{ fontSize: "40px", fontWeight: "800", letterSpacing: "-1px", color: "#F5F0E8", lineHeight: 1.1 }}>
                    {dateDisplay.text}
                  </p>
                ) : dateDisplay.kind === "past" ? (
                  <p style={{ fontSize: "26px", fontWeight: "700", color: "#E8A87C" }}>בדוק את התאריך</p>
                ) : (
                  <p style={{ fontSize: "22px", fontWeight: "600", color: "rgba(245,240,232,0.55)" }}>תאריך לא נקבע</p>
                )}

                {/* bottom row */}
                {dateDisplay.kind === "countdown" && (
                  <span style={{ color: "rgba(245,240,232,0.3)", fontSize: "12px" }}>{dateDisplay.formatted}</span>
                )}
              </div>

              {/* Widget 2 – Venue (dynamic) */}
              <div
                className="col-span-2 flex flex-row items-center rounded-[22px] overflow-hidden relative cursor-pointer"
                style={{
                  boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
                  minHeight: "84px",
                  padding: "16px",
                  gap: "14px",
                  ...(venueSlot?.vendor
                    ? {
                        backgroundImage: "url(https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }
                    : { backgroundColor: "#1C1828" }),
                }}
                onClick={() => setOpenSlotId("venue")}
              >
                {venueSlot?.vendor && (
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to left, rgba(8,4,16,0.95) 0%, rgba(8,4,16,0.7) 60%, rgba(8,4,16,0.25) 100%)", pointerEvents: "none" }} />
                )}
                <div className="flex items-center justify-center rounded-full flex-shrink-0 relative" style={{ width: "40px", height: "40px", backgroundColor: venueCfg.bg }}>
                  <Building2 size={18} style={{ color: venueCfg.color }} />
                </div>
                <div className="flex flex-col flex-1 relative">
                  <span style={{ color: "rgba(245,240,232,0.4)", fontSize: "11px", fontWeight: "500" }}>מקום</span>
                  <span style={{ color: "#F5F0E8", fontSize: "16px", fontWeight: "600", letterSpacing: "-0.2px" }}>
                    {venueSlot?.vendor ?? "בוא נדבר על מקום"}
                  </span>
                </div>
                <span className="font-semibold flex-shrink-0 rounded-full relative" style={{ backgroundColor: `${venueCfg.color}22`, color: venueCfg.color, fontSize: "11px", padding: "4px 10px" }}>
                  {venueSlot?.status === "signed" ? "✓ חתום" : venueCfg.label}
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
                    onClick={() => setOpenSlotId(slot.id)}
                  />
                );
              })}


              {/* Expandable Favorites + Vendors Widgets */}
              <div className="col-span-2">
                {/* Two compact squares */}
                <div className="flex gap-[10px]">
                  {/* Favorites square */}
                  <button
                    onClick={() => setExpandedSection((p) => (p === "favorites" ? null : "favorites"))}
                    style={{
                      flex: 1,
                      aspectRatio: "1",
                      backgroundColor: "#1C1828",
                      boxShadow: expandedSection === "favorites" ? "0 0 0 2px rgba(232,168,124,0.5), 0 2px 12px rgba(0,0,0,0.45)" : "0 2px 12px rgba(0,0,0,0.45)",
                      borderRadius: "22px",
                      padding: "14px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      direction: "rtl",
                      transition: "box-shadow 0.2s",
                      textAlign: "right",
                      border: "none",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ color: "#7A7280", fontSize: "11px", fontWeight: 600 }}>שמורים</span>
                      <Heart
                        size={14}
                        fill={favorites.length > 0 ? "currentColor" : "none"}
                        style={{ color: expandedSection === "favorites" ? "#E8A87C" : favorites.length > 0 ? "#E8A87C" : "#7A7280" }}
                      />
                    </div>
                    <div>
                      <span style={{ color: "#F5F0E8", fontSize: "30px", fontWeight: "700", lineHeight: 1, display: "block" }}>
                        {favorites.length}
                      </span>
                      <span style={{ color: "#7A7280", fontSize: "12px" }}>ספקים שמורים</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <ChevronDown
                        size={14}
                        style={{
                          color: "#7A7280",
                          transform: expandedSection === "favorites" ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.25s",
                        }}
                      />
                    </div>
                  </button>

                  {/* Vendors square */}
                  <button
                    onClick={() => setExpandedSection((p) => (p === "vendors" ? null : "vendors"))}
                    style={{
                      flex: 1,
                      aspectRatio: "1",
                      backgroundColor: "#1C1828",
                      boxShadow: expandedSection === "vendors" ? "0 0 0 2px rgba(232,168,124,0.5), 0 2px 12px rgba(0,0,0,0.45)" : "0 2px 12px rgba(0,0,0,0.45)",
                      borderRadius: "22px",
                      padding: "14px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      direction: "rtl",
                      transition: "box-shadow 0.2s",
                      textAlign: "right",
                      border: "none",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ color: "#7A7280", fontSize: "11px", fontWeight: 600 }}>ספקים</span>
                      <Store size={14} style={{ color: expandedSection === "vendors" ? "#E8A87C" : "#7A7280" }} />
                    </div>
                    <div>
                      <span style={{ color: "#F5F0E8", fontSize: "30px", fontWeight: "700", lineHeight: 1, display: "block" }}>
                        {vendorsData.vendors.length}
                      </span>
                      <span style={{ color: "#7A7280", fontSize: "12px" }}>ספקים זמינים</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <ChevronDown
                        size={14}
                        style={{
                          color: "#7A7280",
                          transform: expandedSection === "vendors" ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.25s",
                        }}
                      />
                    </div>
                  </button>
                </div>

                {/* Expanded panels */}
                <AnimatePresence>
                  {expandedSection === "favorites" && (
                    <motion.div
                      key="favorites-panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ paddingTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {favorites.length === 0 ? (
                          <div style={{ padding: "20px 16px", backgroundColor: "#1A1428", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.11)", textAlign: "center" }}>
                            <p style={{ color: "#6B6478", fontSize: "13px" }}>לחצו על ❤️ בכרטיס ספק כדי לשמור אותו כאן</p>
                          </div>
                        ) : (
                          favorites.map((id) => (
                            <VendorCard
                              key={id}
                              vendorId={id}
                              onTap={() => setSelectedVendorId(id)}
                              onHeartClick={() => toggleFavorite(id)}
                              isFavorite={true}
                              
                            />
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {expandedSection === "vendors" && (
                    <motion.div
                      key="vendors-panel"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ paddingTop: "10px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        {(["venue", "catering", "photography"] as const).map((cat) => {
                          const catLabel = cat === "venue" ? "מקומות" : cat === "catering" ? "קייטרינג" : "צילום";
                          const catVendors = vendorsData.vendors.filter((v) => v.category === cat);
                          return (
                            <div key={cat}>
                              <p style={{ color: "#7A7280", fontSize: "11px", marginBottom: "8px" }}>{catLabel}</p>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {catVendors.map((v) => (
                                  <VendorCard
                                    key={v.id}
                                    vendorId={v.id}
                                    onTap={() => setSelectedVendorId(v.id)}
                                    onHeartClick={() => toggleFavorite(v.id)}
                                    isFavorite={favorites.includes(v.id)}
                                    
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Budget Widget */}
              <div
                className="col-span-2 rounded-[22px]"
                style={{ backgroundColor: "#1C1828", boxShadow: "0 2px 16px rgba(0,0,0,0.5)", padding: "16px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                  <span style={{ color: "rgba(245,240,232,0.4)", fontSize: "12px", fontWeight: "500" }}>תקציב</span>
                  {totalBudget > 0 && (
                    <span style={{ color: "rgba(245,240,232,0.35)", fontSize: "12px" }}>
                      ₪{totalBudget.toLocaleString()}
                    </span>
                  )}
                </div>
                {totalBudget > 0 ? (
                  <>
                    <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
                      {[
                        { label: "הוצאה",  value: totalSpent,  color: "#E8A87C", bg: "rgba(232,168,124,0.10)" },
                        { label: "נותר",   value: remaining,   color: "#8FBC8F", bg: "rgba(143,188,143,0.10)" },
                      ].map(({ label, value, color, bg }) => (
                        <div key={label} style={{ flex: 1, backgroundColor: bg, borderRadius: "14px", padding: "12px 14px" }}>
                          <p style={{ color: "rgba(245,240,232,0.4)", fontSize: "11px", marginBottom: "4px" }}>{label}</p>
                          <p style={{ color, fontSize: "20px", fontWeight: "700", letterSpacing: "-0.5px" }}>
                            ₪{value >= 1000 ? `${Math.round(value / 1000)}K` : value.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-full" style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.08)" }}>
                      <div className="rounded-full" style={{ width: `${pct}%`, height: "100%", backgroundColor: "#E8A87C", transition: "width 0.6s ease" }} />
                    </div>
                    <p style={{ color: "rgba(245,240,232,0.25)", fontSize: "11px", marginTop: "6px" }}>{pct}% נוצל</p>
                  </>
                ) : (
                  <p style={{ color: "rgba(245,240,232,0.3)", fontSize: "14px" }}>תקציב יוגדר בשיחה</p>
                )}
              </div>
            </div>
          </div>

          {/* Chat Bar */}
          <div
            className="sticky bottom-0"
            style={{
              padding: "10px 12px 28px",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              background: "rgba(16,12,28,0.85)",
            }}
          >
            <div
              className="flex flex-row items-center rounded-[18px] cursor-pointer"
              style={{
                height: "52px",
                backgroundColor: "#1C1828",
                boxShadow: "0 2px 16px rgba(0,0,0,0.5)",
                gap: "10px",
                paddingLeft: "8px",
                paddingRight: "8px",
              }}
              onClick={() => setChatOpen(true)}
            >
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div className="flex items-center justify-center rounded-full" style={{ width: "36px", height: "36px", backgroundColor: "#E8A87C" }}>
                  <Sparkles size={14} style={{ color: "#1A1428" }} />
                </div>
                <div style={{ position: "absolute", bottom: "0", right: "0", width: "9px", height: "9px", borderRadius: "50%", backgroundColor: "#8FBC8F", border: "1.5px solid #1C1828" }} />
              </div>
              <span className="flex-1 text-sm" style={{ color: "rgba(245,240,232,0.35)", letterSpacing: "-0.1px" }}>
                שאל את הסוכן...
              </span>
              <div className="flex items-center justify-center rounded-[12px] flex-shrink-0" style={{ width: "36px", height: "36px", backgroundColor: "#E8A87C" }}>
                <ArrowUp size={15} style={{ color: "#1A1428" }} />
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
  return (
    <div
      className="flex flex-col justify-between rounded-[22px] relative cursor-pointer"
      style={{
        backgroundColor: "#1C1828",
        boxShadow: "0 2px 12px rgba(0,0,0,0.45)",
        padding: "14px",
        aspectRatio: "1",
        opacity: dimmed ? 0.45 : 1,
      }}
      onClick={onClick}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="flex items-center justify-center rounded-full" style={{ width: "36px", height: "36px", backgroundColor: iconBg }}>
          {icon}
        </div>
        <span style={{ backgroundColor: `${badgeColor}1E`, color: badgeColor, fontSize: "10px", fontWeight: "600", padding: "3px 8px", borderRadius: "20px" }}>
          {badgeLabel}
        </span>
      </div>
      <div className="flex flex-col">
        <span style={{ color: "#F5F0E8", fontSize: "14px", fontWeight: "600", letterSpacing: "-0.2px" }}>{name}</span>
        <span style={{ color: "rgba(245,240,232,0.35)", fontSize: "11px", marginTop: "2px" }}>{sub}</span>
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
