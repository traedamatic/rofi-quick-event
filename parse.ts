import * as chrono from "chrono-node";

export interface ParsedEvent {
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
}

export function parseEventInput(
  input: string,
  referenceDate?: Date
): ParsedEvent {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Empty input");
  }

  const ref = referenceDate ?? new Date();
  const results = chrono.parse(trimmed, ref, { forwardDate: true });

  // No date found — treat as all-day event today
  if (results.length === 0) {
    const todayStart = new Date(ref);
    todayStart.setHours(0, 0, 0, 0);
    return {
      title: trimmed,
      start: todayStart,
      end: todayStart,
      allDay: true,
    };
  }

  const result = results[0];

  // Extract title by removing the matched date text from input
  const title = extractTitle(trimmed, result.text);

  const hasTime = knownTimeComponents(result.start);
  const start = result.start.date();

  let end: Date;
  let allDay: boolean;

  if (result.end) {
    // Explicit end date/time provided
    end = result.end.date();
    const endHasTime = knownTimeComponents(result.end);
    allDay = !hasTime && !endHasTime;
    if (allDay) {
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
    }
  } else if (hasTime) {
    // Has time but no end — default duration
    const durationMinutes = parseInt(
      process.env.DEFAULT_DURATION_MINUTES || "60",
      10
    );
    end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    allDay = false;
  } else {
    // Date only, no time — all-day event
    allDay = true;
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
  }

  return { title, start, end, allDay };
}

function knownTimeComponents(
  components: chrono.ParsedComponents
): boolean {
  return (
    components.isCertain("hour") || components.isCertain("minute")
  );
}

function extractTitle(input: string, dateText: string): string {
  // Remove the date portion chrono matched
  let title = input.replace(dateText, "");

  // Clean up common prepositions left hanging
  title = title
    .replace(/\b(at|on|from|by|in|to|for)\s*$/i, "")
    .replace(/^\s*(at|on|from|by|in|to|for)\b\s*/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // If title ended up empty (input was only a date), use original
  if (!title) {
    title = input.trim();
  }

  return title;
}
