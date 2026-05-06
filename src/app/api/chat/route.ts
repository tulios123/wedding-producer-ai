import { NextRequest, NextResponse } from "next/server";
import vendors from "@/data/vendors.json";
import type { Profile, Slot, SlotId, SlotStatus, UpdateTag } from "@/types";

const VALID_SLOT_IDS: SlotId[] = ["venue", "photography", "catering"];
const VALID_STATUSES: SlotStatus[] = ["idle", "collecting", "negotiating", "hold", "signed"];

const slimVendors = vendors.map((v) => ({
  id: v.id,
  name: v.name,
  category: v.category,
  style: v.style,
  location: v.location,
  priceRange: v.priceRange,
  capacity: v.capacity,
}));

const STATUS_LABELS: Record<SlotStatus, string> = {
  idle: "לא טופל",
  collecting: "אוספים אופציות",
  negotiating: 'במו״מ',
  hold: "Hold",
  signed: "חתום",
};

function buildSystemPrompt(profile: Profile, slots: Slot[]): string {
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

  return `אתה מפיק חתונות מנוסה עם 15 שנות ניסיון. שמך הוא 'המפיק'. אתה עוזר ל${couple} לתכנן את חתונתם.

## כלל עדכון מידע — חובה לקיים בכל תגובה רלוונטית

בכל פעם שאתה לומד מידע חדש על החתונה (שמות, תאריך, תקציב, מספר אורחים, סגנון, או שינוי בסטטוס ספק), חובה עליך להוסיף בסוף תגובתך תגי UPDATE בפורמט הבא — **בשורה נפרדת, אחרי כל הטקסט**:

לעדכון פרטי החתונה:
[UPDATE:{"type":"profile","field":"FIELD","value":"VALUE"}]

שדות אפשריים: partner1 (שם בן/בת הזוג הראשון), partner2 (שם בן/בת הזוג השני), weddingDate (YYYY-MM-DD), guestCount (מספר שלם), budget (מספר שלם בש"ח), style (מחרוזת), location (מחרוזת), ceremonyType (rabbinate/reform/civil/destination)

חשוב לגבי weddingDate: אם המשתמש ציין חודש בלבד (למשל "ספטמבר"), קבע את התאריך הראשון של אותו חודש בשנה הקרובה שעדיין לא עברה. אם החודש כבר עבר השנה — השתמש בשנה הבאה. לעולם אל תכתוב תאריך שכבר עבר.

לעדכון סטטוס ספק:
[UPDATE:{"type":"slot","slot":"SLOT_ID","status":"STATUS","vendor":"שם"}]

SLOT_ID: venue, photography, catering
STATUS: idle, collecting, negotiating, hold, signed

דוגמאות:
משתמש אמר "שמי נועה ואני מתארסת עם אור" →
[UPDATE:{"type":"profile","field":"partner1","value":"נועה"}]
[UPDATE:{"type":"profile","field":"partner2","value":"אור"}]

משתמש אמר "החתונה ב-15 ביוני 2025, 120 איש, תקציב 100000" →
[UPDATE:{"type":"profile","field":"weddingDate","value":"2025-06-15"}]
[UPDATE:{"type":"profile","field":"guestCount","value":120}]
[UPDATE:{"type":"profile","field":"budget","value":100000}]

משתמש אמר "נסגרנו על יובל כהן לצילום" →
[UPDATE:{"type":"slot","slot":"photography","status":"signed","vendor":"יובל כהן"}]

חשוב: אל תדלג על תגי UPDATE כשיש מידע חדש. זה קריטי לתפקוד המערכת.

---

## כללי שיחה

- תמיד ענה בעברית בלבד.
- היה חם אבל ענייני. קצר וממוקד — לא יותר מ-3 משפטים לפני תגי ה-UPDATE.
- אתה יוזם, לא רק מגיב. הנחה את הזוג ושאל את השאלה הבאה.
- כשאתה ממליץ על ספק, ציין את שמו המדויק מהרשימה.

## מצב נוכחי

פרטי החתונה:
- תאריך: ${date}
- אורחים: ${guests}
- תקציב: ${budget}
- סגנון: ${style}

סטטוס ספקים:
${slotsBlock}

## ספקים זמינים
${JSON.stringify(slimVendors)}`;
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
    }: { messages: Message[]; profile: Profile; slots: Slot[] } = await req.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system: buildSystemPrompt(profile, slots),
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
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
        } else {
          console.warn("[chat] Unknown update type:", parsed);
        }
      } catch (e) {
        console.warn("[chat] Failed to parse UPDATE tag:", match[1], e);
      }
    }

    console.log("[chat] final updates array:", JSON.stringify(updates, null, 2));

    const cleanReply = raw.replace(/\s*\[UPDATE:[^\]]*\]/g, "").trim();

    return NextResponse.json({ reply: cleanReply, updates });
  } catch {
    return NextResponse.json(
      { reply: "אירעה שגיאה, נסה שוב", updates: [] },
      { status: 500 }
    );
  }
}
