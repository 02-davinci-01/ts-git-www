"use client";

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Select,
  SelectValue,
  Button,
  Popover,
  ListBox,
  ListBoxItem,
} from "react-aria-components";

// ─── Types ──────────────────────────────────────

interface Commit {
  id: string;
  hash: string;
  message: string;
  parent: string | null;
  secondParent?: string | null;
}

interface Branch {
  name: string;
  commitId: string;
  color: string;
}

interface GitState {
  commits: Commit[];
  branches: Branch[];
  head: string;
}

// ─── Constants ──────────────────────────────────

const BRANCH_COLORS = [
  "#1a1a1a",
  "#e67e22",
  "#2ecc71",
  "#3498db",
  "#9b59b6",
  "#e74c3c",
  "#1abc9c",
  "#f39c12",
];

const NODE_R = 16;
const Y_GAP = 70;
const X_GAP = 160;
const PAD_X = 60;
const PAD_Y = 50;

const COMMIT_MESSAGES = [
  "update config",
  "fix bug",
  "add feature",
  "refactor code",
  "update tests",
  "add docs",
  "cleanup imports",
  "optimize perf",
];

// ─── Helpers ────────────────────────────────────

let counter = 0;
function shortHash(): string {
  counter++;
  const base = "0123456789abcdef";
  let h = "";
  for (let i = 0; i < 7; i++) h += base[(counter * 7 + i * 13) % 16];
  return h;
}

function initialState(): GitState {
  const c1: Commit = { id: "c1", hash: "a1b2c3d", message: "initial commit", parent: null };
  const c2: Commit = { id: "c2", hash: "e4f5a6b", message: "add README", parent: "c1" };
  const c3: Commit = { id: "c3", hash: "7c8d9e0", message: "setup project", parent: "c2" };
  return {
    commits: [c1, c2, c3],
    branches: [{ name: "main", commitId: "c3", color: BRANCH_COLORS[0] }],
    head: "main",
  };
}

const TUTORIAL_STEPS = [
  {
    title: "try it out",
    steps: [
      { label: "1. click", action: "ts_git commit", desc: "to add a commit" },
      { label: "2. click", action: "ts_git branch", desc: "to create a branch" },
      { label: "3. click the new branch pill to switch to it" },
      { label: "4. click", action: "ts_git commit", desc: "twice on the new branch" },
    ],
  },
  {
    title: "merging",
    steps: [
      { label: "1. switch to main (click the pill)" },
      { label: "2. pick a branch from the merge dropdown" },
      { label: "3. click", action: "ts_git merge", desc: "to merge it in" },
    ],
  },
];

// ─── Component ──────────────────────────────────

export function InteractiveMode({ onExit }: { onExit: () => void }) {
  const [state, setState] = useState<GitState>(initialState);
  const [log, setLog] = useState<string[]>(["initialized with 3 commits on main"]);
  const [mergeSource, setMergeSource] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const panStart = useRef({ x: 0, y: 0, px: 0, py: 0 });

  const pushLog = useCallback((msg: string) => setLog((l) => [...l, msg]), []);
  const bumpAnim = useCallback(() => setAnimKey((k) => k + 1), []);

  // ─── Actions ────────────────────────────────

  const doCommit = useCallback(() => {
    setState((s) => {
      const branch = s.branches.find((b) => b.name === s.head);
      if (!branch) return s;
      const id = `c${s.commits.length + 1}`;
      const hash = shortHash();
      const msg = COMMIT_MESSAGES[s.commits.length % COMMIT_MESSAGES.length];
      const commit: Commit = { id, hash, message: msg, parent: branch.commitId };
      pushLog(`[${s.head}] ${hash.slice(0, 7)} ${msg}`);
      bumpAnim();
      return {
        ...s,
        commits: [...s.commits, commit],
        branches: s.branches.map((b) => (b.name === s.head ? { ...b, commitId: id } : b)),
      };
    });
  }, [pushLog, bumpAnim]);

  const doBranch = useCallback(() => {
    setState((s) => {
      const existing = new Set(s.branches.map((b) => b.name));
      const names = ["feature", "bugfix", "develop", "hotfix", "release", "experiment"];
      let name = names.find((n) => !existing.has(n));
      if (!name) name = `branch-${s.branches.length}`;
      const headBranch = s.branches.find((b) => b.name === s.head);
      if (!headBranch) return s;
      const color = BRANCH_COLORS[s.branches.length % BRANCH_COLORS.length];
      pushLog(`created branch '${name}'`);
      bumpAnim();
      return { ...s, branches: [...s.branches, { name, commitId: headBranch.commitId, color }] };
    });
  }, [pushLog, bumpAnim]);

  const doCheckout = useCallback(
    (name: string) => {
      setState((s) => {
        if (s.head === name) return s;
        pushLog(`switched to '${name}'`);
        return { ...s, head: name };
      });
    },
    [pushLog],
  );

  const doMerge = useCallback(() => {
    if (!mergeSource) return;
    setState((s) => {
      const src = s.branches.find((b) => b.name === mergeSource);
      const tgt = s.branches.find((b) => b.name === s.head);
      if (!src || !tgt || src.name === tgt.name) return s;
      const id = `c${s.commits.length + 1}`;
      const hash = shortHash();
      const msg = `merge ${src.name} into ${tgt.name}`;
      const commit: Commit = {
        id, hash, message: msg,
        parent: tgt.commitId,
        secondParent: src.commitId,
      };
      pushLog(`merged '${src.name}' into '${tgt.name}'`);
      setMergeSource(null);
      bumpAnim();
      return {
        ...s,
        commits: [...s.commits, commit],
        branches: s.branches.map((b) => (b.name === s.head ? { ...b, commitId: id } : b)),
      };
    });
  }, [mergeSource, pushLog, bumpAnim]);

  const doReset = useCallback(() => {
    counter = 0;
    setState(initialState());
    setLog(["reset"]);
    setMergeSource(null);
    setPan({ x: 0, y: 0 });
    bumpAnim();
  }, [bumpAnim]);

  // ─── Layout ─────────────────────────────────

  const layout = useCallback((s: GitState) => {
    const byId = new Map(s.commits.map((c) => [c.id, c]));
    const pos: Record<string, { x: number; y: number; col: number; color: string }> = {};

    const owner: Record<string, number> = {};
    s.branches.forEach((b, i) => {
      let cur: string | null = b.commitId;
      const chain: string[] = [];
      const visited = new Set<string>();
      while (cur && !visited.has(cur)) {
        visited.add(cur);
        chain.push(cur);
        const c = byId.get(cur);
        cur = c?.parent ?? null;
      }
      if (i === 0) {
        chain.forEach((id) => { owner[id] = 0; });
      } else {
        let forkIdx = chain.length;
        for (let j = 0; j < chain.length; j++) {
          if (owner[chain[j]] !== undefined) { forkIdx = j; break; }
        }
        for (let j = 0; j < forkIdx; j++) {
          owner[chain[j]] = i;
        }
      }
    });

    const row: Record<string, number> = {};
    function getRow(id: string): number {
      if (row[id] !== undefined) return row[id];
      const c = byId.get(id);
      if (!c) { row[id] = 0; return 0; }
      let maxP = -1;
      if (c.parent && byId.has(c.parent)) maxP = Math.max(maxP, getRow(c.parent));
      if (c.secondParent && byId.has(c.secondParent)) maxP = Math.max(maxP, getRow(c.secondParent));
      row[id] = maxP + 1;
      return maxP + 1;
    }
    s.commits.forEach((c) => getRow(c.id));

    s.commits.forEach((c) => {
      const col = owner[c.id] ?? 0;
      const branch = s.branches[col] ?? s.branches[0];
      pos[c.id] = {
        x: PAD_X + col * X_GAP,
        y: PAD_Y + row[c.id] * Y_GAP,
        col,
        color: branch.color,
      };
    });

    return pos;
  }, []);

  const pos = layout(state);

  // ─── Pan ────────────────────────────────────

  const onDown = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if ((e.target as HTMLElement).closest("[data-node]")) return;
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    },
    [pan],
  );
  const onMove = useCallback(
    (e: ReactPointerEvent<SVGSVGElement>) => {
      if (!isPanning) return;
      setPan({
        x: panStart.current.px + (e.clientX - panStart.current.x),
        y: panStart.current.py + (e.clientY - panStart.current.y),
      });
    },
    [isPanning],
  );
  const onUp = useCallback(() => setIsPanning(false), []);

  useEffect(() => {
    const h = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onExit(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onExit]);

  // ─── Derived ────────────────────────────────

  const headBranch = state.branches.find((b) => b.name === state.head);
  const otherBranches = state.branches.filter((b) => b.name !== state.head);

  const mergeSourceBranch = mergeSource
    ? state.branches.find((b) => b.name === mergeSource)
    : null;

  return (
    <div className="flex flex-col h-full bg-white border border-neutral-200 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between pl-[18px] pr-4 h-[38px] border-b border-neutral-100 bg-neutral-50/80 select-none">
        <div className="flex items-center gap-3">
          <div className="flex gap-2 items-center">
            <button
              onClick={onExit}
              aria-label="Close"
              className="w-3 h-3 rounded-full bg-[#ddd] hover:bg-[#ff5f57] transition-colors duration-150 cursor-pointer flex-shrink-0"
            />
            <div className="w-3 h-3 rounded-full bg-[#ddd] hover:bg-[#febc2e] transition-colors duration-150 flex-shrink-0" />
            <div className="w-3 h-3 rounded-full bg-[#ddd] hover:bg-[#28c840] transition-colors duration-150 flex-shrink-0" />
          </div>
          <span className="text-[11px] text-neutral-300 tracking-[0.2em]">
            ts_git &mdash; interactive
          </span>
        </div>
        <button
          onClick={onExit}
          className="text-[10px] text-neutral-300 hover:text-neutral-600 transition-colors px-2 py-1 rounded hover:bg-neutral-100"
        >
          esc to exit
        </button>
      </div>

      {/* Toolbar */}
      <div className="border-b border-neutral-100 bg-white select-none">
        {/* HEAD indicator row */}
        <div className="flex items-center gap-1.5 px-5 pt-2 pb-1 text-[11px] text-neutral-300">
          <span className="text-neutral-400 text-[10px] font-medium">HEAD</span>
          <span className="text-neutral-200">&rarr;</span>
          <span
            className="font-medium px-2 py-0.5 rounded-md text-[10px]"
            style={{ backgroundColor: `${headBranch?.color}10`, color: headBranch?.color }}
          >
            {state.head}
          </span>
        </div>

        {/* Actions row */}
        <div className="flex items-center gap-2 px-5 pb-2.5 pt-1">
          <ActionBtn onClick={doCommit} color={headBranch?.color}>
            ts_git commit
          </ActionBtn>
          <ActionBtn onClick={doBranch}>ts_git branch</ActionBtn>

          <div className="w-px h-5 bg-neutral-100 mx-1" />

          {/* Branch pills */}
          <div className="flex items-center gap-1.5">
            {state.branches.map((b) => {
              const isActive = b.name === state.head;
              return (
                <button
                  key={b.name}
                  onClick={() => doCheckout(b.name)}
                  aria-pressed={isActive}
                  className="text-[11px] h-[26px] px-3 rounded-full border transition-all duration-150 font-medium leading-none flex items-center cursor-pointer"
                  style={
                    isActive
                      ? { backgroundColor: b.color, borderColor: b.color, color: "#fff" }
                      : { borderColor: "#e0e0e0", color: "#999", backgroundColor: "#fff" }
                  }
                >
                  {b.name}
                </button>
              );
            })}
          </div>

          <div className="w-px h-5 bg-neutral-100 mx-1" />

          {/* Merge: dropdown + button */}
          {otherBranches.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <Select
                aria-label="Branch to merge"
                selectedKey={mergeSource}
                onSelectionChange={(key) => setMergeSource(key as string)}
              >
                <Button className="merge-select-trigger text-[11px] h-[26px] px-2.5 rounded-md border border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 transition-all duration-150 flex items-center gap-1.5 outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 cursor-pointer">
                  {mergeSourceBranch && (
                    <span
                      className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: mergeSourceBranch.color }}
                    />
                  )}
                  <SelectValue className="flex items-center">
                    {({ isPlaceholder }) =>
                      isPlaceholder ? (
                        <span className="text-neutral-400">merge from&hellip;</span>
                      ) : (
                        <span>{mergeSource}</span>
                      )
                    }
                  </SelectValue>
                  <span className="text-[9px] text-neutral-300 ml-0.5">&#9662;</span>
                </Button>
                <Popover className="merge-popover bg-white border border-neutral-200 rounded-lg shadow-lg py-1 min-w-[140px] outline-none entering:animate-in entering:fade-in exiting:animate-out exiting:fade-out">
                  <ListBox className="outline-none">
                    {otherBranches.map((b) => (
                      <ListBoxItem
                        key={b.name}
                        id={b.name}
                        className="text-[11px] px-3 py-1.5 cursor-pointer outline-none hover:bg-neutral-50 focus:bg-neutral-50 text-neutral-600 flex items-center gap-2 transition-colors"
                      >
                        <span
                          className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                          style={{ backgroundColor: b.color }}
                        />
                        {b.name}
                      </ListBoxItem>
                    ))}
                  </ListBox>
                </Popover>
              </Select>

              <ActionBtn
                onClick={doMerge}
                disabled={!mergeSource || mergeSource === state.head}
                color={mergeSourceBranch?.color}
              >
                ts_git merge
              </ActionBtn>
            </div>
          ) : (
            <ActionBtn onClick={doMerge} disabled>
              ts_git merge
            </ActionBtn>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Graph */}
        <div className="flex-1 overflow-hidden relative bg-[#fafafa]">
          <svg
            className="w-full h-full"
            style={{ cursor: isPanning ? "grabbing" : "grab" }}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerLeave={onUp}
          >
            <g transform={`translate(${pan.x}, ${pan.y})`}>
              {/* Edges */}
              {state.commits.map((c) => {
                const p = pos[c.id];
                if (!p) return null;
                const edges: React.ReactNode[] = [];
                if (c.parent && pos[c.parent]) {
                  const pp = pos[c.parent];
                  edges.push(
                    <path
                      key={`${c.id}-p-${animKey}`}
                      d={bezierEdge(pp, p)}
                      fill="none"
                      stroke={p.color}
                      strokeWidth={2.5}
                      strokeOpacity={0.2}
                      className="animate-edge"
                    />,
                  );
                }
                if (c.secondParent && pos[c.secondParent]) {
                  const sp = pos[c.secondParent];
                  edges.push(
                    <path
                      key={`${c.id}-sp-${animKey}`}
                      d={bezierEdge(sp, p)}
                      fill="none"
                      stroke={sp.color}
                      strokeWidth={2}
                      strokeOpacity={0.25}
                      strokeDasharray="6 4"
                      className="animate-edge"
                    />,
                  );
                }
                return edges;
              })}

              {/* Nodes */}
              {state.commits.map((c) => {
                const p = pos[c.id];
                if (!p) return null;
                const isHead = state.branches.some(
                  (b) => b.name === state.head && b.commitId === c.id,
                );
                const isMerge = !!c.secondParent;
                return (
                  <g
                    key={`${c.id}-${animKey}`}
                    className="graph-node animate-node"
                    data-node
                    style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                  >
                    {isHead && (
                      <circle
                        cx={p.x} cy={p.y} r={NODE_R + 6}
                        fill="none" stroke={p.color}
                        strokeWidth={1.5} strokeOpacity={0.12}
                      />
                    )}
                    <circle
                      cx={p.x} cy={p.y} r={NODE_R}
                      fill={isHead ? p.color : "#fff"}
                      stroke={p.color}
                      strokeWidth={isHead ? 3 : 2}
                    />
                    <text
                      x={p.x} y={p.y + 1}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={8} fontFamily="var(--font-mono), monospace"
                      fontWeight={600}
                      fill={isHead ? "#fff" : p.color}
                      style={{ userSelect: "none", pointerEvents: "none" }}
                    >
                      {c.hash.slice(0, 5)}
                    </text>
                    <text
                      x={p.x + NODE_R + 10} y={p.y + 1}
                      dominantBaseline="middle"
                      fontSize={11} fontFamily="var(--font-mono), monospace"
                      fill={isMerge ? "#aaa" : "#777"}
                      fontStyle={isMerge ? "italic" : "normal"}
                      style={{ userSelect: "none", pointerEvents: "none" }}
                    >
                      {c.message.length > 22 ? c.message.slice(0, 22) + "..." : c.message}
                    </text>
                  </g>
                );
              })}

              {/* Branch labels */}
              {state.branches.map((b) => {
                const p = pos[b.commitId];
                if (!p) return null;
                const isHead = b.name === state.head;
                const labelW = b.name.length * 7.5 + 16;
                return (
                  <g key={`label-${b.name}-${animKey}`} className="animate-label" data-node>
                    <rect
                      x={p.x - labelW / 2} y={p.y - NODE_R - 26}
                      width={labelW} height={18} rx={9}
                      fill={isHead ? b.color : "#fff"}
                      stroke={b.color}
                      strokeWidth={isHead ? 0 : 1.5}
                    />
                    <text
                      x={p.x} y={p.y - NODE_R - 14}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={10} fontFamily="var(--font-mono), monospace"
                      fontWeight={600}
                      fill={isHead ? "#fff" : b.color}
                      style={{ userSelect: "none", pointerEvents: "none" }}
                    >
                      {b.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          <div className="absolute bottom-3 left-4 text-[10px] text-neutral-300 select-none">
            drag to pan
          </div>
        </div>

        {/* Right panel — tutorial + log */}
        <div className="w-52 shrink-0 border-l border-neutral-100 bg-white flex flex-col overflow-hidden select-none">
          {/* Tutorial — shows all content, shrinks only if log needs room */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
            {TUTORIAL_STEPS.map((section, si) => (
              <div key={si} className={si > 0 ? "mt-3" : ""}>
                <div className="text-[9px] uppercase tracking-widest text-neutral-300 font-medium mb-1.5">
                  {section.title}
                </div>
                <div className="flex flex-col gap-1">
                  {section.steps.map((step, i) => (
                    <div key={i} className="text-[10px] leading-[1.5] text-neutral-400">
                      <span>{step.label} </span>
                      {step.action && (
                        <span className="inline px-1 py-0.5 rounded bg-neutral-100 text-neutral-600 text-[9px] font-medium whitespace-nowrap">
                          {step.action}
                        </span>
                      )}
                      {step.desc && <span> {step.desc}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-3">
              <button
                onClick={doReset}
                className="action-btn text-[9px] py-1 px-2 rounded border border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-600 transition-all duration-200 cursor-pointer"
              >
                reset
              </button>
            </div>
          </div>

          {/* Log — scrollable, guaranteed height */}
          <div className="h-[120px] shrink-0 border-t border-neutral-100 px-4 py-2.5 overflow-y-auto">
            <div className="text-[9px] uppercase tracking-widest text-neutral-300 font-medium mb-1">
              log
            </div>
            <div className="flex flex-col-reverse gap-0.5">
              {log.slice(-20).reverse().map((entry, i) => (
                <div
                  key={i}
                  className="text-[9px] leading-[14px] text-neutral-400 truncate"
                  style={{ opacity: Math.max(0.3, 1 - i * 0.12) }}
                >
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function bezierEdge(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  if (from.x === to.x) {
    return `M${from.x},${from.y} L${to.x},${to.y}`;
  }
  const midY = from.y + (to.y - from.y) * 0.4;
  return `M${from.x},${from.y} C${from.x},${midY} ${to.x},${midY} ${to.x},${to.y}`;
}

function ActionBtn({
  onClick,
  disabled,
  children,
  color,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`action-btn text-[11px] h-[28px] px-3 rounded-md border transition-all duration-200 flex items-center ${
        disabled
          ? "border-neutral-100 text-neutral-300 cursor-not-allowed"
          : "border-neutral-200 text-neutral-600 hover:text-neutral-900 cursor-pointer"
      }`}
      style={
        !disabled && color
          ? { borderColor: `${color}30`, color }
          : undefined
      }
    >
      {children}
    </button>
  );
}
