---
title: CampusHub Tools
emoji: 🛠️
colorFrom: red
colorTo: orange
sdk: docker
pinned: false
app_port: 7860
---

# CampusHub Tool Conversion

A privacy-first suite of document, image, and video processing tools.

## Features

- **PDF Tools**: Merge, Split, Rotate, Compress, OCR, Office Conversion
- **Image Tools**: Resize, Crop, Compress, Format Conversion
- **Video Tools**: Compress, Trim

## Tech Stack

- **Backend**: FastAPI + Python
- **PDF (Simple)**: pypdf - Fast in-process operations
- **PDF (Complex)**: Stirling PDF - OCR, Office conversion
- **Images**: Pillow with AVIF/WebP support
- **Video**: FFmpeg

Check the [backend README](backend/README.md) for API documentation.
