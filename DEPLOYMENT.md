# 🚀 Hugging Face Spaces Deployment Guide

## Quick Deploy (Automated)

Run the deployment script:

```powershell
cd "d:\campushub (2)"
.\deploy-hf.ps1
```

This will:
1. ✅ Check prerequisites (Git, HF CLI)
2. ✅ Clone your HF Space
3. ✅ Copy backend files
4. ✅ Commit and push to HF

---

## Manual Deployment

### Step 1: Install HF CLI (if needed)

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://hf.co/cli/install.ps1 | iex"
```

### Step 2: Login to Hugging Face

```powershell
huggingface-cli login
```

Get your token from: https://huggingface.co/settings/tokens

### Step 3: Clone Your Space

```powershell
git clone https://huggingface.co/spaces/Karansinghrathore820/MyVirtualMachine
cd MyVirtualMachine
```

### Step 4: Copy Backend Files

```powershell
# Remove existing files (except .git)
Get-ChildItem -Exclude .git | Remove-Item -Recurse -Force

# Copy backend
Copy-Item -Path "..\backend\*" -Destination "." -Recurse

# Copy Dockerfile
Copy-Item -Path "..\Dockerfile" -Destination "."

# Copy README
Copy-Item -Path "..\README_HF.md" -Destination ".\README.md"
```

### Step 5: Commit and Push

```powershell
git add .
git commit -m "Deploy CampusHub backend"
git push
```

---

## Verify Deployment

After 2-3 minutes, your Space should be live at:
https://huggingface.co/spaces/Karansinghrathore820/MyVirtualMachine

### Test API

```powershell
# Health check
curl https://karansinghrathore820-myvirtualmachine.hf.space/health

# Test PDF merge (replace with your actual files)
curl -X POST https://karansinghrathore820-myvirtualmachine.hf.space/api/pdf/merge `
  -F "files=@file1.pdf" `
  -F "files=@file2.pdf" `
  -o merged.pdf
```

---

## What Gets Deployed

The lightweight backend includes:

### ✅ Working Tools (No External Dependencies)
- PDF Merge, Split, Rotate, Organize
- Multi-page Layout
- Add/Remove Password
- Edit Metadata
- Watermark
- Images to PDF
- Image Resize & Compress (WebP, AVIF, JPEG, PNG)
- Video Compress & Trim (if FFmpeg available in container)

### ❌ Not Included (Requires Stirling PDF)
- OCR
- PDF to Office
- File to PDF
- Advanced Compression
- URL to PDF
- Digital Signatures

To add these, you'd need to deploy a separate Stirling PDF Space.

---

## Update Your Frontend

Update the API URL in your frontend:

```typescript
// services/api.ts
const API_BASE_URL = 'https://karansinghrathore820-myvirtualmachine.hf.space';
```

Or use environment variable:

```bash
# .env
VITE_API_URL=https://karansinghrathore820-myvirtualmachine.hf.space
```

---

## Troubleshooting

### Space build fails
- Check logs in HF Space settings
- Verify Dockerfile syntax
- Ensure all dependencies are in requirements.txt

### Space runs but API errors
- Check Space logs
- Test health endpoint: `/health`
- Verify port 7860 is exposed

### Out of memory
- HF Spaces have limited RAM
- Reduce concurrent requests
- Add file size limits in backend

### Need advanced PDF features
Deploy Stirling PDF separately:
1. Create new Space
2. Use `frooodle/s-pdf:latest` image
3. Set backend env: `STIRLING_URL=https://your-stirling-space.hf.space`

---

## Cost & Limits

**Free Tier:**
- ✅ Public Space
- ✅ 2 vCPU, 16GB RAM
- ✅ 50GB storage
- ⚠️ May sleep if inactive

**Upgrade for:**
- Private Spaces
- More resources
- Persistent storage
- No sleep mode

See: https://huggingface.co/pricing#spaces

---

## Next Steps

1. **Test all endpoints** using curl or Postman
2. **Deploy frontend** to HF Static Space or Vercel
3. **Add monitoring** using HF Space logs
4. **Set up custom domain** (Pro plan)
5. **Add rate limiting** for production use

---

## Support

- HF Docs: https://huggingface.co/docs/hub/spaces
- Docker Spaces: https://huggingface.co/docs/hub/spaces-sdks-docker
- Issues: Create issue in your Space repo
