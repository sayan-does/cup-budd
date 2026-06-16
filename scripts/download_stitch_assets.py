#!/usr/bin/env python3
"""Download Stitch screen assets from manifest.json."""

import json
import subprocess
import sys
from pathlib import Path


def main() -> int:
    base = Path(__file__).resolve().parents[1] / "docs" / "frontend-specs" / "stitch-assets"
    manifest_path = base / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    for entry in manifest:
        for kind in ("html", "image"):
            url_key = f"{kind}Url"
            file_key = f"{kind}File"
            if url_key not in entry:
                continue
            dest = base / entry[file_key]
            dest.parent.mkdir(parents=True, exist_ok=True)
            print(f"Downloading {entry['title']} ({kind})...")
            result = subprocess.run(
                ["curl.exe", "-sL", "-m", "120", "-o", str(dest), entry[url_key]],
                capture_output=True,
                text=True,
            )
            size = dest.stat().st_size if dest.exists() else 0
            print(f"  -> {dest} ({size} bytes) exit={result.returncode}")

    print("All downloads complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
