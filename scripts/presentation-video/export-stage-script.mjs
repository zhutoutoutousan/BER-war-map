#!/usr/bin/env node
/**
 * Export camera-ready stage script from script.json → Markdown + LaTeX + PDF.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const videoDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "docs", "presentation", "video");
const scriptPath = path.join(videoDir, "script.json");
const slideMapPath = path.join(videoDir, "slide-map.json");

const script = JSON.parse(fs.readFileSync(scriptPath, "utf8"));
const slideMap = JSON.parse(fs.readFileSync(slideMapPath, "utf8"));
const pageById = Object.fromEntries(slideMap.map((e) => [e.id, e.page]));

const names = { tian: "Tian Shao", yi: "Yi Li", qin: "Qin Yushu" };
const speakerNote = {
  tian: "lead — say in English",
  qin: "medium segments",
  yi: "short segments"
};

function texEscape(text) {
  return String(text)
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/([#%&_$~^{}])/g, "\\$1")
    .replace(/\[/g, "{[}")
    .replace(/\]/g, "{]}");
}

function exportMarkdown() {
  const lines = [
    "# BER+ June 12 — camera-ready stage script",
    "",
    "Final presentation narration · subtitles: 中文 · English · Deutsch",
    "",
    "---",
    ""
  ];

  for (const slide of script.slides) {
    const pg = pageById[slide.id];
    const heading = slide.title || slide.id;
    lines.push(`## ${pg ? `${pg}. ` : ""}${heading}`);
    lines.push("");
    for (const seg of slide.segments) {
      lines.push(`**${names[seg.speaker] || seg.speaker}** (${speakerNote[seg.speaker] || "English"})`);
      lines.push("");
      lines.push(`> ${seg.en}`);
      lines.push("");
      lines.push(`- 中文：${seg.zh}`);
      lines.push(`- Deutsch：${seg.de}`);
      lines.push("");
    }
    lines.push("---");
    lines.push("");
  }

  const out = path.join(videoDir, "stage-script.md");
  fs.writeFileSync(out, lines.join("\n"), "utf8");
  return out;
}

function exportLatex() {
  const meta = script.meta;
  const sections = [];

  for (const slide of script.slides) {
    const pg = pageById[slide.id] ?? "?";
    const title = texEscape(slide.title || slide.id);
    const blocks = [];

    for (const seg of slide.segments) {
      const sp = seg.speaker;
      const name = texEscape(names[sp] || sp);
      blocks.push(`
\\begin{speakerblock}{${name}}{${texEscape(speakerNote[sp] || "English")}}
\\begin{englishbox}
${texEscape(seg.en)}
\\end{englishbox}

\\textbf{中文} ${texEscape(seg.zh)}

\\textbf{Deutsch} ${texEscape(seg.de)}
\\end{speakerblock}
`);
    }

    sections.push(`
\\section{${pg}. ${title}}
${blocks.join("\n")}
`);
  }

  const tex = `% BER+ June 12 — camera-ready stage script (generated from script.json)
% Compile: npm run video:script:pdf
\\documentclass[11pt,a4paper]{ctexart}

\\usepackage[a4paper,margin=2.1cm,headheight=15pt]{geometry}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\usepackage{fancyhdr}
\\usepackage{enumitem}
\\usepackage{tcolorbox}
\\tcbuselibrary{skins,breakable}

\\definecolor{berblue}{RGB}{44,95,138}
\\definecolor{berteal}{RGB}{0,128,128}
\\definecolor{bergrey}{RGB}{80,96,112}

\\hypersetup{colorlinks=true,linkcolor=berblue,urlcolor=berteal}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyhead[L]{\\small\\textcolor{bergrey}{BER+ Flughafenregion}}
\\fancyhead[C]{\\small\\textbf{Stage script — 12 June 2026}}
\\fancyhead[R]{\\small\\textcolor{bergrey}{\\thepage\\ / \\pageref{LastPage}}}
\\fancyfoot[C]{\\small\\url{${meta.demoUrl || "https://ber-war-map.vercel.app/"}}}

\\newtcolorbox{englishbox}{
  enhanced,
  breakable,
  colback=berblue!4,
  colframe=berblue!70,
  boxrule=0.5pt,
  arc=2pt,
  left=6pt,right=6pt,top=5pt,bottom=5pt,
  fontupper=\\small
}

\\newenvironment{speakerblock}[2]{%
  \\par\\medskip
  {\\color{berblue}\\textbf{#1}}\\hfill{\\small\\textcolor{bergrey}{#2}}\\par
  \\vspace{0.25em}
}{\\par\\medskip}

\\title{\\textbf{${texEscape(meta.title || "BER+ Coordination Map — June 12 leadership briefing")}}}
\\author{%
  Tian Shao \\quad Yi Li \\quad Qin Yushu\\\\[0.4em]
  \\small Presenters · on-stage language: English · subtitles 中文 · Deutsch
}
\\date{12 June 2026}

\\usepackage{lastpage}

\\begin{document}
\\maketitle
\\thispagestyle{fancy}

\\vspace{-0.5em}
\\noindent\\textbf{Presenters}
\\begin{itemize}[leftmargin=1.4em,itemsep=0.15em]
  \\item \\textbf{Tian Shao} — lead narration
  \\item \\textbf{Qin Yushu} — medium segments
  \\item \\textbf{Yi Li} — short segments
\\end{itemize}

\\vspace{0.4em}
\\noindent\\textbf{Live demo} \\url{${meta.demoUrl || "https://ber-war-map.vercel.app/"}} · ${script.slides.length} sections · camera-ready

\\tableofcontents
\\newpage

${sections.join("\n")}

\\end{document}
`;

  const out = path.join(videoDir, "stage-script.tex");
  fs.writeFileSync(out, tex, "utf8");
  return out;
}

function compilePdf(texFile) {
  const cwd = path.dirname(texFile);
  const base = path.basename(texFile, ".tex");

  const engines = ["xelatex"];
  let lastErr = "";

  for (const engine of engines) {
    for (let pass = 1; pass <= 2; pass++) {
      const r = spawnSync(
        engine,
        ["-interaction=nonstopmode", "-halt-on-error", `${base}.tex`],
        { cwd, encoding: "utf8", stdio: "pipe" }
      );
      if (r.status !== 0) {
        lastErr = r.stderr || r.stdout || `${engine} failed pass ${pass}`;
        break;
      }
      if (pass === 2) {
        const pdf = path.join(cwd, `${base}.pdf`);
        if (fs.existsSync(pdf)) return pdf;
      }
    }
    if (fs.existsSync(path.join(cwd, `${base}.pdf`))) {
      return path.join(cwd, `${base}.pdf`);
    }
  }

  throw new Error(`PDF compile failed:\n${lastErr}`);
}

function main() {
  const wantPdf = process.argv.includes("--pdf") || process.argv.includes("--all");
  const md = exportMarkdown();
  console.log("Wrote", md);

  const tex = exportLatex();
  console.log("Wrote", tex);

  if (wantPdf || process.argv.length <= 2) {
    const pdf = compilePdf(tex);
    console.log("Wrote", pdf);
  } else {
    console.log("Run with --pdf to compile, or: npm run video:script:pdf");
  }
}

main();
