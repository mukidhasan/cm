import json
import re

keys = []
with open('c:/Users/Saaqib/Documents/GitHub/cm/pdf_data.js', 'r', encoding='utf-8') as f:
    for line in f:
        match = re.match(r'\s*"([^"]+)":\s*"', line)
        if match:
            keys.append(match.group(1))

print("Keys in pdf_data.js:")
for key in keys:
    print(key)
