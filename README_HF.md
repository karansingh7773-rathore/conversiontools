---
title: CampusHub Tools Backend
emoji: 🛠️
colorFrom: red
colorTo: yellow
sdk: docker
pinned: false
app_port: 7860
---

# CampusHub Tool Conversion Backend API

A privacy-first backend API for document, image, and video processing tools.

## 🚀 Features

### PDF Tools
- **Page Operations**: Merge, Split, Rotate, Organize, Multi-page Layout
- **Security**: Add/Remove Password, Watermark, Edit Metadata  
- **Conversion**: Images to PDF

### Image Tools
- **Resize & Crop**: Multiple modes (fit, fill, crop)
- **Compress & Convert**: WebP, AVIF, JPEG, PNG

### Video Tools
- **Compress**: Variable quality levels
- **Trim**: Cut by start/end time

## 🔧 Tech Stack

- **Backend**: FastAPI + Python 3.11
- **PDF**: pypdf (lightweight operations)
- **Images**: Pillow with AVIF/WebP support
- **Video**: FFmpeg

## 📝 API Endpoints

All endpoints accept multipart form data and return processed files.

### Health Check
```bash
GET /health
```

### PDF Operations
```bash
POST /api/pdf/merge          # Merge multiple PDFs
POST /api/pdf/split          # Split by ranges/groups/size
POST /api/pdf/rotate         # Rotate pages
POST /api/pdf/organize       # Reorder/delete pages
POST /api/pdf/layout         # Multi-page layout (N-up)
POST /api/pdf/password/add   # Encrypt with password
POST /api/pdf/password/remove # Remove password
POST /api/pdf/metadata       # Edit metadata
POST /api/pdf/watermark      # Add watermark
POST /api/pdf/images-to-pdf  # Combine images
```

### Image Operations
```bash
POST /api/image/resize       # Resize/crop image
POST /api/image/compress     # Compress/convert format
```

### Video Operations
```bash
POST /api/video/compress     # Compress video
POST /api/video/trim         # Trim by time
```

## 🎯 Example Usage

### cURL
```bash
# Merge PDFs
curl -X POST https://your-space.hf.space/api/pdf/merge \
  -F "files=@file1.pdf" \
  -F "files=@file2.pdf" \
  -o merged.pdf

# Compress image
curl -X POST https://your-space.hf.space/api/image/compress \
  -F "file=@photo.jpg" \
  -F "quality=80" \
  -F "output_format=webp" \
  -o compressed.webp
```

### Python
```python
import requests

# Resize image
files = {'file': open('image.jpg', 'rb')}
data = {'width': 800, 'maintain_ratio': 'true', 'mode': 'fit'}
response = requests.post(
    'https://your-space.hf.space/api/image/resize',
    files=files,
    data=data
)
with open('resized.jpg', 'wb') as f:
    f.write(response.content)
```

### JavaScript
```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

const response = await fetch('https://your-space.hf.space/api/pdf/merge', {
    method: 'POST',
    body: formData
});

const blob = await response.blob();
```

## 📄 License

MIT License
