"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { handleCommand, type OutputLine } from "./commands";
import { InteractiveMode } from "./InteractiveMode";

const PROMPT_PATH = "~/projects/ts_git";
const PREFIX = "ts_git";

const WELCOME: OutputLine[] = [
  { type: "text", text: "" },
  { type: "title", text: " ts_git" },
  { type: "text", text: "" },
  { type: "muted", text: " version control, from scratch." },
  { type: "muted", text: " written in typescript. v0.1.0" },
  { type: "text", text: "" },
  { type: "divider", text: "" },
  { type: "text", text: "" },
  { type: "command", text: " $  ts_git help              see what's possible", cmd: "help" },
  { type: "command", text: " $  ts_git interactive        explore git visually", cmd: "interactive", mobileHidden: true },
  { type: "command", text: " $  ts_git about             the story", cmd: "about" },
  { type: "text", text: "" },
];

const MOBILE_COMMANDS = [
  { label: "help", cmd: "help", desc: "what's possible" },
  { label: "about", cmd: "about", desc: "the story" },
  { label: "whoami", cmd: "whoami", desc: "who made this?" },
  { label: "commands", cmd: "commands", desc: "all CLI commands" },
  { label: "repo", cmd: "repo", desc: "github" },
  { label: "resources", cmd: "resources", desc: "references" },
];

interface HistoryEntry {
  lines: OutputLine[];
}

export function Terminal() {
  const [entries, setEntries] = useState<HistoryEntry[]>([
    { lines: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [, setHistIdx] = useState(-1);
  const [interactive, setInteractive] = useState(false);
  const [typing, setTyping] = useState<{ command: string; index: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [entries, input]);

  useEffect(() => {
    if (!interactive && !typing) inputRef.current?.focus();
  }, [interactive, typing]);

  const focusInput = useCallback(() => {
    if (!interactive && !typing) inputRef.current?.focus();
  }, [interactive, typing]);

  const execute = useCallback((cmd: string) => {
    const trimmed = cmd.trim();
    const normalized = trimmed.startsWith(`${PREFIX} `)
      ? trimmed.slice(PREFIX.length + 1).trim()
      : trimmed;

    const promptLine: OutputLine = {
      type: "prompt",
      text: `${PROMPT_PATH} $ ${PREFIX} ${normalized}`,
    };

    if (normalized === "clear") {
      setEntries([]);
      setInput("");
      return;
    }

    if (normalized === "interactive") {
      setEntries((h) => [
        ...h,
        { lines: [promptLine, { type: "text", text: "" }], },
      ]);
      setInput("");
      setInteractive(true);
      return;
    }

    const output = handleCommand(normalized);
    setEntries((h) => [
      ...h,
      { lines: [promptLine, ...output, { type: "text", text: "" }], },
    ]);
    setInput("");

    if (trimmed) {
      setCmdHistory((prev) => [trimmed, ...prev]);
      setHistIdx(-1);
    }
  }, []);

  useEffect(() => {
    if (!typing) return;
    if (typing.index >= typing.command.length) {
      const cmd = typing.command;
      const id = setTimeout(() => {
        setTyping(null);
        setInput("");
        execute(cmd);
      }, 0);
      return () => clearTimeout(id);
    }
    const timer = setTimeout(() => {
      setTyping((t) => (t ? { ...t, index: t.index + 1 } : null));
      setInput(typing.command.slice(0, typing.index + 1));
    }, 45);
    return () => clearTimeout(timer);
  }, [typing, execute]);

  const startTyping = useCallback(
    (cmd: string) => {
      if (typing) return;
      if (cmd === "clear") {
        setEntries([]);
        setInput("");
        return;
      }
      setInput("");
      setTyping({ command: cmd, index: 0 });
    },
    [typing],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (typing) return;
      if (e.key === "Enter") {
        execute(input);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHistIdx((idx) => {
          const next = Math.min(idx + 1, cmdHistory.length - 1);
          if (cmdHistory[next]) setInput(cmdHistory[next]);
          return next;
        });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHistIdx((idx) => {
          const next = idx - 1;
          if (next < 0) { setInput(""); return -1; }
          if (cmdHistory[next]) setInput(cmdHistory[next]);
          return next;
        });
      } else if (e.key === "l" && e.ctrlKey) {
        e.preventDefault();
        setEntries([]);
      }
    },
    [input, cmdHistory, execute, typing],
  );

  if (interactive) {
    return (
      <InteractiveMode
        onExit={() => {
          setInteractive(false);
          setEntries((h) => [
            ...h,
            {
              lines: [
                { type: "muted", text: "  exited interactive mode" },
                { type: "text", text: "" },
              ],
              timestamp: Date.now(),
            },
          ]);
        }}
      />
    );
  }

  return (
    <div
      className="flex flex-col h-full bg-white sm:border sm:border-neutral-200 sm:rounded-lg sm:shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden"
      onClick={focusInput}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2.5 pl-[18px] pr-4 h-[38px] border-b border-neutral-100 bg-neutral-50/80 select-none shrink-0">
        <div className="hidden sm:flex gap-2 items-center">
          <div className="w-3 h-3 rounded-full bg-[#ddd] hover:bg-[#ff5f57] transition-colors duration-150 flex-shrink-0" />
          <div className="w-3 h-3 rounded-full bg-[#ddd] hover:bg-[#febc2e] transition-colors duration-150 flex-shrink-0" />
          <div className="w-3 h-3 rounded-full bg-[#ddd] hover:bg-[#28c840] transition-colors duration-150 flex-shrink-0" />
        </div>
        <span className="flex-1 text-center text-[11px] text-neutral-300 tracking-[0.15em] truncate">
          visitor : {PROMPT_PATH}
        </span>
        <div className="hidden sm:block w-[56px] shrink-0" />
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-auto hide-scrollbar sm:show-scrollbar px-4 sm:px-6 py-4 sm:py-5 text-[12px] sm:text-[13px] leading-6"
      >
        {entries.map((entry, ei) =>
          entry.lines.map((line, li) => (
            <Line
              key={`${ei}-${li}`}
              line={line}
              delay={li * 25}
              animate={ei === entries.length - 1}
              onCommand={startTyping}
            />
          )),
        )}

        {/* Input line — desktop */}
        <div className="hidden sm:flex items-center mt-0.5">
          <span className="text-neutral-300 shrink-0 select-none text-[12px]">{PROMPT_PATH} $&nbsp;</span>
          <span className="text-neutral-500 shrink-0 select-none font-medium">{PREFIX}&nbsp;</span>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => { if (!typing) setInput(e.target.value); }}
              onKeyDown={onKeyDown}
              className="w-full bg-transparent outline-none text-[13px] leading-6 caret-transparent"
              spellCheck={false}
              autoComplete="off"
              autoFocus
              readOnly={!!typing}
            />
            <div
              className="absolute inset-0 flex items-center pointer-events-none text-[13px] leading-6"
              aria-hidden
            >
              <span className="invisible">{input}</span>
              <span className="block-cursor" />
            </div>
          </div>
        </div>

        {/* Prompt display — mobile */}
        <div className="flex sm:hidden items-center mt-0.5">
          <span className="text-neutral-300 shrink-0 select-none text-[11px]">$&nbsp;</span>
          <span className="text-neutral-500 shrink-0 select-none font-medium text-[12px]">{PREFIX}&nbsp;</span>
          <span className="text-[12px] leading-6">{input}</span>
          <span className="block-cursor" />
        </div>
      </div>

      {/* Mobile command grid */}
      <div className="sm:hidden border-t border-neutral-100 select-none shrink-0">
        <div className="grid grid-cols-2 gap-px bg-neutral-100">
          {MOBILE_COMMANDS.map(({ label, cmd, desc }) => (
            <button
              key={cmd}
              onClick={(e) => { e.stopPropagation(); startTyping(cmd); }}
              disabled={!!typing}
              className="mobile-cmd-cell bg-white px-3.5 py-2.5 text-left active:bg-neutral-50 transition-colors duration-150 disabled:opacity-40"
            >
              <div className="text-[11px] font-medium text-neutral-600">{label}</div>
              <div className="text-[9px] text-neutral-300 mt-0.5">{desc}</div>
            </button>
          ))}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); startTyping("clear"); }}
          disabled={!!typing}
          className="mobile-cmd-cell w-full bg-white border-t border-neutral-100 px-3.5 py-2 text-center text-[10px] text-neutral-400 active:bg-neutral-50 transition-colors disabled:opacity-40"
        >
          clear
        </button>
      </div>
    </div>
  );
}

function Line({
  line,
  delay,
  animate,
  onCommand,
}: {
  line: OutputLine;
  delay: number;
  animate: boolean;
  onCommand?: (cmd: string) => void;
}) {
  const animStyle = animate
    ? { animationDelay: `${delay}ms`, opacity: 0 }
    : undefined;
  const animClass = animate ? "animate-line" : "";

  switch (line.type) {
    case "prompt":
      return (
        <div
          className={`text-neutral-400 whitespace-pre terminal-line ${animClass}`}
          style={animStyle}
        >
          {line.text}
        </div>
      );
    case "text":
      return (
        <div
          className={`whitespace-pre text-neutral-300 ${animClass}`}
          style={{ ...animStyle, minHeight: "1.5rem" }}
        >
          {line.text || ""}
        </div>
      );
    case "title":
      return (
        <div
          className={`text-2xl sm:text-3xl font-bold whitespace-pre tracking-tight text-neutral-900 ${animClass}`}
          style={animStyle}
        >
          {line.text}
        </div>
      );
    case "bold":
      return (
        <div
          className={`font-semibold whitespace-pre terminal-line text-neutral-800 ${animClass}`}
          style={animStyle}
        >
          {line.text}
        </div>
      );
    case "muted":
      return (
        <div
          className={`text-neutral-400 whitespace-pre terminal-line ${animClass}`}
          style={animStyle}
        >
          {line.text}
        </div>
      );
    case "divider":
      return (
        <div
          className={`my-1 ${animClass}`}
          style={animStyle}
        >
          <div className="h-px bg-neutral-100" />
        </div>
      );
    case "accent":
      return (
        <div
          className={`text-neutral-500 whitespace-pre terminal-line ${animClass}`}
          style={animStyle}
        >
          {line.text}
        </div>
      );
    case "command":
      return (
        <div
          className={`text-neutral-500 whitespace-pre terminal-line cursor-pointer hover:text-neutral-700 hover:bg-neutral-50 transition-colors duration-150 ${animClass} ${line.mobileHidden ? "hidden sm:block" : ""}`}
          style={animStyle}
          onClick={(e) => { e.stopPropagation(); onCommand?.(line.cmd); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onCommand?.(line.cmd); }}
        >
          {line.text}
        </div>
      );
    case "highlight":
      return (
        <div
          className={`whitespace-pre terminal-line bg-neutral-50 font-medium text-neutral-700 ${animClass}`}
          style={animStyle}
        >
          {line.text}
        </div>
      );
    case "ascii":
      return (
        <div
          className={`text-neutral-800 whitespace-pre leading-[1.15] font-medium ${animClass}`}
          style={animStyle}
        >
          {line.text}
        </div>
      );
    case "link":
      return (
        <div
          className={`whitespace-pre terminal-line terminal-line-link group/link ${animClass}`}
          style={animStyle}
        >
          {"  "}
          <a
            href={line.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-neutral-500 underline underline-offset-4 decoration-neutral-200 hover:decoration-neutral-500 hover:text-neutral-900 transition-all duration-200"
          >
            {line.text}
          </a>
          <span className="text-neutral-300 ml-1.5 text-[11px] opacity-0 group-hover/link:opacity-100 transition-opacity">&#8599;</span>
        </div>
      );
    default:
      return (
        <div className={`whitespace-pre ${animClass}`} style={animStyle}>
          {(line as { text: string }).text}
        </div>
      );
  }
}
