import re

with open('Assets/Application Details.html', 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Try to find Domain
domains = re.findall(r'dev-[a-zA-Z0-9]+\.(?:eu\.)?auth0\.com|dev-[a-zA-Z0-9]+(?:\.[a-z]{2})?\.auth0\.com', content)
print("Domains:", set(domains))

# Try to find Client ID
client_ids = re.findall(r'Xbo4996[A-Za-z0-9]+', content)
print("Client IDs:", set(client_ids))

# Try to find Client Secret
secrets = re.findall(r'client_secret["\']?\s*[:=]\s*["\']([^"\']+)["\']', content, re.IGNORECASE)
print("Client Secrets:", set(secrets))

# Try to find anything looking like a 64 char string
long_strings = re.findall(r'["\']([a-zA-Z0-9_\-]{64})["\']', content)
print("Possible secrets:", set(long_strings))
