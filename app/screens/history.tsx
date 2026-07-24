"use client";

import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  parseISO,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ArrowDownUp, ArrowRight, CalendarRange, ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { IconBadge, PageHeader } from "../components/ui";
import { useAppStore } from "../store/app-store";
import type { HealthLog } from "../types";

const kindLabel = (kind: HealthLog["kind"]) =>
  kind === "poop" ? "Bowel movement" : kind === "pee" ? "Urination" : kind === "water" ? "Water / drink" : kind === "checkin" ? "Daily check-in" : "Symptom note";

const summary = (log: HealthLog) => {
  if (log.kind === "poop") return `Type ${log.bristolType} · ${log.amount}${log.symptoms.length ? ` · ${log.symptoms.join(", ")}` : ""}`;
  if (log.kind === "pee") return `Color ${log.color} · ${log.amount}${log.symptoms.length ? ` · ${log.symptoms.join(", ")}` : ""}`;
  if (log.kind === "water") return `${log.amountMl} ml · ${log.drinkType}`;
  if (log.kind === "checkin") return `Overall ${log.overall}/5 · Stress ${log.stress}/5`;
  return `${log.title}${log.symptoms.length ? ` · ${log.symptoms.join(", ")}` : ""}`;
};

function Calendar({
  month,
  logs,
  selected,
  onSelect,
}: {
  month: Date;
  logs: HealthLog[];
  selected: string;
  onSelect: (date: string) => void;
}) {
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const offset = (startOfMonth(month).getDay() + 6) % 7;
  return (
    <div className="calendar">
      <div className="calendar-week">{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
      <div className="calendar-grid">
        {Array.from({ length: offset }).map((_, index) => <i key={`empty-${index}`} />)}
        {days.map((day) => {
          const date = format(day, "yyyy-MM-dd");
          const dayLogs = logs.filter((log) => log.date === date);
          return (
            <button key={date} className={`${selected === date ? "selected" : ""} ${isSameDay(day, new Date()) ? "today" : ""}`} onClick={() => onSelect(selected === date ? "" : date)}>
              <span>{format(day, "d")}</span>
              <small>
                {dayLogs.some((log) => log.kind === "poop") && <i className="amber" />}
                {dayLogs.some((log) => log.kind === "pee") && <i className="blue" />}
                {dayLogs.some((log) => log.kind === "water") && <i className="green" />}
                {dayLogs.some((log) => log.kind === "checkin" || log.kind === "note") && <i className="violet" />}
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function HistoryScreen() {
  const logs = useAppStore((state) => state.logs);
  const [month, setMonth] = useState(new Date());
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [kinds, setKinds] = useState<HealthLog["kind"][]>([]);
  const [warningOnly, setWarningOnly] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const result = logs.filter((log) => {
      if (selectedDate && log.date !== selectedDate) return false;
      if (kinds.length && !kinds.includes(log.kind)) return false;
      if (from && log.date < from) return false;
      if (to && log.date > to) return false;
      if (warningOnly && !("severity" in log && log.severity >= 3) && !("symptoms" in log && log.symptoms.includes("Blood"))) return false;
      if (query) {
        const haystack = `${kindLabel(log.kind)} ${summary(log)} ${log.notes ?? ""}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });
    return result.sort((a, b) => sort === "newest" ? `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`) : `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [from, kinds, logs, query, selectedDate, sort, to, warningOnly]);

  const grouped = filtered.reduce<Record<string, HealthLog[]>>((groups, log) => {
    (groups[log.date] ??= []).push(log);
    return groups;
  }, {});

  return (
    <div className="page history-page">
      <PageHeader eyebrow="Your records" title="History" intro="Search, filter, and review your private timeline." actions={<a className="button primary" href="/add">Add entry</a>} />
      <div className="history-toolbar">
        <label className="search-field"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes, symptoms, or tags" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X /></button>}</label>
        <button className={`button secondary ${filtersOpen ? "active" : ""}`} onClick={() => setFiltersOpen((value) => !value)}><Filter /> Filters {kinds.length + (warningOnly ? 1 : 0) > 0 && <b>{kinds.length + (warningOnly ? 1 : 0)}</b>}</button>
        <button className="button secondary" onClick={() => setSort((value) => value === "newest" ? "oldest" : "newest")}><ArrowDownUp /> {sort === "newest" ? "Newest" : "Oldest"}</button>
      </div>
      {filtersOpen && (
        <section className="filter-panel">
          <div><label>Entry types</label><div className="option-chips">{(["poop", "pee", "water", "checkin", "note"] as HealthLog["kind"][]).map((kind) => <button key={kind} className={kinds.includes(kind) ? "selected" : ""} onClick={() => setKinds((current) => current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind])}>{kindLabel(kind)}</button>)}</div></div>
          <div className="form-row two"><label>From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label></div>
          <label className="check-row"><input type="checkbox" checked={warningOnly} onChange={(event) => setWarningOnly(event.target.checked)} /><span><strong>Entries with warning signs</strong><small>Severe symptoms, blood, or urgent selections.</small></span></label>
          <button className="text-link" onClick={() => { setKinds([]); setFrom(""); setTo(""); setWarningOnly(false); }}>Clear all filters</button>
        </section>
      )}

      <div className="history-layout">
        <aside className="calendar-card card">
          <div className="calendar-title"><button onClick={() => setMonth(subMonths(month, 1))} aria-label="Previous month"><ChevronLeft /></button><strong>{format(month, "MMMM yyyy")}</strong><button onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month"><ChevronRight /></button></div>
          <Calendar month={month} logs={logs} selected={selectedDate} onSelect={setSelectedDate} />
          <div className="calendar-legend"><span><i className="amber" />Bowel</span><span><i className="blue" />Urination</span><span><i className="green" />Water</span><span><i className="violet" />Check-in</span></div>
          {selectedDate && <button className="button ghost full" onClick={() => setSelectedDate("")}>Show all dates</button>}
        </aside>

        <section className="history-results">
          <div className="results-heading"><span>{filtered.length} {filtered.length === 1 ? "entry" : "entries"}</span>{selectedDate && <strong><CalendarRange /> {format(parseISO(selectedDate), "MMMM d, yyyy")}</strong>}</div>
          {Object.entries(grouped).length ? Object.entries(grouped).map(([date, entries]) => (
            <div className="history-day" key={date}>
              <div className="day-label"><strong>{format(parseISO(date), "EEEE")}</strong><span>{format(parseISO(date), "MMMM d, yyyy")}</span></div>
              <div className="day-entries">
                {entries.map((log) => (
                  <a href={`/entry/${log.id}`} className="history-entry" key={log.id}>
                    <IconBadge kind={log.kind} />
                    <div><strong>{kindLabel(log.kind)}</strong><p>{summary(log)}</p>{log.notes && <small>“{log.notes}”</small>}</div>
                    <time>{format(new Date(`${log.date}T${log.time}:00`), "h:mm a")}</time><ArrowRight />
                  </a>
                ))}
              </div>
            </div>
          )) : (
            <div className="empty-state compact"><span className="empty-orbit"><i /><i /><i /></span><h3>No matching entries</h3><p>Try a different date, search term, or filter.</p><button className="button secondary" onClick={() => { setQuery(""); setKinds([]); setSelectedDate(""); setFrom(""); setTo(""); setWarningOnly(false); }}>Reset filters</button></div>
          )}
        </section>
      </div>
    </div>
  );
}
