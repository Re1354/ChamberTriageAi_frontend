"use client";

import type { ReactNode } from "react";
import { COMORBIDITIES, type Evidence, type SummaryCard, type SummaryItem } from "@chamberai/shared";
import { Badge } from "@/components/ui";
import { cx } from "@/lib/format";

function EvidenceLinks({ evidence }: { evidence: Evidence[] }) {
  if (!evidence.length) return null;
  return (
    <span className="no-print ml-1 inline-flex gap-1 align-middle">
      {evidence.slice(0, 3).map((e, i) => (
        <a
          key={i}
          href={e.source === "message" ? `#msg-${e.refId}` : e.source === "upload" ? `#upl-${e.refId}` : "#comorbidities"}
          title={e.quote ?? "উৎস দেখুন"}
          className="rounded bg-slate-100 px-1 text-xs text-slate-500 hover:bg-teal-100 hover:text-teal-800"
        >
          {e.source === "message" ? "💬" : e.source === "upload" ? "📷" : "☑"}
        </a>
      ))}
    </span>
  );
}

function Items({ items, empty }: { items: SummaryItem[]; empty?: string }) {
  if (!items.length) return empty ? <p className="text-sm text-slate-400">{empty}</p> : null;
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((it, i) => (
        <li key={i}>
          {it.text}
          <EvidenceLinks evidence={it.evidence} />
        </li>
      ))}
    </ul>
  );
}

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx("space-y-1", className)}>
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3>
      {children}
    </section>
  );
}

/** ডাক্তারের ১-পৃষ্ঠার সামারি */
export function SummaryCardView({ card, comorbidityIds }: { card: SummaryCard; comorbidityIds: string[] }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={card.generatedBy === "ai" ? "teal" : "slate"}>
          {card.generatedBy === "ai" ? "AI-সংগৃহীত" : "নিয়মভিত্তিক সামারি (AI ছাড়া)"}
        </Badge>
        <Badge tone={card.verifyOk ? "green" : "amber"}>{card.verifyOk ? "উৎস যাচাই ✓" : "উৎস যাচাই অসম্পূর্ণ"}</Badge>
        <span className="text-xs text-slate-500">যাচাই করে ব্যবহার করুন</span>
      </div>

      {card.redFlags.length > 0 && (
        <div className="rounded-xl border-2 border-red-500 bg-red-50 p-3">
          <h3 className="font-bold text-red-700">⚠ Red flags</h3>
          <Items items={card.redFlags} />
        </div>
      )}

      <Section title="Chief complaint">
        <p className="text-lg font-semibold">
          {card.chiefComplaint.text}
          {card.duration ? <span className="font-normal text-slate-600"> — {card.duration}</span> : null}
          <EvidenceLinks evidence={card.chiefComplaint.evidence} />
        </p>
      </Section>

      <Section title="History of presenting illness">
        <Items items={card.hpi} empty="—" />
      </Section>

      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Comorbidities">
          <div id="comorbidities">
            <Items
              items={card.comorbidities}
              empty={comorbidityIds.length ? COMORBIDITIES.filter((c) => comorbidityIds.includes(c.id)).map((c) => c.en).join(", ") : "None reported"}
            />
          </div>
        </Section>

        <Section title="Current medicines">
          {card.medications.length ? (
            <ul className="space-y-1">
              {card.medications.map((m, i) => (
                <li key={i}>
                  <b>{m.generic ?? m.brand ?? "?"}</b> {m.strength ?? ""}
                  {m.brand && m.generic && <span className="text-slate-500"> ({m.brand})</span>}
                  {m.genericSource === "kb" && <span className="ml-1 text-xs text-slate-400">[KB]</span>}
                  {m.uploadId && (
                    <a href={`#upl-${m.uploadId}`} className="no-print ml-1 text-xs text-slate-400">
                      📷
                    </a>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">—</p>
          )}
        </Section>
      </div>

      {card.labs.length > 0 && (
        <Section title="Labs (from printed reports)">
          <table className="w-full text-sm">
            <tbody>
              {card.labs.map((l, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-1 pr-2 font-medium">{l.name}</td>
                  <td
                    className={cx(
                      "py-1 pr-2 font-semibold",
                      l.flag === "high" && "text-red-700",
                      l.flag === "low" && "text-blue-700",
                    )}
                  >
                    {l.value ?? l.valueText ?? "—"} {l.unit ?? ""} {l.flag === "high" ? "↑" : l.flag === "low" ? "↓" : ""}
                  </td>
                  <td className="py-1 pr-2 text-slate-500">
                    {l.refLow !== null || l.refHigh !== null ? `ref ${l.refLow ?? ""}–${l.refHigh ?? ""}` : ""}
                  </td>
                  <td className="py-1 text-slate-400">{l.reportDate ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {card.consider.length > 0 && (
        <Section title="Consider (not a diagnosis)">
          <Items items={card.consider} />
        </Section>
      )}

      {card.patientQuotes.length > 0 && (
        <Section title="রোগীর নিজের কথায়">
          {card.patientQuotes.map((q, i) => (
            <p key={i} className="italic text-slate-700">
              “{q}”
            </p>
          ))}
        </Section>
      )}

      {card.dataGaps.length > 0 && (
        <Section title="তথ্যের ঘাটতি">
          <ul className="list-disc pl-5 text-sm text-amber-800">
            {card.dataGaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
