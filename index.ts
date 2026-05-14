import { parseEventInput, type ParsedEvent } from "./parse";
import { $ } from "bun";

const input = process.argv[2];
if (!input?.trim()) {
  process.exit(0);
}

const FASTMAIL_EMAIL = process.env.FASTMAIL_EMAIL;
const FASTMAIL_APP_PASSWORD = process.env.FASTMAIL_APP_PASSWORD;
const CALENDAR_ID = process.env.CALENDAR_ID || "Default";

if (!FASTMAIL_EMAIL || !FASTMAIL_APP_PASSWORD) {
  await notify("Quick Event: missing FASTMAIL_EMAIL or FASTMAIL_APP_PASSWORD in .env");
  process.exit(1);
}

try {
  const event = parseEventInput(input);
  const uid = crypto.randomUUID();
  const ics = buildICS(event, uid);

  const url = `https://caldav.fastmail.com/dav/calendars/user/${FASTMAIL_EMAIL}/${CALENDAR_ID}/${uid}.ics`;
  const auth = btoa(`${FASTMAIL_EMAIL}:${FASTMAIL_APP_PASSWORD}`);

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      Authorization: `Basic ${auth}`,
      "If-None-Match": "*",
    },
    body: ics,
  });

  if (response.ok || response.status === 201) {
    const timeStr = event.allDay
      ? "all day"
      : event.start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const dateStr = event.start.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    await notify(`Event created: ${event.title}\n${dateStr}, ${timeStr}`);
  } else {
    const body = await response.text();
    await notify(`Failed (${response.status}): ${body.slice(0, 200)}`);
    process.exit(1);
  }
} catch (err: any) {
  await notify(`Error: ${err.message}`);
  process.exit(1);
}

function buildICS(event: ParsedEvent, uid: string): string {
  const now = formatDateUTC(new Date());
  const dtstart = event.allDay
    ? `DTSTART;VALUE=DATE:${formatDateOnly(event.start)}`
    : `DTSTART:${formatDateUTC(event.start)}`;
  const dtend = event.allDay
    ? `DTEND;VALUE=DATE:${formatDateOnly(new Date(event.end.getTime() + 86400000))}`
    : `DTEND:${formatDateUTC(event.end)}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//quick-event//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    dtstart,
    dtend,
    `SUMMARY:${escapeICS(event.title)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function formatDateUTC(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function formatDateOnly(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function escapeICS(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

async function notify(message: string) {
  await $`notify-send "Quick Event" ${message}`.quiet();
}
