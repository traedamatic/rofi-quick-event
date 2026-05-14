#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

input=$(echo "" | rofi -dmenu \
    -p "Event" \
    -theme "$SCRIPT_DIR/quick-event.rasi" \
    -no-fixed-num-lines \
    -no-show-match \
    -filter "" \
    2>/dev/null)

if [ -n "$input" ]; then
    cd "$SCRIPT_DIR"
    bun run index.ts "$input"
fi
