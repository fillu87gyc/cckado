import fs from 'node:fs';
import { claudeConfigPath } from './paths.mjs';

// Parse ~/.claude.json for the project list + macro indices (F12 Project
// Selector). Returns a small, UI-friendly shape; tolerant of a missing file.
export function readConfig() {
  let json = {};
  try {
    json = JSON.parse(fs.readFileSync(claudeConfigPath(), 'utf8'));
  } catch {
    return { projects: [] };
  }
  const projects = Object.entries(json.projects || {}).map(([path, cfg]) => ({
    path,
    name: path.split('/').filter(Boolean).pop() || path,
    allowedTools: (cfg && cfg.allowedTools) || [],
    mcpServers: cfg && cfg.mcpServers ? Object.keys(cfg.mcpServers) : [],
  }));
  return {
    projects,
    userId: json.userID || null,
    numStartups: json.numStartups || 0,
  };
}
