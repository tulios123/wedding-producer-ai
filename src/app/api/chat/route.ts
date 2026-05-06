import { NextRequest, NextResponse } from "next/server";
import vendors from "@/data/vendors.json";

const slimVendors = vendors.map((v) => ({
  id: v.id,
  name: v.name,
  category: v.category,
  style: v.style,
  location: v.location,
  priceRange: v.priceRange,
  capacity: v.capacity,
}));

const SYSTEM_PROMPT = `אתה מפיק חתונות מנוסה עם 15 שנות ניסיון. שמך הוא 'המפיק'. אתה עוזר לנועה ואור לתכנן את חתונתם ב-12.09.2025. מספר אורחים משוער: 150. תקציב: 120,000 ש״ח. סגנון: מודרני-בוהו.

הכלל הראשון: אתה יוזם, לא רק מגיב. אתה מפיק שיש לו דעות ומוביל את התהליך.
הכלל השני: תמיד ענה בעברית בלבד.
הכלל השלישי: היה חם אבל ענייני. קצר וממוקד - לא יותר מ-3-4 משפטים בכל תגובה.
הכלל הרביעי: כשאתה ממליץ על ספק, ציין את שמו המדויק מהרשימה.

רשימת הספקים הזמינים:
${JSON.stringify(slimVendors)}

סטטוס נוכחי של הסלוטים:
- מקום: חתום (גן האגם הקסום)
- צילום סטילס: במו״מ (דנה לוי)
- מוזיקה: אוספים אופציות
- קייטרינג: Hold (בית מטבח)
- שמלת כלה: לא טופל

כשמשהו משתנה בתכנון החתונה - סטטוס ספק, בחירה חדשה, סגירת עסקה - הוסף בסוף התשובה שלך תג עדכון בפורמט הבא (בשורה חדשה נפרדת, בלי טקסט אחר לאחריו):
[UPDATE:{"slot":"SLOT_ID","status":"STATUS","vendor":"שם הספק"}]

SLOT_ID אפשריים: venue, photography, video, music, dress, suit, makeup, invitations, decor, rabbi, catering, rings
STATUS אפשריים: idle, collecting, negotiating, hold, signed
vendor הוא אופציונלי - רק אם יש ספק ספציפי.

דוגמה: אם המשתמש אומר 'נסגרנו על יובל כהן לצילום', הוסף:
[UPDATE:{"slot":"photography","status":"signed","vendor":"יובל כהן"}]

אל תוסיף את התג אם לא היה שינוי ממשי בסטטוס.`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await req.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const raw: string = data.content?.[0]?.text ?? "";

    const updateMatch = raw.match(/\[UPDATE:(\{[^}]*\})\]/);
    const update = updateMatch ? JSON.parse(updateMatch[1]) : null;
    const cleanReply = raw.replace(/\s*\[UPDATE:[^\]]*\]/g, "").trim();

    return NextResponse.json({ reply: cleanReply, update });
  } catch {
    return NextResponse.json(
      { reply: "אירעה שגיאה, נסה שוב" },
      { status: 500 }
    );
  }
}
