// Moonlit Lantern Market — the hand-in program for make.fun
// (Node 22, standard library only). It gathers the entry's pieces — the game/
// folder of static files and the screenshots/ renders — into the output
// directory and writes dossier.json, the summary the judge reads, using the
// vendored make.fun library's buildDossier. Run it as:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output; when it is
// unset the program writes to /output, the grader's own directory.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Where this file lives, and where the hand-in goes.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The gate's caps, as the competition states them: the dossier text is capped
// at 163840 UTF-8 bytes; at most 4 screenshots of at most 262144 bytes each;
// game/ holds at most 993 files and directories and 50331648 bytes in all, with
// no path under it longer than 1000 UTF-8 bytes. buildDossier enforces them and
// throws instead of writing a dossier the gate would refuse.
const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function copyTree(sourceDir, targetDir) {
  if (!existsSync(sourceDir)) return;
  mkdirSync(targetDir, { recursive: true });
  cpSync(sourceDir, targetDir, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, dossierCaps));
