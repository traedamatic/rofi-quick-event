import { describe, test, expect } from "bun:test";
import { parseEventInput } from "./parse";

// Pin reference date: Wednesday, May 14, 2026 at 12:00 noon
const REF = new Date(2026, 4, 14, 12, 0, 0);

function d(month: number, day: number, hour = 0, minute = 0): Date {
  return new Date(2026, month - 1, day, hour, minute, 0);
}

describe("parseEventInput", () => {
  test("time + relative day: 'Doctors appointment at 10am tomorrow'", () => {
    const result = parseEventInput("Doctors appointment at 10am tomorrow", REF);
    expect(result.title).toBe("Doctors appointment");
    expect(result.start).toEqual(d(5, 15, 10, 0));
    expect(result.end).toEqual(d(5, 15, 11, 0));
    expect(result.allDay).toBe(false);
  });

  test("named day + noon: 'Lunch with Sarah friday noon'", () => {
    const result = parseEventInput("Lunch with Sarah friday noon", REF);
    expect(result.title).toBe("Lunch with Sarah");
    expect(result.start).toEqual(d(5, 15, 12, 0));
    expect(result.end).toEqual(d(5, 15, 13, 0));
    expect(result.allDay).toBe(false);
  });

  test("time range: 'Team standup 9:30am to 9:45am monday'", () => {
    const result = parseEventInput("Team standup 9:30am to 9:45am monday", REF);
    expect(result.title).toBe("Team standup");
    expect(result.start.getHours()).toBe(9);
    expect(result.start.getMinutes()).toBe(30);
    expect(result.end.getHours()).toBe(9);
    expect(result.end.getMinutes()).toBe(45);
    expect(result.allDay).toBe(false);
  });

  test("multi-day all-day: 'Vacation june 1 to june 5'", () => {
    const result = parseEventInput("Vacation june 1 to june 5", REF);
    expect(result.title).toBe("Vacation");
    expect(result.start).toEqual(d(6, 1));
    expect(result.end).toEqual(d(6, 5));
    expect(result.allDay).toBe(true);
  });

  test("next + named day: 'Dentist next wednesday 2pm'", () => {
    const result = parseEventInput("Dentist next wednesday 2pm", REF);
    expect(result.title).toBe("Dentist");
    expect(result.start.getHours()).toBe(14);
    expect(result.start.getMinutes()).toBe(0);
    expect(result.allDay).toBe(false);
  });

  test("evening range: 'Birthday party saturday 7pm to 11pm'", () => {
    const result = parseEventInput("Birthday party saturday 7pm to 11pm", REF);
    expect(result.title).toBe("Birthday party");
    expect(result.start.getHours()).toBe(19);
    expect(result.end.getHours()).toBe(23);
    expect(result.allDay).toBe(false);
  });

  test("time only, no date: 'Conference call 3:30pm'", () => {
    const result = parseEventInput("Conference call 3:30pm", REF);
    expect(result.title).toBe("Conference call");
    expect(result.start.getHours()).toBe(15);
    expect(result.start.getMinutes()).toBe(30);
    expect(result.allDay).toBe(false);
  });

  test("relative day, no time — all day: 'Haircut tomorrow'", () => {
    const result = parseEventInput("Haircut tomorrow", REF);
    expect(result.title).toBe("Haircut");
    expect(result.start.getDate()).toBe(15);
    expect(result.allDay).toBe(true);
  });

  test("preposition 'by': 'Submit report by 5pm friday'", () => {
    const result = parseEventInput("Submit report by 5pm friday", REF);
    expect(result.title).toBe("Submit report");
    expect(result.start.getHours()).toBe(17);
    expect(result.allDay).toBe(false);
  });

  test("specific date, no time — all day: 'Christmas party december 25'", () => {
    const result = parseEventInput("Christmas party december 25", REF);
    expect(result.title).toBe("Christmas party");
    expect(result.start.getMonth()).toBe(11); // December = 11
    expect(result.start.getDate()).toBe(25);
    expect(result.allDay).toBe(true);
  });

  test("relative time: 'Meeting in 2 hours'", () => {
    const result = parseEventInput("Meeting in 2 hours", REF);
    expect(result.title).toBe("Meeting");
    expect(result.start.getHours()).toBe(14);
    expect(result.end.getHours()).toBe(15);
    expect(result.allDay).toBe(false);
  });

  test("recurring-style input (parses first occurrence): 'Yoga class tuesday 6am'", () => {
    const result = parseEventInput("Yoga class tuesday 6am", REF);
    expect(result.title).toBe("Yoga class");
    expect(result.start.getHours()).toBe(6);
    expect(result.allDay).toBe(false);
  });

  test("empty input throws", () => {
    expect(() => parseEventInput("", REF)).toThrow("Empty input");
    expect(() => parseEventInput("   ", REF)).toThrow("Empty input");
  });

  test("no date at all — all-day today: 'Buy groceries'", () => {
    const result = parseEventInput("Buy groceries", REF);
    expect(result.title).toBe("Buy groceries");
    expect(result.start.getDate()).toBe(14);
    expect(result.allDay).toBe(true);
  });
});
