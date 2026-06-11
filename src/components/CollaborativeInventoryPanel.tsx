"use client";

import { useMemo, useState } from "react";
import {
  INVENTORY_LAYER_LABELS,
  INVENTORY_LAYER_SHORT,
  INVENTORY_STATUS_COLORS,
  INVENTORY_STATUS_LABELS,
  type InventoryLayerType,
  type InventoryItemStatus,
  type CollaborativeInventoryItem
} from "@/data/collaborative-inventory";
import type { ProposeInput } from "@/context/CollaborativeInventoryContext";
import { getMitgliedById, MITGLIEDER } from "@/data/mitglieder";
import { useCollaborativeInventory } from "@/context/CollaborativeInventoryContext";
import { useUserSession } from "@/context/UserSessionContext";
import { MEMBER_ASSET_INVENTORY } from "@/data/ber-plus-coordination";

type Props = {
  onFocusLandSite?: (siteId: string) => void;
  onFocusMember?: (memberId: string) => void;
  onGoToOsmIntel?: () => void;
};

const LAYER_ORDER: InventoryLayerType[] = ["assets", "land", "infrastructure", "development"];

export function CollaborativeInventoryPanel({ onFocusLandSite, onFocusMember, onGoToOsmIntel }: Props) {
  const { memberId } = useUserSession();
  const {
    items,
    stats,
    actorLabel,
    canActAsSecretariat,
    proposeItem,
    submitForReview,
    verifyItem,
    requestUpdate,
    resetDemo
  } = useCollaborativeInventory();

  const [layerFilter, setLayerFilter] = useState<InventoryLayerType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<InventoryItemStatus | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (layerFilter !== "all" && item.layer !== layerFilter) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      return true;
    });
  }, [items, layerFilter, statusFilter]);

  const progressPct = stats.total ? Math.round((stats.verified / stats.total) * 100) : 0;

  return (
    <div className="flex flex-col gap-3" data-testid="panel-collab-inventory">
      <header className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3 py-2.5">
        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/95">
          Asset mgmt demo · step 2
        </div>
        <h2 className="mt-1 text-sm font-semibold text-white">{MEMBER_ASSET_INVENTORY.followUpQuestion}</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-white/60">
          Members propose rows · BER+ verifies · map stays step 1 until signed off. Demo state persists in your
          browser.
        </p>
        <div className="mt-2.5">
          <div className="flex justify-between text-[10px] text-white/50">
            <span>Verified co-inventory</span>
            <span>
              {stats.verified}/{stats.total} · {progressPct}%
            </span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500/80 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[9px]">
          {LAYER_ORDER.map((layer) => (
            <span
              key={layer}
              className="rounded-full border border-white/10 bg-black/30 px-2 py-0.5 text-white/55"
            >
              {INVENTORY_LAYER_SHORT[layer]} {stats.byLayer[layer].verified}/{stats.byLayer[layer].total}
            </span>
          ))}
        </div>
        <p className="mt-2 text-[10px] text-white/40">Acting as: {actorLabel}</p>
      </header>

      <div className="flex flex-wrap gap-1">
        <FilterChip active={layerFilter === "all"} onClick={() => setLayerFilter("all")} label="All layers" />
        {LAYER_ORDER.map((layer) => (
          <FilterChip
            key={layer}
            active={layerFilter === layer}
            onClick={() => setLayerFilter(layer)}
            label={INVENTORY_LAYER_SHORT[layer]}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")} label="All status" />
        {(Object.keys(INVENTORY_STATUS_LABELS) as InventoryItemStatus[]).map((s) => (
          <FilterChip
            key={s}
            active={statusFilter === s}
            onClick={() => setStatusFilter(s)}
            label={INVENTORY_STATUS_LABELS[s].split(" ·")[0]!}
            dot={INVENTORY_STATUS_COLORS[s]}
          />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-lg bg-emerald-600/25 px-3 py-1.5 text-[11px] font-medium text-emerald-100 hover:bg-emerald-600/35"
          data-testid="collab-add-proposal"
        >
          {showForm ? "Cancel proposal" : "+ Propose inventory row"}
        </button>
        {onGoToOsmIntel ? (
          <button
            type="button"
            onClick={onGoToOsmIntel}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/5"
          >
            Map step 1 · OSM Intel →
          </button>
        ) : null}
        <button
          type="button"
          onClick={resetDemo}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-[10px] text-white/45 hover:text-white/65"
          data-testid="collab-reset-demo"
        >
          Reset demo
        </button>
      </div>

      {showForm ? (
        <ProposeForm
          defaultMemberId={memberId ?? "segro"}
          onSubmit={(input) => {
            const id = proposeItem(input);
            setShowForm(false);
            setExpandedId(id);
          }}
        />
      ) : null}

      <ul className="space-y-2">
        {filtered.map((item) => (
          <InventoryItemCard
            key={item.id}
            item={item}
            open={expandedId === item.id}
            onToggle={() => setExpandedId(expandedId === item.id ? null : item.id)}
            onSubmit={() => submitForReview(item.id)}
            onVerify={() => verifyItem(item.id)}
            onRequestUpdate={() => requestUpdate(item.id)}
            canSubmit={
              item.status === "member_draft" &&
              (canActAsSecretariat || (memberId != null && item.memberIds.includes(memberId)))
            }
            canVerify={canActAsSecretariat && item.status === "pending_review"}
            canFlag={canActAsSecretariat && item.status === "verified"}
            onFocusLandSite={onFocusLandSite}
            onFocusMember={onFocusMember}
          />
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="py-4 text-center text-xs text-white/45">No rows match these filters.</p>
      ) : null}
    </div>
  );
}

function InventoryItemCard({
  item,
  open,
  onToggle,
  onSubmit,
  onVerify,
  onRequestUpdate,
  canSubmit,
  canVerify,
  canFlag,
  onFocusLandSite,
  onFocusMember
}: {
  item: CollaborativeInventoryItem;
  open: boolean;
  onToggle: () => void;
  onSubmit: () => void;
  onVerify: () => void;
  onRequestUpdate: () => void;
  canSubmit: boolean;
  canVerify: boolean;
  canFlag: boolean;
  onFocusLandSite?: (id: string) => void;
  onFocusMember?: (id: string) => void;
}) {
  const statusColor = INVENTORY_STATUS_COLORS[item.status];

  return (
    <li
      className="rounded-lg border border-white/10 bg-white/[0.03]"
      data-testid={`collab-item-${item.id}`}
    >
      <button type="button" onClick={onToggle} className="w-full px-3 py-2.5 text-left hover:bg-white/5">
        <div className="flex items-start gap-2">
          <span
            className="mt-1 h-2 w-2 shrink-0 rounded-full"
            style={{ background: statusColor }}
            title={INVENTORY_STATUS_LABELS[item.status]}
          />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium uppercase tracking-wide text-white/40">
              {INVENTORY_LAYER_LABELS[item.layer]}
            </div>
            <div className="text-sm font-semibold text-white">{item.title}</div>
            <div className="mt-0.5 text-[10px] text-white/45">{INVENTORY_STATUS_LABELS[item.status]}</div>
          </div>
          <span className="text-[10px] text-white/35">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open ? (
        <div className="space-y-2 border-t border-white/8 px-3 pb-3 pt-2 text-[11px]">
          <p className="leading-relaxed text-white/70">{item.description}</p>
          <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px]">
            {item.ha != null ? (
              <>
                <dt className="text-white/40">Area</dt>
                <dd className="font-mono text-emerald-100/90">{item.ha} ha</dd>
              </>
            ) : null}
            {item.phase ? (
              <>
                <dt className="text-white/40">Phase</dt>
                <dd className="text-white/70">{item.phase}</dd>
              </>
            ) : null}
            {item.counterpartSought ? (
              <>
                <dt className="text-white/40">Counterpart</dt>
                <dd className="text-white/70">{item.counterpartSought}</dd>
              </>
            ) : null}
          </dl>
          <div className="flex flex-wrap gap-1">
            {item.memberIds.map((id) => {
              const m = getMitgliedById(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onFocusMember?.(id)}
                  className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-sky-200/90 hover:bg-white/12"
                >
                  {m?.shortName ?? id}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {item.landSiteId && onFocusLandSite ? (
              <button
                type="button"
                onClick={() => onFocusLandSite(item.landSiteId!)}
                className="rounded bg-violet-500/20 px-2 py-1 text-[10px] font-medium text-violet-100"
                data-testid={`collab-map-${item.id}`}
              >
                Show on map
              </button>
            ) : null}
            {canSubmit ? (
              <button
                type="button"
                onClick={onSubmit}
                className="rounded bg-sky-600/30 px-2 py-1 text-[10px] font-medium text-sky-100"
                data-testid={`collab-submit-${item.id}`}
              >
                Submit for BER+ review
              </button>
            ) : null}
            {canVerify ? (
              <button
                type="button"
                onClick={onVerify}
                className="rounded bg-emerald-600/35 px-2 py-1 text-[10px] font-medium text-emerald-100"
                data-testid={`collab-verify-${item.id}`}
              >
                BER+ verify
              </button>
            ) : null}
            {canFlag ? (
              <button
                type="button"
                onClick={onRequestUpdate}
                className="rounded border border-amber-500/30 px-2 py-1 text-[10px] text-amber-100/90"
              >
                Flag update
              </button>
            ) : null}
          </div>
          <div className="rounded border border-white/8 bg-black/25 px-2 py-1.5">
            <div className="text-[9px] font-semibold uppercase tracking-wide text-white/35">Activity</div>
            <ul className="mt-1 max-h-24 space-y-0.5 overflow-y-auto">
              {[...item.history].reverse().map((h, i) => (
                <li key={`${h.at}-${i}`} className="text-[9px] text-white/50">
                  <span className="text-white/35">{new Date(h.at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</span>
                  {" · "}
                  <span className="text-white/60">{h.actor}</span>: {h.action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </li>
  );
}

function ProposeForm({
  defaultMemberId,
  onSubmit
}: {
  defaultMemberId: string;
  onSubmit: (input: ProposeInput) => void;
}) {
  const [layer, setLayer] = useState<InventoryLayerType>("land");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [memberId, setMemberId] = useState(defaultMemberId);
  const [ha, setHa] = useState("");

  return (
    <form
      className="rounded-lg border border-emerald-500/25 bg-emerald-950/20 p-3"
      data-testid="collab-propose-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onSubmit({
          layer,
          title,
          description,
          memberIds: [memberId],
          ha: ha ? Number(ha) : undefined
        });
      }}
    >
      <div className="text-xs font-semibold text-emerald-100">New member draft</div>
      <div className="mt-2 grid gap-2">
        <label className="text-[10px] text-white/50">
          Layer
          <select
            value={layer}
            onChange={(e) => setLayer(e.target.value as InventoryLayerType)}
            className="mt-0.5 w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-[11px] text-white"
          >
            {LAYER_ORDER.map((l) => (
              <option key={l} value={l}>
                {INVENTORY_LAYER_LABELS[l]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] text-white/50">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-0.5 w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-[11px] text-white"
            placeholder="e.g. North belt parcel · 4.2 ha"
            required
          />
        </label>
        <label className="text-[10px] text-white/50">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-0.5 w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-[11px] text-white"
            placeholder="Availability, planning status, what you need from BER+…"
          />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] text-white/50">
            Member
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="mt-0.5 w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-[11px] text-white"
            >
              {MITGLIEDER.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.shortName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[10px] text-white/50">
            ha (optional)
            <input
              value={ha}
              onChange={(e) => setHa(e.target.value)}
              type="number"
              step="0.1"
              min="0"
              className="mt-0.5 w-full rounded border border-white/15 bg-black/40 px-2 py-1.5 text-[11px] text-white"
            />
          </label>
        </div>
      </div>
      <button
        type="submit"
        className="mt-3 w-full rounded-lg bg-emerald-600/30 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-600/40"
        data-testid="collab-propose-submit"
      >
        Save as member draft
      </button>
    </form>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  dot
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dot?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[10px] font-medium touch-manipulation ${
        active ? "bg-white/15 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
      }`}
    >
      {dot ? (
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ background: dot }} aria-hidden />
      ) : null}
      {label}
    </button>
  );
}
