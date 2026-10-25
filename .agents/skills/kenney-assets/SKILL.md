---
name: kenney-assets
description: Find, compare, verify, and download game asset packs from Kenney's catalog. Use when users ask for Kenney assets by theme, gameplay, art style, category, current inventory, or want a pack added to the project.
---

# Find and download Kenney game assets

Use Kenney's live preview catalog as the discovery index:

<https://kenney.nl/data/itch/preview/>

## Workflow

- Open the catalog for each new search. Do not rely on a previously copied inventory; the listings can change.
- Search the listed pack names and use the available category filters: All, 2D, 3D, UI, Icons, Audio, and Other. Translate the user's idea into likely search terms and categories, then inspect candidate preview images when the browser tools expose them.
- For recommendations, return a concise shortlist unless the user asks for the full inventory. Keep each pack's English name exact, add a Traditional Chinese translation, briefly describe its theme or why it fits, and link to the relevant preview or official pack page when available.
- For a full inventory, include all entries currently visible in the requested scope and mention that the catalog warns some packages may not be displayed.
- The catalog is primarily a pack index and preview. Do not infer exact file contents, asset counts, formats, licenses, prices, or usage terms from a name alone. Check the official Kenney pack page and, when needed, its official Kenney itch.io page. If a detail is unavailable there, mark it as unverified.
- Make clear when a description is inferred from the pack name or preview rather than confirmed by an official description. Preserve uncertainty instead of filling in details.
- Respond in Traditional Chinese by default while preserving English pack names. Add a category column when it helps users compare results.

## Download and add a pack

- Download only when the user explicitly asks to download or add assets. A request to find or recommend packs alone does not authorize changing project files.
- Before downloading, open the official pack page and verify the download option, license, and any price or payment requirement. Use an official Kenney download link or Kenney's official itch.io page; do not use third-party mirrors. Never assume that every Kenney pack has the same license or price.
- If the user asks to download any suitable pack, choose a relevant pack with a free download option when available, and explain the selection briefly. Do not pay, donate, create an account, submit personal information, or bypass a payment requirement. If a pack requires payment or access that is unavailable, stop and ask the user which pack or access method they prefer.
- In this project, use `npm run assets:kenney:download -- --url <official-zip-url> --slug <pack-slug> --category <category> --apply`. Review the preview output first; the script refuses non-HTTPS or non-Kenney download hosts, limits redirects to Kenney/itch.io hosts, checks ZIP integrity and paths, and does not overwrite an existing pack. It stores the ZIP and download record under `asset-source/kenney/<slug>/`, and copies supported runtime file types under `public/assets/<category>/kenney/<slug>/`. It skips preview/sample images; the original ZIP remains available for other files and documentation.
- If the explicit download run fails with a network-level `fetch failed`, keep the same official URL and retry through an approved network permission when available; do not switch to a mirror. Do not retry HTTP errors that indicate a payment, login, or inaccessible download.
- For images, use `--category images` or `--category images/tilesets`; for audio use `--category audio`. The downloader supports `images`, `ui`, `audio`, `fonts`, and `models` categories. It never handles payment, login, or paywall access.
- After downloading, run `npm run assets:kenney:inspect -- --slug <pack-slug>` to create a file/dimension and license-file inventory at `asset-source/kenney/<slug>/manifest.json`. This inventory reports license file names but does not interpret license terms; verify those against the official page and license text.
- For a pack already in the project without a download record, pass its project-relative folder with `--assets-dir`, for example `npm run assets:kenney:inspect -- --slug <pack-slug> --assets-dir public/assets/images/tilesets/kenney/<slug>`.
- To browse images in a newly downloaded pack, run `npm run assets:kenney:contact-sheet -- --slug <pack-slug>`. For an existing pack without a download record, use the same `--assets-dir` option. It creates `asset-source/kenney/<slug>/contact-sheet.html`, which can be opened in a browser.
- Do not run the downloader for a search or recommendation request. The user must explicitly ask to download or add the pack. If the pack is already present, inspect it instead of downloading it again.
- A successful download and extraction does not by itself integrate the assets into the game. Do not change game code unless asked. When Phaser loading or animation setup is requested, read the relevant project Phaser skill, such as `../loading-assets/SKILL.md`, and inspect the asset metadata or dimensions before assuming a spritesheet layout or frame size.
