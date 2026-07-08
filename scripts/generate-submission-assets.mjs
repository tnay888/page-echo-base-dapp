import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import sharp from "sharp";

const root = resolve(new URL("..", import.meta.url).pathname);
const outDir = join(root, "base-submission");
const W = 1284;
const H = 2778;

const c = {
  bg: "#eee1c8",
  paper: "#f8edd8",
  card: "#fff8e9",
  panel: "#fff1d2",
  ink: "#2a2118",
  line: "#493525",
  rust: "#b95d44",
  tan: "#f0c99e",
  green: "#3f7f74",
  blue: "#3d4a63",
  gold: "#d7892f",
};

function esc(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function wrap(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function frame(content) {
  return `
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${c.bg}"/>
    <path d="M0 360H1284M0 720H1284M0 1080H1284M0 1440H1284M0 1800H1284M0 2160H1284M0 2520H1284" stroke="rgba(73,53,37,0.08)" stroke-width="3"/>
    <circle cx="1090" cy="230" r="190" fill="${c.tan}" opacity="0.45"/>
    <circle cx="130" cy="2540" r="230" fill="${c.rust}" opacity="0.22"/>
    ${content}
  </svg>`;
}

function titleBlock(title, subtitle) {
  return `
    <text x="72" y="126" font-family="Courier New, monospace" font-size="32" font-weight="900" fill="#7a5437">PAGE ECHO</text>
    <text x="72" y="238" font-family="Arial, sans-serif" font-size="82" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    <text x="78" y="300" font-family="Arial, sans-serif" font-size="32" font-weight="800" fill="#7a5437">${esc(subtitle)}</text>
  `;
}

function libraryCard(x, y, book, page, mood, note, accent = c.rust) {
  const noteLines = wrap(note, 34).slice(0, 5);
  return `
    <rect x="${x}" y="${y}" width="1060" height="1080" rx="24" fill="${c.paper}" stroke="${c.line}" stroke-width="6"/>
    <rect x="${x}" y="${y}" width="1060" height="106" rx="24" fill="${accent}"/>
    <text x="${x + 54}" y="${y + 70}" font-family="Courier New, monospace" font-size="30" font-weight="900" fill="${c.card}">LIBRARY PAGE CARD</text>
    <text x="${x + 54}" y="${y + 220}" font-family="Arial, sans-serif" font-size="78" font-weight="900" fill="${c.ink}">${esc(book)}</text>
    <rect x="${x + 54}" y="${y + 280}" width="220" height="72" rx="12" fill="${c.line}"/>
    <text x="${x + 164}" y="${y + 328}" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="${c.card}">PAGE ${esc(page)}</text>
    <rect x="${x + 308}" y="${y + 280}" width="230" height="72" rx="12" fill="${c.card}" stroke="${c.line}" stroke-width="4"/>
    <text x="${x + 423}" y="${y + 328}" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="900" fill="${accent}">${esc(mood)}</text>
    <rect x="${x + 54}" y="${y + 430}" width="952" height="330" rx="18" fill="${c.card}" stroke="${c.line}" stroke-width="4"/>
    <text x="${x + 88}" y="${y + 492}" font-family="Courier New, monospace" font-size="24" font-weight="900" fill="#7a5437">READING NOTE</text>
    ${noteLines.map((line, i) => `<text x="${x + 88}" y="${y + 552 + i * 44}" font-family="Arial, sans-serif" font-size="32" font-weight="800" fill="${c.ink}">${esc(line)}</text>`).join("")}
    ${Array.from({ length: 4 }, (_, i) => `<path d="M${x + 54} ${y + 820 + i * 54}H${x + 1006}" stroke="rgba(73,53,37,0.24)" stroke-width="3"/>`).join("")}
    <text x="${x + 88}" y="${y + 1000}" font-family="Courier New, monospace" font-size="24" font-weight="900" fill="#7a5437">READER + TIMESTAMP SAVED ON BASE</text>
    <circle cx="${x + 900}" cy="${y + 218}" r="76" fill="none" stroke="${accent}" stroke-width="8"/>
    <text x="${x + 900}" y="${y + 228}" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" font-weight="900" fill="${accent}">BASE</text>
  `;
}

function feature(x, y, title, body, accent) {
  return `
    <rect x="${x}" y="${y}" width="540" height="220" rx="24" fill="${c.paper}" stroke="${c.line}" stroke-width="5"/>
    <rect x="${x}" y="${y}" width="540" height="14" rx="7" fill="${accent}"/>
    <text x="${x + 34}" y="${y + 80}" font-family="Arial, sans-serif" font-size="38" font-weight="900" fill="${c.ink}">${esc(title)}</text>
    ${wrap(body, 30).slice(0, 3).map((line, i) => `<text x="${x + 34}" y="${y + 132 + i * 34}" font-family="Arial, sans-serif" font-size="27" font-weight="800" fill="#7a5437">${esc(line)}</text>`).join("")}
  `;
}

function screenshot1() {
  return frame(`
    ${titleBlock("Save a page note.", "Book, page, mood, note, wallet, and timestamp on Base.")}
    ${libraryCard(112, 430, "The Invisible Library", "128", "Marked", "A small sentence can turn a whole room. This page felt like a door left open on purpose.", c.rust)}
    ${feature(72, 1630, "Mark a page", "Save the exact spot that mattered.", c.rust)}
    ${feature(672, 1630, "On Base", "Reader wallet and timestamp stay readable.", c.green)}
  `);
}

function screenshot2() {
  return frame(`
    ${titleBlock("Build a reading trail.", "Keep compact notes from books, essays, manuals, or zines.")}
    ${feature(72, 385, "Book + page", "A clean reference for later.", c.gold)}
    ${feature(672, 385, "Mood", "Marked, curious, heavy, or bright.", c.green)}
    ${libraryCard(112, 730, "Field Notes for Builders", "42", "Curious", "The useful part was not the answer. It was the better question hiding underneath it.", c.green)}
  `);
}

function screenshot3() {
  return frame(`
    ${titleBlock("Reload any note.", "Use Note ID to reopen the card and verify the Base transaction.")}
    ${feature(72, 385, "Note ID", "Read saved page notes by number.", c.rust)}
    ${feature(672, 385, "BaseScan", "Open the transaction after saving.", c.blue)}
    ${libraryCard(112, 730, "Quiet Systems", "203", "Heavy", "This paragraph made the whole chapter feel like a warning label for future work.", c.blue)}
  `);
}

function iconSvg() {
  return `
  <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
    <rect width="1024" height="1024" fill="${c.bg}"/>
    <rect x="152" y="112" width="720" height="800" rx="66" fill="${c.paper}" stroke="${c.line}" stroke-width="30"/>
    <rect x="152" y="112" width="720" height="138" rx="66" fill="${c.rust}"/>
    <path d="M320 390H704M320 514H704M320 638H606" stroke="${c.line}" stroke-width="34" stroke-linecap="round"/>
    <path d="M682 110v284l-78-54-78 54V110" fill="${c.tan}" stroke="${c.line}" stroke-width="24"/>
  </svg>`;
}

function thumbnailSvg() {
  return `
  <svg width="1910" height="1000" viewBox="0 0 1910 1000" xmlns="http://www.w3.org/2000/svg">
    <rect width="1910" height="1000" fill="${c.bg}"/>
    <circle cx="1710" cy="130" r="220" fill="${c.tan}" opacity="0.5"/>
    <text x="96" y="170" font-family="Arial, sans-serif" font-size="126" font-weight="900" fill="${c.ink}">Page Echo</text>
    <text x="104" y="250" font-family="Arial, sans-serif" font-size="44" font-weight="800" fill="#7a5437">Save reading notes on Base.</text>
    ${feature(106, 370, "Page marker", "Book, page, mood, note.", c.rust)}
    ${feature(106, 635, "Onchain trail", "Wallet and timestamp saved.", c.green)}
    ${libraryCard(760, 74, "The Invisible Library", "128", "Marked", "A small sentence can turn a whole room. This page felt like a door left open on purpose.", c.rust)}
  </svg>`;
}

async function writePng(name, svg, width = W, height = H) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).png({ compressionLevel: 9 }).toFile(file);
  return file;
}

async function writeJpg(name, svg, width, height) {
  const file = join(outDir, name);
  await sharp(Buffer.from(svg)).resize(width, height).jpeg({ quality: 88, mozjpeg: true }).toFile(file);
  return file;
}

await mkdir(outDir, { recursive: true });

const files = [
  await writeJpg("app-icon.jpg", iconSvg(), 1024, 1024),
  await writeJpg("app-thumbnail.jpg", thumbnailSvg(), 1910, 1000),
  await writePng("screenshot-1.png", screenshot1()),
  await writePng("screenshot-2.png", screenshot2()),
  await writePng("screenshot-3.png", screenshot3()),
];

await writeFile(
  join(outDir, "asset-manifest.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2),
  "utf8",
);

await writeFile(
  join(outDir, "submission-copy.md"),
  [
    "# Page Echo",
    "",
    "App Name: Page Echo",
    "Tagline: Save a page note",
    "Description: Save a reading note with book, page, mood, wallet, and timestamp on Base.",
    "",
    "Domain: https://page-echo.vercel.app",
    "",
    "Assets:",
    "- app-icon.jpg",
    "- app-thumbnail.jpg",
    "- screenshot-1.png",
    "- screenshot-2.png",
    "- screenshot-3.png",
  ].join("\n"),
  "utf8",
);

for (const file of files) console.log(file);
