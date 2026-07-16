import json
import re
import base64

with open('c:/Users/Saaqib/Documents/GitHub/cm/pdf_data.js', 'r', encoding='utf-8') as f:
    content = f.read()

matches = re.findall(r'"([^"]+)":\s*"([^"]+)"', content)
for key, b64 in matches:
    try:
        decoded = base64.b64decode(b64)
        print(f"Key: {key}, Decoded size: {len(decoded)}, starts with: {decoded[:5]}")
    except Exception as e:
        print(f"Key: {key} failed to decode: {e}")
