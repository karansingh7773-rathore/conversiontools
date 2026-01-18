# Stirling PDF - Hugging Face Space
# Uses official Docker image with FULL features (including OCR)

FROM stirlingtools/stirling-pdf:latest-fat

# Environment variables to disable security (for API access)
ENV DOCKER_ENABLE_SECURITY=false
ENV SECURITY_ENABLELOGIN=false
ENV SECURITY_CSRFDISABLED=true
ENV SYSTEM_DEFAULTLOCALE=en-US

# OCR Configuration - ensure tesseract has language data
ENV INSTALL_BOOK_AND_ADVANCED_HTML_OPS=true

# Set proper memory limits for OCR processing
ENV JAVA_OPTS="-Xmx4g -Xms1g"

# Change Stirling-PDF port from 8080 to 7860 for HuggingFace
ENV SERVER_PORT=7860

# Expose port 7860 for HF Spaces
EXPOSE 7860
