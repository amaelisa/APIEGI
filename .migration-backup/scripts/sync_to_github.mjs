#!/usr/bin/env node
/**
 * Synchronise les fichiers locaux vers GitHub (amaelisa/APIEGI)
 * Usage: node scripts/sync_to_github.mjs [fichiers...]
 *
 * Mapping des chemins locaux → GitHub :
 *   artifacts/assistant-gi-mobile/  →  mobile/
 *   artifacts/assistant-gi/         →  frontend-replit/
 *
 * Sans argument : synchronise TOUS les fichiers mobiles.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const TOKEN = process.env.GITHUB_TOKEN;
const REPO = "amaelisa/APIEGI";
const BASE = "https://api.github.com";
const BRANCH = "main";

if (!TOKEN) {
  console.error("❌ GITHUB_TOKEN manquant");
  process.exit(1);
}

const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: "application/vnd.github.v3+json",
  "Content-Type": "application/json",
  "User-Agent": "replit-sync",
};

/** Mappe un chemin local vers son chemin GitHub */
function toGithubPath(localPath) {
  const p = localPath.replace(/\\/g, "/");
  if (p.startsWith("artifacts/assistant-gi-mobile/")) {
    return p.replace("artifacts/assistant-gi-mobile/", "mobile/");
  }
  if (p.startsWith("artifacts/assistant-gi/")) {
    return p.replace("artifacts/assistant-gi/", "frontend-replit/");
  }
  return p;
}

/** Récupère le SHA d'un fichier existant sur GitHub (null si absent) */
async function getFileSha(githubPath) {
  const url = `${BASE}/repos/${REPO}/contents/${encodeURIComponent(githubPath)}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: HEADERS });
  if (res.status === 200) {
    const data = await res.json();
    return data.sha;
  }
  return null;
}

/** Pousse un fichier vers GitHub via l'API Contents */
async function pushFile(localPath, message) {
  const githubPath = toGithubPath(localPath);
  const content = readFileSync(localPath).toString("base64");
  const sha = await getFileSha(githubPath);

  const body = {
    message: message || `sync: ${githubPath}`,
    content,
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  };

  const url = `${BASE}/repos/${REPO}/contents/${encodeURIComponent(githubPath)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: HEADERS,
    body: JSON.stringify(body),
  });

  if (res.status === 200 || res.status === 201) {
    const action = sha ? "mis à jour" : "créé";
    console.log(`✅ ${action}: ${githubPath}`);
    return true;
  } else {
    const data = await res.json();
    console.error(`❌ Erreur sur ${githubPath}: ${data.message}`);
    return false;
  }
}

/** Liste récursivement tous les fichiers d'un dossier */
function listFiles(dir, files = []) {
  const IGNORE = ["node_modules", ".expo", "android", "ios", ".git", "dist", "build", ".turbo"];
  for (const entry of readdirSync(dir)) {
    if (IGNORE.includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      listFiles(full, files);
    } else {
      files.push(full.replace(/\\/g, "/"));
    }
  }
  return files;
}

// --- Main ---
const args = process.argv.slice(2);
const filesToPush = args.length > 0
  ? args
  : listFiles("artifacts/assistant-gi-mobile");

console.log(`\n📤 Synchronisation vers GitHub (${REPO})`);
console.log(`   ${filesToPush.length} fichier(s) à pousser...\n`);

let ok = 0, fail = 0;
for (const file of filesToPush) {
  const success = await pushFile(file);
  success ? ok++ : fail++;
  // Petite pause pour éviter le rate limiting
  await new Promise(r => setTimeout(r, 300));
}

console.log(`\n📊 Résultat : ${ok} réussi(s), ${fail} erreur(s)`);
if (ok > 0) {
  console.log(`🔗 https://github.com/${REPO}/tree/${BRANCH}/mobile`);
}
