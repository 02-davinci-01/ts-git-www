export type OutputLine =
  | { type: "text" | "bold" | "muted" | "accent" | "prompt" | "ascii" | "title" | "highlight" | "divider"; text: string }
  | { type: "link"; text: string; href: string }
  | { type: "command"; text: string; cmd: string; mobileHidden?: boolean; alt?: boolean };

const COMMANDS: Record<string, () => OutputLine[]> = {
  help: () => [
    { type: "bold", text: "  available commands:" },
    { type: "text", text: "" },
    { type: "command", text: "  ts_git help           show this help message", cmd: "help", alt: true },
    { type: "command", text: "  ts_git about          the story behind 02_git", cmd: "about" },
    { type: "command", text: "  ts_git commands       list all CLI commands", cmd: "commands", alt: true },
    { type: "command", text: "  ts_git repo           github & npm", cmd: "repo" },
    { type: "command", text: "  ts_git resources      references and inspiration", cmd: "resources", alt: true },
    { type: "command", text: "  ts_git interactive    launch interactive visualizer", cmd: "interactive", mobileHidden: true },
    { type: "command", text: "  ts_git whoami         who made this?", cmd: "whoami", alt: true },
    { type: "command", text: "  ts_git clear          clear the terminal", cmd: "clear" },
  ],

  about: () => [
    { type: "text", text: "" },
    { type: "text", text: "  before agents invaded my ide, git was the magician" },
    { type: "text", text: "  that miraculously altered code with a command." },
    { type: "text", text: "" },
    { type: "text", text: "  a token of reverence to one of my favorite tech :)" },
    { type: "text", text: "" },
  ],

  whoami: () => [
    { type: "text", text: "" },
    { type: "bold", text: "  the divine hermit :p" },
    { type: "text", text: "" },
  ],

  commands: () => [
    { type: "bold", text: "  ts_git CLI commands:" },
    { type: "text", text: "" },
    { type: "highlight", text: "  init                    initialize a new repository" },
    { type: "accent", text: "  add <path>              stage a file (or '.' for all)" },
    { type: "highlight", text: '  commit -m "msg"         record changes with a message' },
    { type: "accent", text: "  log                     show commit history" },
    { type: "highlight", text: "  status                  show working tree status" },
    { type: "accent", text: "  branch <name>           create a new branch" },
    { type: "highlight", text: "  checkout <name>         switch to a branch" },
    { type: "accent", text: '  merge <branch> -m "m"   merge a branch' },
    { type: "highlight", text: "  c-merge <branch>        check if merge is clean" },
    { type: "accent", text: "  current-branch          show current branch name" },
  ],

  repo: () => [
    { type: "text", text: "" },
    { type: "bold", text: "  install:" },
    { type: "highlight", text: "  npm i -g 02_git" },
    { type: "text", text: "" },
    { type: "text", text: "  github:" },
    { type: "link", text: "github.com/02-davinci-01/ts_git", href: "https://github.com/02-davinci-01/ts_git" },
    { type: "text", text: "  npm:" },
    { type: "link", text: "npmjs.com/package/02_git", href: "https://www.npmjs.com/package/02_git" },
  ],

  resources: () => [
    { type: "bold", text: "  references and inspiration:" },
    { type: "text", text: "" },
    { type: "text", text: "  · gitlet — a git implementation in javascript" },
    { type: "link", text: "maryrosecook.com/blog/post/introducing-gitlet", href: "https://maryrosecook.com/blog/post/introducing-gitlet" },
    { type: "text", text: "" },
    { type: "text", text: "  · git from the inside out" },
    { type: "link", text: "maryrosecook.com/blog/post/git-from-the-inside-out", href: "https://maryrosecook.com/blog/post/git-from-the-inside-out" },
    { type: "text", text: "" },
    { type: "text", text: "  · git internals — pro git book" },
    { type: "link", text: "git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain", href: "https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain" },
  ],
};

export function handleCommand(input: string): OutputLine[] {
  const trimmed = input.trim().toLowerCase();

  if (!trimmed) return [];

  const handler = COMMANDS[trimmed];
  if (handler) return handler();

  return [
    { type: "muted", text: `  command not found: ${trimmed}` },
    { type: "muted", text: "  type 'ts_git help' for available commands" },
  ];
}
