# Ninja Boom

A fun spelling and times tables game for classrooms and individual practice. Teachers add word lists, students catch falling letters in order to spell each word.

## Features

- Easy word list input (one per line or comma-separated)
- Quick-load sample lists by grade level
- Adjustable word preview time (1–3 seconds)
- Display mode for classroom projection
- Falling letter gameplay with tap/click interaction
- Progress meter tracking all letters across all words
- Animations and sound feedback for correct/wrong answers
- Purple, black, and white theme with playful fonts

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production

```bash
npm run build
npm run preview
```

## GitHub Pages

The built site is output to `docs/` for hosting at:

https://planomy.github.io/ninjaboom/

In the repo **Settings → Pages**, set source to **main** branch, **/docs** folder.

Rebuild and push after changes:

```bash
npm run build
git add docs
git commit -m "Update GitHub Pages build"
git push
```

## How to Play

1. Enter a list of words (or load a sample list)
2. Adjust the preview time slider (how long students see each word)
3. Toggle Display mode for classroom use
4. Hit **GO!**
5. Memorize the word while it's shown, then tap falling letters left-to-right to spell it
