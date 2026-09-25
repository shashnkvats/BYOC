from __future__ import annotations

import re
import secrets


def slugify(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "classifier"
    suffix = secrets.token_hex(3)
    return f"{base}-{suffix}"
