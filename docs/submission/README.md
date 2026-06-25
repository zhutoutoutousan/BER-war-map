# IDI S26 — Final submission materials

## Team presentation (2–4 pages PDF)

```bash
node docs/presentation/final-submission/copy-figures.mjs
cd docs/presentation/final-submission
pdflatex idi-s26-final-submission.tex
pdflatex idi-s26-final-submission.tex
```

Output: `docs/presentation/final-submission/idi-s26-final-submission.pdf` (~3 pages)  
Upload to course **Final PPT** folder.

Optional — refresh screenshots first:

```bash
npm run dev
$env:PW_REUSE_SERVER="1"; npm run test:ux
node docs/presentation/final-submission/copy-figures.mjs
```

Live demo: https://ber-board-room.vercel.app/

## Individual reflection — Yushu Qin

```bash
cd docs/submission
pdflatex yushu-qin-reflection.tex
pdflatex yushu-qin-reflection.tex
```

Output: `docs/submission/yushu-qin-reflection.pdf` (~3 pages)

## Screenshots source

Playwright spec: `e2e/stakeholder-ux.spec.ts`  
Raw shots: `e2e/screenshots/`  
Copied for LaTeX: `docs/presentation/final-submission/figures/`
