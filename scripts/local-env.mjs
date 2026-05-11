import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";

export function loadLocalEnvFile(options = {}) {
  const repoRoot = resolve(options.repoRoot ?? process.cwd());
  const fileNames = options.fileName
    ? [options.fileName]
    : (options.fileNames ?? [".env", ".env.local"]);
  const envPath =
    fileNames.map((fileName) => resolve(repoRoot, fileName)).find(existsSync) ??
    resolve(repoRoot, fileNames[0] ?? ".env");
  const targetEnv = options.targetEnv ?? process.env;
  const override = options.override === true;

  if (!existsSync(envPath)) {
    return {
      loaded: false,
      envPath: normalizeRelativePath(repoRoot, envPath),
      loadedEnvVars: [],
      skippedEnvVars: []
    };
  }

  const loadedEnvVars = [];
  const skippedEnvVars = [];
  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);

    if (!parsed) {
      continue;
    }

    if (targetEnv[parsed.key] && !override) {
      skippedEnvVars.push(parsed.key);
      continue;
    }

    targetEnv[parsed.key] = parsed.value;
    loadedEnvVars.push(parsed.key);
  }

  return {
    loaded: true,
    envPath: normalizeRelativePath(repoRoot, envPath),
    loadedEnvVars,
    skippedEnvVars
  };
}

export function summarizeLocalEnvLoad(result) {
  return {
    loaded: result.loaded,
    envPath: result.envPath,
    loadedEnvVars: result.loadedEnvVars,
    skippedEnvVars: result.skippedEnvVars
  };
}

function parseEnvLine(line) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return undefined;
  }

  const normalized = trimmed.startsWith("export ")
    ? trimmed.slice("export ".length).trim()
    : trimmed;
  const separatorIndex = normalized.indexOf("=");

  if (separatorIndex <= 0) {
    return undefined;
  }

  const key = normalized.slice(0, separatorIndex).trim();
  const rawValue = normalized.slice(separatorIndex + 1).trim();

  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    return undefined;
  }

  return {
    key,
    value: unquoteEnvValue(rawValue)
  };
}

function unquoteEnvValue(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  const commentIndex = value.search(/\s+#/);

  return commentIndex >= 0 ? value.slice(0, commentIndex).trim() : value;
}

function normalizeRelativePath(repoRoot, path) {
  const relativePath = relative(repoRoot, path);

  return relativePath && !relativePath.startsWith("..") ? relativePath : "[external]";
}
