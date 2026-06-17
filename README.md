# Subtitle Converter

A static browser tool for Simplified/Traditional Chinese text and subtitle conversion.

## Features

- Text conversion between Simplified Chinese and Traditional Chinese for Taiwan.
- Browser-only subtitle conversion for `.srt`, `.vtt`, `.ass`, `.ssa`, and `.txt`.
- Optional subtitle cleanup for ASS override tags, HTML tags, and escaped line breaks.
- ZIP batch conversion in the browser.
- No server upload for user files.

## Local Test

Open `index.html` in a browser, or run a tiny local server:

```powershell
python -m http.server 8080
```

Then visit `http://localhost:8080`.

## Automated Test

```powershell
npm test
```

