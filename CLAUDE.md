# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Classical Cipher Structure Trainer** is an educational web application that teaches the two building blocks of classical cryptography: **Substitution (Mapping)** and **Transposition (Shuffle)**. It treats both keys as permutations (substitution permutes the kinds of letters, transposition permutes positions). It is a teaching tool, not a general encryption/decryption tool.

Client-side only (HTML/CSS/JavaScript). No build step, no dependencies, no network requests.

## Running

- Open `index.html` directly in a browser (`file://` works: the quiz is loaded as a script, not with `fetch`).
- Or serve the folder: `python -m http.server 8000` and open `http://localhost:8000/`.

## Tests

```bash
npm test   # node --test, Node.js 22+, no dependencies
```

GitHub Actions (`.github/workflows/test.yml`) runs `npm test` on push and pull request.

## Architecture

| File | Role |
|------|------|
| `js/structure-core.js` | Pure functions (no DOM): `shiftMap`, `substitute`, `applyOrder`, `invert`, `reverseOrder`, `swapPairs`, `moveIndex`, `randomInt`, `randomPermutation`, `factorial`, `figureLayout`, `curvePath`, `insertionIndex`, `validateQuiz` |
| `js/messages.js` | Japanese UI strings used by `script.js` (`Messages.t(key, params)`). `script.js` must not contain Japanese string literals (tested) |
| `js/quiz-data.js` | 10 quiz questions (`id`, `category`, `prompt`, `choices`, `answer`, `explanation`) |
| `js/catalog.js` | 22 cipher tools of the series shown in the Examples tab (`day`, `slug`, `title` copied from each tool's README YAML, `kind`, `sub`, `name`, `desc`) |
| `js/theme.js` | Loaded in `<head>`; sets `<html data-theme>` from localStorage (`ccst-theme`) before paint |
| `script.js` | DOM: tabs (APG), mapping SVG, shuffle (Pointer Events + keyboard), catalog cards, quiz |
| `style.css` | CSS variables for light and dark themes (dark values appear twice: media query and `[data-theme="dark"]`, must stay identical) |

Files in `js/` are classic scripts: they set a global in the browser and `module.exports` in Node.js. Do not convert them to ES modules (breaks `file://`).

### Conventions

- Substitution key `map`: top letter `i` maps to bottom letter `map[i]`.
- Transposition key `order`: output position `i` takes the original letter `order[i]` ("take-from" direction, same default as Permutation CipherLab, Day095).
- The mapping figure is drawn in SVG viewBox coordinates from `figureLayout(8)`; it never measures the DOM, so it does not wrap or break in hidden tabs.
- Shuffle state is `shuffle.order` only; every interaction changes it and `renderShuffle()` reorders the `<li>` elements and restores focus. Pointer capture is set on the `<ol>`, not on the moving item.
- Random values come from `crypto.getRandomValues` (no `Math.random`).
- Text goes in with `textContent`; no `innerHTML` assignment. No inline scripts, event attributes or style attributes (CSP `script-src 'self'; style-src 'self'`).

## Modifying

- Quiz: edit `js/quiz-data.js`. `test/quiz.test.js` checks counts per category (2/2/4/2), that classification questions share choices and each of the 4 answers is correct once, and that no answer position is used by more than 4 questions.
- Catalog: edit `js/catalog.js`; copy `title` from the tool's README YAML and classify it as the tool's README does. Update `test/catalog.test.js` and the table in README.md (the README table is checked against the catalog).
- Colors: change CSS variables only; `test/contrast.test.js` requires 4.5:1 for text and 3:1 for borders/focus/lines in both themes.
- README: numbers and tables are verified by `test/readme.test.js` (key counts, examples, directory tree with a description on every line).

## Notes

- Part of the "100 Security Tools with Generative AI" project (Day097).
- UI text is Japanese.
- See `TECHNICAL.md` for implementation details and `SECURITY.md` for security measures and limits.
