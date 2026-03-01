#!/usr/bin/env bash
set -e

apt-get update
apt-get install -y tesseract-ocr tesseract-ocr-eng libgl1 libglib2.0-0

# sanity checks (these show in Render build logs)
which tesseract
tesseract --version

pip install -r requirements.txt