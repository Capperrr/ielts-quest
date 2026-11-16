# 午夜汤局 · Midnight Soup Club

120 original Chinese lateral-thinking puzzles. This is an independent GitHub Pages game and does not overwrite the previous ChatGPT-hosted site.

## How to play

1. Open the HTTPS GitHub Pages site.
2. Select a case; choose 玩家 (player) or 主持人 (host).
3. Players only see the soup surface and two hints. Hint 1 opens after 4 minutes. Hint 2 opens 4 minutes after hint 1 is actually opened.
4. Hosts must enter their privately provided master key to decrypt the soup solutions. Do not share the host key.
5. The “分享汤面” button provides a player-only link; it contains no solutions or access key.

## Data and limits

- `puzzles.json` contains only public case text and clues, not solutions.
- `vault.json` stores the 120 answers as ciphertext, protected using PBKDF2-SHA256 and AES-256-GCM. The master key is never committed to this repository.
- Local hint timers are persisted within the current browser tab. Technically skilled users may manipulate browser clocks or view the public hint JSON. The actual solutions cannot be decrypted without the host key.
- Favorites and solved history are stored locally.
- Offline plaintext answers and the private key must never be committed to GitHub. For secure key rotation, re-encrypt the vault offline and distribute a fresh key.

To deploy, enable GitHub Pages for the main branch, root folder. Entry point: `/turtle-soup/`.
