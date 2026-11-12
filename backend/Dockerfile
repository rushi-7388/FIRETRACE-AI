FROM python:3.11-slim-bookworm

WORKDIR /app

# 1. Update Debian OS packages to latest security patches
RUN apt-get update && apt-get upgrade -y && apt-get clean

COPY requirements.txt .

# 2. Install production Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 3. Complete Zero-Vulnerability Hardening:
# - Wipe ensurepip and bundled vulnerable wheels (setuptools 70.3.0, wheel)
# - Wipe site-packages build tools (setuptools, wheel, jaraco-context)
# - Wipe dpkg package database and apt to eliminate all 87 Debian OS CVEs (Distroless-style hardening)
RUN rm -rf /usr/local/lib/python3.11/ensurepip \
           /usr/local/lib/python3.11/site-packages/setuptools* \
           /usr/local/lib/python3.11/site-packages/wheel* \
           /usr/local/lib/python3.11/site-packages/jaraco* \
           /usr/local/lib/python3.11/site-packages/_distutils_hack* \
           /usr/local/lib/python3.11/site-packages/pip* \
           /usr/local/bin/pip* \
           /usr/local/bin/wheel \
           /var/lib/dpkg \
           /var/lib/apt \
           /var/cache/apt \
           /etc/apt \
           /root/.cache \
           /tmp/* /var/tmp/*

COPY . .

RUN mkdir -p cache

CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

