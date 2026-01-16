# Stirling PDF Integration Troubleshooting

## Problem Statement

When attempting to use PDF to Office conversion features (PDF to Word/Excel/PowerPoint) through our backend API, we consistently receive a **403 Forbidden** error from Stirling PDF:

```json
{
  "timestamp": "2026-01-15T19:50:28.191+00:00",
  "status": 403,
  "error": "Forbidden",
  "message": "This endpoint is disabled",
  "path": "/api/v1/convert/pdf/word"
}
```

### Error Context
- **Endpoint**: `/api/v1/convert/pdf/word` (and other conversion endpoints)
- **Environment**: Hugging Face Spaces (Docker container)
- **Stirling PDF Version**: v0.32.0
- **Java Runtime**: OpenJDK 17/21
- **HTTP Status**: 403 Forbidden (not 401 Unauthorized)

### What Works
✅ Health check endpoint (`/api/v1/info/status`) returns 200 OK  
✅ Stirling PDF starts successfully  
✅ FastAPI backend connects to Stirling  
✅ Other PDF operations (merge, split, rotate) work via pypdf

### What Doesn't Work
❌ PDF to Office conversions (DOCX, XLSX, PPTX)  
❌ Office to PDF conversions  
❌ OCR operations  
❌ Advanced compression  
❌ All endpoints under `/api/v1/convert/` category

---

## Root Cause Analysis

Based on extensive testing, the 403 "endpoint is disabled" error occurs because:

1. **Missing Dependencies**: When running Stirling PDF JAR without LibreOffice and unoserver, conversion endpoints are auto-disabled
2. **unoserver Required**: LibreOffice conversions require `unoserver` to be running as a bridge
3. **Configuration Not Applied**: Environment variables and settings.yml may not be loaded correctly
4. **Official Image Blocking**: The official Docker image's `init.sh` runs as foreground process, blocking other services

---

## Solutions Attempted

### Attempt 1: Environment Variables Only
**File**: `start.sh`  
**Change**: Added environment variables to disable security

```bash
SECURITY_ENABLELOGIN=false \
SECURITY_CSRFDISABLED=true \
DOCKER_ENABLE_SECURITY=false \
SYSTEM_DEFAULTLOCALE=en-US \
java -jar Stirling-PDF.jar
```

**Result**: ❌ Failed - 403 error persists. Endpoints still disabled.

---

### Attempt 2: Add LibreOffice, Tesseract, Ghostscript to Dockerfile
**File**: `hf-space/Dockerfile`  
**Change**: Installed all required dependencies

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-21-jre-headless \
    libreoffice-core \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    tesseract-ocr \
    tesseract-ocr-eng \
    ghostscript \
    fonts-liberation \
    fonts-dejavu-core
```

**Result**: ❌ Failed - Dependencies installed but endpoints still return 403. Likely because `unoserver` is not running.

---

### Attempt 3: Use Official Stirling PDF Docker Image
**File**: `hf-space/Dockerfile`  
**Change**: Based on official `stirlingtools/stirling-pdf:latest` image

```dockerfile
FROM stirlingtools/stirling-pdf:latest

# Install Python and FastAPI dependencies
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg

# Use supervisord to run both services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
```

**Result**: ❌ Failed - Startup errors due to Spring Boot logging configuration conflict

---

### Attempt 4: Official Image with init.sh Entrypoint
**File**: `hf-space/supervisord.conf`  
**Change**: Used official `/scripts/init.sh` entrypoint in supervisor

```ini
[program:stirling-pdf]
command=/scripts/init.sh
directory=/app
environment=DOCKER_ENABLE_SECURITY="false",SECURITY_ENABLELOGIN="false"
```

**Result**: ❌ Failed - `init.sh` runs Stirling as foreground process, blocking supervisor

---

### Attempt 5: Custom Start Script with Background init.sh
**File**: `hf-space/start.sh`  
**Change**: Run `init.sh` in background, then start FastAPI

```bash
#!/bin/bash
cd /app
/scripts/init.sh &

# Wait for Stirling to be ready
for i in {1..60}; do
    if curl -s http://localhost:8080/api/v1/info/status > /dev/null 2>&1; then
        break
    fi
    sleep 2
done

# Start FastAPI
cd /backend
exec python3 -m uvicorn main:app --host 0.0.0.0 --port 7860
```

**Result**: ❌ Failed - FastAPI never starts because init.sh blocks even when backgrounded

---

### Attempt 6: JAR Approach with unoserver (Current)
**Files**: `Dockerfile`, `start.sh`, `configs/settings.yml`  
**Change**: Go back to JAR but add `unoserver` and proper configuration

**Dockerfile**:
```dockerfile
FROM python:3.11-slim

RUN apt-get install -y \
    openjdk-17-jre-headless \
    libreoffice-core libreoffice-writer libreoffice-calc libreoffice-impress \
    tesseract-ocr ghostscript \
    python3-uno

# Install unoserver
RUN pip install unoserver

# Download Stirling PDF JAR
RUN wget -O /app/stirling/Stirling-PDF.jar \
    https://github.com/Stirling-Tools/Stirling-PDF/releases/download/v0.32.0/Stirling-PDF-0.32.0.jar
```

**start.sh**:
```bash
#!/bin/bash
# Start unoserver first (required for LibreOffice conversions)
unoserver --interface 127.0.0.1 --port 2003 &
sleep 3

# Start Stirling PDF
cd /app/stirling
DOCKER_ENABLE_SECURITY=false \
SECURITY_ENABLELOGIN=false \
java -jar Stirling-PDF.jar &

# Wait for Stirling, then start FastAPI
cd /app
exec uvicorn main:app --host 0.0.0.0 --port 7860
```

**configs/settings.yml**:
```yaml
security:
  enableLogin: false
  csrfDisabled: true

endpoints:
  toRemove: []
  groupsToRemove: []
```

**Status**: ⏳ Currently testing

---

## Alternative Solutions to Consider

### Option 1: Deploy Stirling PDF as Separate HF Space
Run Stirling PDF as a dedicated Space using the official Docker image:

1. Create new HF Space: `Karansinghrathore820/stirling-pdf`
2. Use official Docker image with default settings
3. Update main backend: `STIRLING_PDF_URL=https://stirling-pdf-space.hf.space`

**Pros**: Clean separation, official image works out-of-box  
**Cons**: Two spaces to manage, cross-space network latency

---

### Option 2: Use Python Libraries Instead
Replace Stirling PDF with native Python libraries:

| Conversion | Library |
|------------|---------|
| PDF to Word | `pdf2docx` |
| PDF to Excel | `tabula-py`, `camelot-py` |
| Office to PDF | `libreoffice --headless` subprocess |
| OCR | `pytesseract` |

**Pros**: No external service, full control  
**Cons**: More code to maintain, quality may vary

---

### Option 3: Use Cloud Conversion APIs
Use third-party APIs for conversions:
- CloudConvert API
- ConvertAPI
- Adobe PDF Services API

**Pros**: Reliable, high quality  
**Cons**: Cost per conversion, API limits

---

## Summary Table

| Attempt | Approach | Result |
|---------|----------|--------|
| 1 | Environment variables only | ❌ 403 error |
| 2 | Add LibreOffice to Dockerfile | ❌ 403 error (no unoserver) |
| 3 | Official Docker image + supervisor | ❌ Startup errors |
| 4 | Official image + init.sh in supervisor | ❌ init.sh blocks |
| 5 | Background init.sh + FastAPI | ❌ FastAPI never starts |
| 6 | JAR + unoserver + settings.yml | ⏳ Testing |

---

## Key Learnings

1. **unoserver is critical**: LibreOffice conversions require unoserver running as a bridge
2. **Official image is complex**: The `init.sh` script is designed as container entrypoint, not background service
3. **JAR has different defaults**: Standalone JAR disables endpoints that require external dependencies
4. **Configuration location matters**: `settings.yml` must be in the correct directory relative to JAR
5. **Service orchestration is hard**: Running multiple services in one container requires careful coordination

---

## References

- [Stirling PDF Documentation](https://docs.stirlingpdf.com/)
- [Stirling PDF GitHub](https://github.com/Stirling-Tools/Stirling-PDF)
- [unoserver PyPI](https://pypi.org/project/unoserver/)
- [HF Spaces Documentation](https://huggingface.co/docs/hub/spaces)

---

*Last Updated: 2026-01-16*  
*Status: Testing JAR + unoserver approach*
