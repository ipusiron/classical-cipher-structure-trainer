# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**Classical Cipher Structure Trainer** is an educational web application that teaches the fundamental building blocks of classical cryptography: **Substitution (Mapping)** and **Transposition (Shuffle)**. The tool uses interactive visualizations and a quiz to help students understand cipher structures rather than implementing actual encryption/decryption.

This is a client-side only application (HTML/CSS/JavaScript) with no build process or backend.

## Running the Application

Open `index.html` directly in a browser:

```bash
start index.html
```

No installation or build step required.

## Architecture

### Core Concept

The application abstracts classical ciphers into two fundamental operations:
- **Substitution (換字)**: Mapping characters to other characters using a correspondence table
- **Transposition (転置)**: Shuffling character positions using permutation

### File Structure

```
index.html          # Main HTML structure with 3 tabs (Introduction, Examples, Quiz)
script.js           # All interactive logic (tab switching, mapping visualization, drag-and-drop, quiz)
style.css           # Styling with CSS variables for theming
data/quiz.json      # Quiz questions (10 questions in Japanese)
```

### Tab System

The application uses a simple tab navigation pattern:
- **Introduction**: Static explanations with interactive demos for mapping (SVG lines) and shuffle (drag-and-drop blocks)
- **Examples**: Links to external cipher tools (Caesar, Vigenère, Permutation, etc.)
- **Quiz**: 10 single-choice questions loaded from `data/quiz.json`

### Key Components in script.js

**Mapping Visualization** (`buildMappingFigure` function):
- Draws SVG curves connecting top row (plaintext) to bottom row (ciphertext)
- Uses Bézier curves for visual appeal
- Controlled by `vizOffset` (shift amount) and `vizRandomMapping` (Fisher-Yates shuffle result)
- Supports switching ciphertext character set between A-H and 1-8 via `vizBottomCharSet`

**Shuffle Visualization** (drag-and-drop):
- Uses native HTML5 drag-and-drop API
- `makeBlock()`: Creates draggable character blocks
- `setupDropZone()`: Handles dragover events to reorder blocks
- Two instances: "HELLO" (Introduction) and "EDUCATION" (Visualization)

**Quiz System** (`setupQuiz` function):
- Fetches `data/quiz.json` on load
- Dynamically generates radio button questions
- Grading based on `answer_index` in JSON
- Three-tier feedback messages (≤4, ≤8, ≥9 correct)

### Quiz Data Structure

`data/quiz.json` contains:
- **questions**: Array of 10 question objects
  - `id`: Unique identifier (q001-q010)
  - `category`: definition | basic | classification | mixed
  - `prompt`: Question text (Japanese)
  - `choices`: Array of 4 choice strings
  - `answer_index`: Correct answer (0-3)
  - `explanation`: Brief explanation

## Modifying the Application

**To add/edit quiz questions**: Edit `data/quiz.json` directly. Maintain the same structure.

**To change mapping visualization offset**: Modify `introOffset` or `vizOffset` variables in script.js, or use the "対応表を回す" button in the Visualization tab.

**To change shuffle demo text**: Modify the text content in the HTML elements with ids `shuffle-source` or `viz-shuffle-source`.

**To adjust styling**: All colors and spacing use CSS variables defined in `:root` in style.css.

## Important Notes

- This is an **educational visualization tool** - it does NOT implement actual cipher encryption/decryption
- All text and UI is in Japanese
- The application is part of a "100 Security Tools with AI" project (Day 097)
- No external dependencies or frameworks - vanilla JavaScript only
- Responsive design with mobile support via flexbox/grid and media queries
- See `TECHNICAL.md` for detailed implementation documentation (algorithms, security measures, accessibility)
