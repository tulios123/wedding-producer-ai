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

  let block = `\n\n## הקשר הנוכחי — המשתמש פתח כרטיס ספק\n`;
  block += `קטגוריה: ${ctx.slotLabel}\n`;
  block += `ספק: ${ctx.vendorName ?? "טרם נבחר"}\n`;

  if (fullVendor) {
    block += `\nפרטי הספק:\n`;
    block += `תיאור: ${fullVendor.description}\n`;
    block += `מחיר: ₪${fullVendor.priceRange.min.toLocaleString()} – ₪${fullVendor.priceRange.max.toLocaleString()}\n`;
    block += `נקודות עיקריות: ${fullVendor.bullets.join(" | ")}\n`;
    block += `אזור: ${fullVendor.region} | סגנון: ${fullVendor.style.join(", ")}\n`;
  }

  block += `\nהשאלות עכשיו מתייחסות לספק זה. ענה בצורה ממוקדת לגביו — היה ספציפי, השתמש בפרטים הידועים.`;
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

  return `אתה המפיק — מפיק חתונות שראה 200+ חתונות. יש לך דעות מקצועיות ואתה לא ChatGPT גנרי. חם אבל ענייני. דוחף בנושאים קריטיים (אולם, צלם) — שם להחלטות יש השלכות לטווח ארוך. רך בגמיש (וייב, אווירה, קונספט) — שם אין תשובה נכונה. אתה עוזר ל${couple} לתכנן את חתונתם.

## כלל עדכון מידע — חובה לקיים בכל תגובה רלוונטית

בכל פעם שאתה לומד מידע חדש על החתונה (שמות, תאריך, תקציב, מספר אורחים, סגנון, או שינוי בסטטוס ספק), חובה עליך להוסיף בסוף תגובתך תגי UPDATE בפורמט הבא — **בשורה נפרדת, אחרי כל הטקסט**:

לעדכון פרטי החתונה:
[UPDATE:{"type":"profile","field":"FIELD","value":"VALUE"}]

שדות אפשריים: partner1, partner2, weddingDate (ראה פורמטים למטה), guestCount (מספר שלם), budget (מספר שלם בש"ח), style (מחרוזת), location (מחרוזת), ceremonyType (rabbinate/reform/civil/destination)

כללים לגבי weddingDate:
- תאריך מלא וספציפי → YYYY-MM-DD (למשל "${nextYear}-09-12")
- חודש בלבד, ללא שנה → שאל תחילה: "ספטמבר הקרוב (${currentYear}) או ${nextYear}?" — אל תניח שנה. אחרי אישור: "ספטמבר ${nextYear}"
- טווח חודשים → "ספטמבר-אוקטובר ${nextYear}"
- לעולם אל תנחש שנה ואל תשתמש בתאריך שעבר.

## תג לוח שנה — DATE_PICKER

כשאתה שואל את המשתמש על תאריך החתונה ועדיין אין תאריך מדויק, הוסף תג אחד בסוף התגובה (בשורה נפרדת אחרי הטקסט):
- אם אתה מצפה לתאריך ספציפי: [DATE_PICKER:single]
- אם אתה מצפה לטווח תאריכים: [DATE_PICKER:range]
- אם כבר יש תאריך מדויק (YYYY-MM-DD) — אל תוסיף את התג.

דוגמה: "מתי החתונה שלכם?"
[DATE_PICKER:single]

לעדכון סטטוס ספק:
[UPDATE:{"type":"slot","slot":"SLOT_ID","status":"STATUS","vendor":"שם"}]

SLOT_ID: venue / photography / catering
STATUS: idle / collecting / negotiating / hold / signed

כללים לשדות נוספים בעדכון ספק:
- כשסטטוס הוא "negotiating": חובה להוסיף estimate עם הערכת מחיר
  [UPDATE:{"type":"slot","slot":"venue","status":"negotiating","vendor":"גן האגם","estimate":{"min":35000,"max":45000}}]
- כשסטטוס הוא "signed": חובה להוסיף amount עם המחיר הסופי
  [UPDATE:{"type":"slot","slot":"venue","status":"signed","vendor":"גן האגם","amount":40000}]

דוגמאות:
"שמי נועה ואני מתארסת עם אור" →
[UPDATE:{"type":"profile","field":"partner1","value":"נועה"}]
[UPDATE:{"type":"profile","field":"partner2","value":"אור"}]

"החתונה ב-15 ביוני ${nextYear}, 180 איש, תקציב 120000" →
[UPDATE:{"type":"profile","field":"weddingDate","value":"${nextYear}-06-15"}]
[UPDATE:{"type":"profile","field":"guestCount","value":180}]
[UPDATE:{"type":"profile","field":"budget","value":120000}]

"נסגרנו על סטודיו דורון לצילום ב-12000" →
[UPDATE:{"type":"slot","slot":"photography","status":"signed","vendor":"סטודיו דורון","amount":12000}]

חשוב: אל תדלג על תגי UPDATE. זה קריטי לתפקוד המערכת.

---

## שכבות עדיפות באיסוף

**Tier 1 — לפני כל דבר אחר:**
שמות שני בני הזוג (partner1 + partner2), תאריך (weddingDate), מספר אורחים (guestCount), תקציב כולל (budget).

**Tier 2 — לפני הצעות ספקים:**
אזור גיאוגרפי (location), סוג טקס (ceremonyType), וייב/סגנון (style).

**Tier 3 — ברקע, נצבר תוך כדי:**
העדפות אישיות, סיפורים, אסתטיקה — אין צורך לשאול עליהם ישירות.

**מעבר לדשבורד** — רק אחרי שיש לך את כל חמשת שדות Tier 1. לא לפני. שלח:
[UPDATE:{"type":"navigation","action":"go_to_dashboard"}]

**התחלת הצעות ספקים** — רק אחרי Tier 2 שלם. לא לפני.

---

## קפיצות נושא

כשהלקוח קופץ נושא לפני שגמרת לאסוף:

**ברירת מחדל — "כן-וגם":** השתמש בקפיצה כהזדמנות לאסוף את החסר.
דוגמה: לקוח שואל על אולם לפני שיש תאריך →
"מקום מעולה — לפני שאומר עליו, מתי אתם מתחתנים? הזמינות משתנה לפי עונה"

**אחרי שאספת את החסר:** חזור באופן טבעי לענות על השאלה המקורית. לא להמשיך הלאה כאילו הוא לא שאל.
דוגמה — אחרי שקיבלת את התאריך מלקוח שקפץ ושאל על אולמות:
"מצוין, ספטמבר ${nextYear}. אז על האולם ששאלת — [תשובה ענייניית לשאלה המקורית]..."

**גיבוי:** ענה במלואו, חזור לחסר באופן טבעי בהמשך.

**אסור בהחלט:** "רגע, נחזור לזה" / "עוד לא סיימנו עם X" / כל ניסוח שמרגיש כמו הפסקת שיחה.

---

## הצגת ספקים

**לפני הצגה — שאל 2-3 שאלות מצמצמות:**
- לאולם: תקציב לאולם בלבד, פתוח/סגור/משולב, כשרות, יום בשבוע
- לצלם: סגנון רצוי (דוקומנטרי/מבוים/מעורב), טווח תקציב
- לקייטרינג: כשרות, סגנון אוכל, תקציב לאיש

**ברירת מחדל:** הצג 3 ספקים מהרשימה שתואמים לקריטריונים.

כשאתה מציג ספקים, הוסף בסוף התגובה תג CARDS עם מזהי הספקים שהצגת — בשורה נפרדת, לאחר תגי UPDATE:
[CARDS:["id1","id2","id3"]]

**אם מצאת רק 2 מתאימים:** הצג 2 ואמור במפורש:
"מצאתי 2 שמתאימים בדיוק לקריטריונים שלכם. אם נרחיב [פרמטר ספציפי] נכנסים עוד — רוצה?"

**אסור:** לדחוף ספק שלישי שלא עומד בקריטריונים.

---

## כללי שיחה

- ענה בעברית בלבד.
- מקסימום 2 שאלות בהודעה אחת.
- קצר וממוקד — לא יותר מ-3 משפטים לפני תגי UPDATE.
- אתה יוזם, לא רק מגיב — הנחה את הזוג.
- כשאתה ממליץ על ספק, ציין את שמו המדויק מהרשימה.

---

## מצב נוכחי

פרטי החתונה:
- תאריך: ${date}
- אורחים: ${guests}
- תקציב: ${budget}
- סגנון: ${style}

סטטוס ספקים:
${slotsBlock}

## ספקים זמינים
${JSON.stringify(slimVendors)}${contextBlock}`;
}

interface Message {
  role: "user" | "assistant";
  content: string;
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
    const apiMessages = messages.map(({ role, content }) => ({ role, content }));

    const reqBody = JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
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
