# Hugging Face Spaces Optimized Dockerfile
# Backend with Stirling PDF integrated

FROM python:3.11-slim

# Create non-root user (required by HF Spaces)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies as root (including Java for Stirling)
USER root
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    gcc \
    libffi-dev \
    curl \
    wget \
    openjdk-21-jre-headless \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Download Stirling PDF
RUN mkdir -p /app/stirling && \
    wget --no-check-certificate -O /app/stirling/Stirling-PDF.jar \
    https://github.com/Stirling-Tools/Stirling-PDF/releases/download/v0.32.0/Stirling-PDF-0.32.0.jar || \
    wget --no-check-certificate -O /app/stirling/Stirling-PDF.jar \
    https://github.com/Stirling-Tools/Stirling-PDF/releases/latest/download/Stirling-PDF.jar && \
    chown -R user:user /app/stirling

# Switch back to user
USER user

# Copy and install Python dependencies
COPY --chown=user requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY --chown=user . .

# Copy startup script
COPY --chown=user start.sh .
RUN chmod +x start.sh

# Create temp directory
RUN mkdir -p /tmp/campushub

# Set Stirling URL
ENV STIRLING_PDF_URL=http://localhost:8080

# Expose HF Spaces port
EXPOSE 7860

# Health check (increased start period for Stirling startup)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:7860/health', timeout=5.0)" || exit 1

# Run the startup script
CMD ["./start.sh"]
