"use client";

import type { ReactNode } from "react";
import { COMORBIDITIES, type Evidence, type SummaryCard, type SummaryItem } from "@chamberai/shared";
import { Activity, AlertTriangle, Camera, CheckSquare, FileText, HeartPulse, Info, MessageSquare, Pill, Sparkles } from "@/components/icons";
import { Badge } from "@/components/ui";
import { cx } from "@/lib/format";

/** প্রতিটি তথ্যের উৎস — ক্লিক করলে রোগীর সেই উত্তর/ছবিতে যায় */
function EvidenceLinks({ evidence }: { evidence: Evidence[] }) {
  if (!evidence.length) return null;
  return (
    <span className="no-print ml-1.5 inline-flex gap-1 align-middle">
      {evidence.slice(0, 3).map((e, i) => (
        <a
          key={i}
          href={e.source === "message" ? `#msg-${e.refId}` : e.source === "upload" ? `#upl-${e.refId}` : "#comorbidities"}
          title={e.quote ?? "উৎস দেখুন"}
          aria-label={e.source === "message" ? "রোগীর উত্তরে যান" : e.source === "upload" ? "ছবিতে যান" : "চেকবক্স থেকে"}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-brand-100 hover:text-brand-800"
        >
          {e.source === "message" ? <MessageSquare size={13} /> : e.source === "upload" ? <Camera size={13} /> : <CheckSquare size={13} />}
        </a>
      ))}
    </span>
  );
}

function Items({ items, empty }: { items: SummaryItem[]; empty?: string }) {
  if (!items.length) return empty ? <p className="text-sm text-slate-400">{empty}</p> : null;
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 leading-relaxed text-slate-800">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
          <span>
            {it.text}
            <EvidenceLinks evidence={it.evidence} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function Section({ title, icon, children, className }: { title: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("space-y-2", className)}>
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

/** ডাক্তারের ১-পৃষ্ঠার সামারি */
export function SummaryCardView({ card, comorbidityIds }: { card: SummaryCard; comorbidityIds: string[] }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={card.generatedBy === "ai" ? "brand" : "slate"} icon={card.generatedBy === "ai" ? <Sparkles size={12} /> : undefined}>
          {card.generatedBy === "ai" ? "AI-সংগৃহীত" : "নিয়মভিত্তিক সামারি"}
        </Badge>
        <Badge tone={card.verifyOk ? "green" : "amber"}>{card.verifyOk ? "উৎস যাচাই ✓" : "উৎস যাচাই অসম্পূর্ণ"}</Badge>
      </div>

      {card.redFlags.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <h3 className="mb-2 flex items-center gap-2 font-bold text-red-700">
            <AlertTriangle size={18} /> Red flags
          </h3>
          <Items items={card.redFlags} />
        </div>
      )}

      <Section title="Chief complaint" icon={<HeartPulse size={14} />}>
        <p className="text-lg font-semibold leading-relaxed text-slate-900">
          {card.chiefComplaint.text}
          {card.duration ? <span className="font-normal text-slate-500"> — {card.duration}</span> : null}
          <EvidenceLinks evidence={card.chiefComplaint.evidence} />
        </p>
      </Section>

      <Section title="History of presenting illness" icon={<Activity size={14} />}>
        <Items items={card.hpi} empty="—" />
      </Section>

      <div className="grid gap-6 sm:grid-cols-2">
        <Section title="Comorbidities" icon={<CheckSquare size={14} />}>
          <div id="comorbidities" className="scroll-mt-24">
            {card.comorbidities.length ? (
              <div className="flex flex-wrap gap-1.5">
                {card.comorbidities.map((c, i) => (
                  <Badge key={i} tone="violet">
                    {c.text}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                {comorbidityIds.length
                  ? COMORBIDITIES.filter((c) => comorbidityIds.includes(c.id))
                      .map((c) => c.en)
                      .join(", ")
                  : "None reported"}
              </p>
            )}
          </div>
        </Section>

        <Section title="Current medicines" icon={<Pill size={14} />}>
          {card.medications.length ? (
            <ul className="space-y-1.5">
              {card.medications.map((m, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-1.5 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-inset ring-slate-200">
                  <span className="font-semibold text-slate-900">{m.generic ?? m.brand ?? "?"}</span>
                  {m.strength && <span className="text-slate-600">{m.strength}</span>}
                  {m.brand && m.generic && <span className="text-sm text-slate-500">({m.brand})</span>}
                  {m.genericSource === "kb" && (
                    <span className="rounded bg-white px-1.5 text-[11px] font-medium text-slate-500 ring-1 ring-inset ring-slate-200" title="ওষুধের তালিকা থেকে মেলানো">
                      KB
                    </span>
                  )}
                  {m.uploadId && (
                    <a href={`#upl-${m.uploadId}`} className="no-print text-slate-400 hover:text-brand-700" aria-label="ওষুধের ছবিতে যান">
                      <Camera size={14} />
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
        <Section title="Labs (from printed reports)" icon={<FileText size={14} />}>
          <div className="overflow-x-auto rounded-xl ring-1 ring-inset ring-slate-200">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Test</th>
                  <th className="px-3 py-2 font-semibold">Result</th>
                  <th className="px-3 py-2 font-semibold">Reference</th>
                  <th className="px-3 py-2 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {card.labs.map((l, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-800">{l.name}</td>
                    <td
                      className={cx(
                        "px-3 py-2 font-semibold tabular-nums",
                        l.flag === "high" && "text-red-700",
                        l.flag === "low" && "text-sky-700",
                      )}
                    >
                      {l.value ?? l.valueText ?? "—"} {l.unit ?? ""}{" "}
                      {l.flag === "high" ? <Badge tone="red">High</Badge> : l.flag === "low" ? <Badge tone="sky">Low</Badge> : null}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {l.refLow !== null || l.refHigh !== null ? `${l.refLow ?? ""}–${l.refHigh ?? ""}` : ""}
                    </td>
                    <td className="px-3 py-2 text-slate-400">{l.reportDate ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {card.consider.length > 0 && (
        <Section title="Consider (not a diagnosis)" icon={<Info size={14} />}>
          <Items items={card.consider} />
        </Section>
      )}

      {card.patientQuotes.length > 0 && (
        <Section title="রোগীর নিজের কথায়" icon={<MessageSquare size={14} />}>
          <div className="space-y-2">
            {card.patientQuotes.map((q, i) => (
              <blockquote key={i} className="border-l-4 border-brand-200 pl-3 italic leading-relaxed text-slate-700">
                “{q}”
              </blockquote>
            ))}
          </div>
        </Section>
      )}

      {card.dataGaps.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-inset ring-amber-200">
          <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-amber-900">
            <Info size={16} /> তথ্যের ঘাটতি
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-900">
            {card.dataGaps.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
