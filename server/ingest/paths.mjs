import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

// Resolve the Claude Code data locations. Both are overridable so we can point
// the server at fixtures (or a different home) without depending on which user
// the process runs under.
export function claudeHome() {
  return process.env.CLAUDE_HOME || path.join(os.homedir(), '.claude');
}

export function claudeConfigPath() {
  return process.env.CLAUDE_CONFIG || path.join(os.homedir(), '.claude.json');
}

export function projectsDir() {
  return path.join(claudeHome(), 'projects');
}

// Claude encodes a project's absolute path into a folder name by replacing the
// path separators (and any non [A-Za-z0-9] char) with '-'. We can't perfectly
// invert that (a literal '-' is ambiguous), so we prefer reading the real cwd
// out of the JSONL records and keep this only for listing/lookup.
export function encodeProjectPath(p) {
  return p.replace(/[^A-Za-z0-9]/g, '-');
}

// List project folders under ~/.claude/projects, each with its session files.
export function listProjects() {
  const dir = projectsDir();
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => {
      const folder = path.join(dir, e.name);
      let files = [];
      try {
        files = fs
          .readdirSync(folder)
          .filter((f) => f.endsWith('.jsonl'))
          .map((f) => path.join(folder, f));
      } catch {
        files = [];
      }
      return { encoded: e.name, dir: folder, sessionFiles: files };
    })
    .filter((p) => p.sessionFiles.length > 0);
}
