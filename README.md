# rofi-quick-event

Minimal calendar event creator for i3. Type natural language, get a Fastmail calendar event.

`$mod+y` → rofi input → parse → CalDAV → done.

## How it works

1. i3 keybind opens a rofi prompt (synthwave themed)
2. You type something like `Doctors appointment at 10am tomorrow`
3. [chrono-node](https://github.com/wanasit/chrono) parses the date/time
4. Event is created via CalDAV PUT to Fastmail
5. `notify-send` confirms success

## Examples

```
Doctors appointment at 10am tomorrow
Lunch with Sarah friday noon
Team standup 9:30am to 9:45am monday
Vacation june 1 to june 5
Dentist next wednesday 2pm
Birthday party saturday 7pm to 11pm
Meeting in 2 hours
Buy groceries
```

- No time given → all-day event
- No date given → today
- Time range → respects start and end
- Relative dates → "tomorrow", "next friday", "in 2 hours"

## Setup

### Prerequisites

- [Bun](https://bun.sh)
- [rofi](https://github.com/davatorium/rofi)
- `notify-send` (libnotify)

### Install

```bash
git clone https://github.com/traedamatic/rofi-quick-event.git
cd rofi-quick-event
bun install
cp .env.example .env
```

### Configure `.env`

```
FASTMAIL_EMAIL=you@fastmail.com
FASTMAIL_APP_PASSWORD=your-app-password
CALENDAR_ID=your-calendar-uuid
DEFAULT_DURATION_MINUTES=60
```

**Fastmail app password:** Settings → Privacy & Security → App Passwords → create one for CalDAV.

**Calendar ID:** Settings → Calendars → Export → grab the UUID from the CalDAV URL.

### i3 keybind

onfigure if `~/.config/i3/config` if wanted:

```
bindsym $mod+y exec --no-startup-id /path/to/rofi-quick-event/run.sh
```

Reload i3: `$mod+Shift+r`

## Tests

```bash
bun test
```

14 test cases covering time parsing, date ranges, all-day events, relative dates, and edge cases.

## Stack

- **rofi** — input prompt (synthwave themed via `quick-event.rasi`)
- **chrono-node** — natural language date parsing
- **Bun** — runtime + fetch for CalDAV
- **Fastmail CalDAV** — event storage
- **notify-send** — feedback
