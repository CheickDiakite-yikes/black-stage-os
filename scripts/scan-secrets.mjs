import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const patterns = [
  ["GitHub token", /gh[opsu]_[A-Za-z0-9_]{20,}/g],
  ["GitHub fine-grained token", /github_pat_[A-Za-z0-9_]{20,}/g],
  ["OpenAI-style key", /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g],
  ["Google API key", /AIza[0-9A-Za-z_-]{20,}/g],
  ["AWS access key id", /AKIA[0-9A-Z]{16}/g],
  ["Slack token", /xox[baprs]-[A-Za-z0-9-]{10,}/g],
  ["Private key block", /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  [
    "Credential assignment",
    /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{12,}["']/gi
  ]
];

const files = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const findings = [];

for (const file of files) {
  const content = readFileSync(file);

  if (content.includes(0)) {
    continue;
  }

  const text = content.toString("utf8");

  for (const [label, pattern] of patterns) {
    pattern.lastIndex = 0;

    for (const match of text.matchAll(pattern)) {
      const line = text.slice(0, match.index).split("\n").length;
      findings.push(`${file}:${line} ${label}`);
    }
  }
}

if (findings.length > 0) {
  console.error("Potential secrets found:");
  console.error(findings.join("\n"));
  process.exit(1);
}

console.log(`No high-confidence secrets found across ${files.length} tracked files.`);
