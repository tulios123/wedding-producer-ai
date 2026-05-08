import { NextRequest, NextResponse } from "next/server";
import vendors from "@/data/vendors.json";
import type { Profile, Slot, SlotId, SlotStatus, UpdateTag } from "@/types";

const VALID_SLOT_IDS: SlotId[] = ["venue", "photography", "catering"];
const VALID_STATUSES: SlotStatus[] = ["idle", "collecting", "negotiating", "hold", "signed"];

const slimVendors = vendors.vendors.map((v) => ({
  id: v.id,
  name: v.name,
  category: v.category,
  style: v.style,
  region: v.region,
  priceRange: v.priceRange,
}));

const STATUS_LABELS: Record<SlotStatus, string> = {
  idle: "לא טופל",
  collecting: "אוספים אופציות",
  negotiating: 'במו״מ',
  hold: "Hold",
  signed: "חתום",
};

interface VendorContext {
  slotLabel: string;
  vendorName?: string;
}

function buildVendorContextBlock(ctx: VendorContext): string {
  const fullVendor = ctx.vendorName
    ? vendors.vendors.find((v) => v.name === ctx.vendorName) ?? null
    : null;

  let block = `\n\n## הקשר הנוכחי — המשתמש שואל על ספק ספציפי\n`;
  block += `קטגוריה: ${ctx.slotLabel}\n`;
  block += `שם הספק: ${ctx.vendorName ?? "טרם נבחר"}\n`;

  if (fullVendor) {
    block += `\n### פרטי הספק (השתמש בנתונים האלה בלבד — אל תמציא):\n`;
    block += `תיאור: ${fullVendor.description}\n`;
    block += `טווח מחיר: ₪${fullVendor.priceRange.min.toLocaleString()} – ₪${fullVendor.priceRange.max.toLocaleString()}\n`;
    block += `נקודות עיקריות: ${fullVendor.bullets.join(" | ")}\n`;
    block += `אזור: ${fullVendor.region} | סגנון: ${fullVendor.style.join(", ")}\n`;

    const d = fullVendor.details;
    if (d.capacity) block += `קיבולת: ${d.capacity.min}–${d.capacity.max} אורחים\n`;
    if (d.type) block += `סוג: ${d.type}\n`;
    if (d.kashrut) block += `כשרות: ${d.kashrut}\n`;
    if (d.parking !== undefined) block += `חניה: ${d.parking ? "כן" : "לא"}\n`;
    if (d.pricePerPerson) block += `מחיר לאורח: ₪${d.pricePerPerson.min}–₪${d.pricePerPerson.max}\n`;
    if (d.cuisineStyle) block += `סגנון בישול: ${d.cuisineStyle}\n`;
    if (d.dietary?.length) block += `אפשרויות תזונה: ${d.dietary.join(", ")}\n`;
    if (d.style) block += `סגנון צילום: ${d.style}\n`;
    if (d.package) block += `חבילה: ${d.package}\n`;
    if (d.deliverables?.length) block += `פריטי משלוח: ${d.deliverables.join(", ")}\n`;
    if (d.experience) block += `ניסיון: ${d.experience} שנים\n`;
  }

  block += `\n**חשוב:** כל השאלות בשיחה זו מתייחסות ל${ctx.vendorName ?? "ספק זה"}. ענה אך ורק על בסיס הנתונים שלמעלה. אל תדבר על ספקים אחרים ואל תמציא פרטים.`;
  return block;
}

function buildSystemPrompt(profile: Profile, slots: Slot[], vendorContext?: VendorContext | null): string {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const couple =
    profile.partner1 && profile.partner2
      ? `${profile.partner1} ו-${profile.partner2}`
      : "הזוג";

  const date = profile.weddingDate ?? "תאריך לא נקבע עדיין";
  const guests = profile.guestCount ? `${profile.guestCount} אורחים` : "מספר אורחים לא נקבע";
  const budget = profile.budget
    ? `${profile.budget.toLocaleString()} ש״ח`
    : "תקציב לא נקבע";
  const style = profile.style ?? "סגנון לא הוגדר";

  const slotsBlock = slots
    .map((s) => `- ${s.label}: ${STATUS_LABELS[s.status]}${s.vendor ? ` (${s.vendor})` : ""}`)
    .join("\n");

  const contextBlock = vendorContext ? buildVendorContextBlock(vendorContext) : "";

  return `אתה עוזר ניווט לאפליקציית תכנון חתונה. ענה קצר ומעשי בעברית בלבד. עוזר ל${couple}.

## מצב נוכחי
תאריך: ${date} | אורחים: ${guests} | תקציב: ${budget} | סגנון: ${style}
ספקים: ${slotsBlock}

## עדכון נתונים — הוסף בסוף כל תגובה רלוונטית (שורה נפרדת):
[UPDATE:{"type":"profile","field":"FIELD","value":"VALUE"}]
שדות: partner1, partner2, weddingDate (YYYY-MM-DD), guestCount (מספר), budget (מספר ש"ח), style, location, ceremonyType (rabbinate/reform/civil/destination)

[UPDATE:{"type":"slot","slot":"SLOT","status":"STATUS","vendor":"שם"}]
SLOT: venue/photography/catering | STATUS: idle/collecting/negotiating/hold/signed
negotiating → הוסף: "estimate":{"min":X,"max":Y} | signed → הוסף: "amount":X

תאריך חתונה — כששואל הוסף: [DATE_PICKER:single] או [DATE_PICKER:range]

מעבר לדשבורד אחרי שיש שמות+תאריך+אורחים+תקציב:
[UPDATE:{"type":"navigation","action":"go_to_dashboard"}]

## הצגת ספקים
כשמציג ספקים, הוסף: [CARDS:["id1","id2"]]
ספקים זמינים: ${JSON.stringify(slimVendors)}

## כללים
- קצר: 1-2 משפטים + תגים
- מקסימום שאלה אחת בתגובה
- ענה על שאלות ספקים לפי הנתונים שניתנו${contextBlock}`;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  vendorNote?: string;
}

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      profile = {},
      slots = [],
      vendorContext = null,
    }: { messages: Message[]; profile: Profile; slots: Slot[]; vendorContext?: VendorContext | null } = await req.json();

    if (!Array.isArray(messages)) throw new Error("messages must be an array");
    const apiMessages = messages.map(({ role, content, vendorNote }) => ({
      role,
      content: vendorNote ? `[שאלה על ${vendorNote}] ${content}` : content,
    }));

    const reqBody = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      system: buildSystemPrompt(profile, slots, vendorContext),
      messages: apiMessages,
    });

    let response: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 1000 * attempt));
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
        },
        body: reqBody,
      });
      if (response.status !== 529) break;
    }

    if (!response!.ok) {
      throw new Error(`Anthropic API error: ${response!.status}`);
    }

    const data = await response!.json();
    const raw: string = data.content?.[0]?.text ?? "";

    console.log("[chat] raw response:", raw);

    const updateRegex = /\[UPDATE:\s*(\{(?:[^{}]|\{[^{}]*\})*\})\s*\]/g;
    const allMatches = [...raw.matchAll(updateRegex)];
    console.log("[chat] update tags found:", allMatches.length, allMatches.map(m => m[0]));

    const updates: UpdateTag[] = [];

    for (const match of allMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.type === "profile") {
          if (parsed.field && parsed.value !== undefined) {
            updates.push({ type: "profile", field: parsed.field as keyof Profile, value: parsed.value });
          } else {
            console.warn("[chat] Invalid profile update:", parsed);
          }
        } else if (parsed.type === "slot") {
          if (VALID_SLOT_IDS.includes(parsed.slot) && VALID_STATUSES.includes(parsed.status)) {
            updates.push({
              type: "slot",
              slot: parsed.slot as SlotId,
              status: parsed.status as SlotStatus,
              vendor: parsed.vendor,
              estimate: parsed.estimate,
              amount: parsed.amount,
            });
          } else {
            console.warn("[chat] Invalid slot update:", parsed);
          }
        } else if (parsed.type === "navigation") {
          if (parsed.action === "go_to_dashboard") {
            updates.push({ type: "navigation", action: "go_to_dashboard" });
          } else {
            console.warn("[chat] Invalid navigation action:", parsed);
          }
        } else {
          console.warn("[chat] Unknown update type:", parsed);
        }
      } catch (e) {
        console.warn("[chat] Failed to parse UPDATE tag:", match[1], e);
      }
    }

    console.log("[chat] final updates array:", JSON.stringify(updates, null, 2));

    const cardsRegex = /\[CARDS:(\[(?:"[^"]*"(?:,\s*"[^"]*")*)\])\]/g;
    const cardsMatches = [...raw.matchAll(cardsRegex)];
    const cards: string[] = [];
    for (const match of cardsMatches) {
      try {
        const parsed = JSON.parse(match[1]);
        if (Array.isArray(parsed)) {
          cards.push(...parsed.filter((id: unknown): id is string => typeof id === "string"));
        }
      } catch {
        console.warn("[chat] Failed to parse CARDS tag:", match[1]);
      }
    }

    const datePickerMatch = raw.match(/\[DATE_PICKER:(single|range)\]/);
    const datePicker = datePickerMatch ? (datePickerMatch[1] as 'single' | 'range') : undefined;

    const cleanReply = raw
      .replace(/\s*\[UPDATE:[^\]]*\]/g, "")
      .replace(/\s*\[CARDS:\[.*?\]\]/g, "")
      .replace(/\s*\[DATE_PICKER:[^\]]*\]/g, "")
      .trim();

    return NextResponse.json({ reply: cleanReply, updates, cards, datePicker });
  } catch (err) {
    console.error("[chat] route error:", err);
    return NextResponse.json(
      { reply: "אירעה שגיאה, נסה שוב", updates: [] },
      { status: 500 }
    );
  }
}
