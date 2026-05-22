/* =====================================================================
   Script de build : convertit les fichiers Decap (Markdown) en JSON.
   Sans dépendance externe — parse YAML frontmatter directement.
   Exécuté automatiquement par Netlify à chaque mise à jour.
   ===================================================================== */

const fs = require('fs');
const path = require('path');

const SRC = {
  extracts: '_data/extracts',
  films: '_data/films',
  playlists: '_data/playlists',
};

const OUT_DIR = 'assets/data';

// --- Parseur YAML minimal (suffisant pour Decap frontmatter) ---
function parseValue(raw) {
  raw = raw.trim();
  if (raw === '' || raw === 'null' || raw === '~') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  // Nombre
  if (/^-?\d+$/.test(raw)) return parseInt(raw, 10);
  if (/^-?\d+\.\d+$/.test(raw)) return parseFloat(raw);
  // Chaîne entre guillemets
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    return raw.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
  }
  // Date ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) {
    return raw;
  }
  return raw;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return { data: {}, body: content };

  const yaml = match[1];
  const body = content.slice(match[0].length).trim();
  const data = {};
  const lines = yaml.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || line.trim().startsWith('#')) { i++; continue; }

    // Liste : key:\n  - val1\n  - val2
    const listMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*$/);
    if (listMatch) {
      const key = listMatch[1];
      const items = [];
      i++;
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        items.push(parseValue(lines[i].replace(/^\s+-\s+/, '')));
        i++;
      }
      if (items.length > 0) {
        data[key] = items;
        continue;
      }
      data[key] = null;
      continue;
    }

    // Clé-valeur simple
    const kvMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)$/);
    if (kvMatch) {
      data[kvMatch[1]] = parseValue(kvMatch[2]);
    }
    i++;
  }

  return { data, body };
}

function readCollection(dir) {
  const fullDir = path.join(__dirname, dir);
  if (!fs.existsSync(fullDir)) {
    console.log(`  → Dossier ${dir} absent, collection vide.`);
    return [];
  }
  const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.md'));
  return files.map(file => {
    const content = fs.readFileSync(path.join(fullDir, file), 'utf-8');
    const { data, body } = parseFrontmatter(content);
    if (body) data._body = body;
    return data;
  });
}

function writeJson(name, data) {
  const outDir = path.join(__dirname, OUT_DIR);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${name}.json`);
  fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
  console.log(`  ✓ ${OUT_DIR}/${name}.json (${data.length} entrées)`);
}

console.log('🔨 Build : conversion des données Decap → JSON');

for (const [name, dir] of Object.entries(SRC)) {
  const data = readCollection(dir);
  writeJson(name, data);
}

console.log('✅ Build terminé.\n');
