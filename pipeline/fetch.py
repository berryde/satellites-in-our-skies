"""Download raw source data into pipeline/.cache.

Sources are only re-downloaded when the cached copy is older than the source's
update interval, so running the pipeline repeatedly never hammers them.
CelesTrak in particular refuses repeat downloads of a group within its 2-hour
update window, answering with a plain-text notice instead of data.
"""

import sys
import time
import urllib.request
from pathlib import Path

CACHE = Path(__file__).parent / ".cache"
USER_AGENT = "satellites-in-our-skies-pipeline/2.0"

HOUR = 3600
SOURCES = {
    # GCAT (Jonathan McDowell, CC-BY): every catalogued object since 1957.
    # The standard catalog (US numbers 1-69999) and the extended one (100000+,
    # used for launches from mid-2026): each object's first phase.
    "gcat-satcat.tsv": ("https://planet4589.org/space/gcat/tsv/cat/satcat.tsv", 24 * HOUR),
    "gcat-satcat100k.tsv": ("https://planet4589.org/space/gcat/tsv/cat/satcat100k.tsv", 24 * HOUR),
    # Derived: each object's most recent phase, so renames and ownership changes
    # don't look like re-entries, plus the latest orbit for objects still up.
    "gcat-currentcat.tsv": ("https://planet4589.org/space/gcat/tsv/derived/currentcat.tsv", 24 * HOUR),
    "gcat-orgs.tsv": ("https://planet4589.org/space/gcat/tsv/tables/orgs.tsv", 24 * HOUR),
    # CelesTrak: current orbital elements (OMM) for active satellites.
    "celestrak-active.csv": (
        "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=csv",
        2 * HOUR,
    ),
}


def fetch(name: str, url: str, max_age: float, force: bool) -> None:
    path = CACHE / name
    # Every attempt counts against a source's limits, failed or not (CelesTrak
    # answers repeat requests inside its window with 403s), so wait out the
    # update interval after any attempt. --force only bypasses the data cache.
    attempted = CACHE / f"{name}.attempted"
    if attempted.exists() and time.time() - attempted.stat().st_mtime < max_age:
        wait = (max_age - (time.time() - attempted.stat().st_mtime)) / 60
        print(f"  {name}: last attempt was recent, next allowed in {wait:.0f} min")
        return
    if not force and path.exists() and time.time() - path.stat().st_mtime < max_age:
        print(f"  {name}: cached")
        return

    attempted.touch()
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=120) as response:
        body = response.read()

    # CelesTrak's "not updated since your last download" notice is a 200 response.
    if body.startswith(b"GP data has not updated"):
        if path.exists():
            print(f"  {name}: unchanged upstream, keeping cached copy")
            path.touch()
            return
        raise SystemExit(f"{name}: CelesTrak refused the download:\n{body.decode()}")

    path.write_bytes(body)
    print(f"  {name}: downloaded {len(body) / 1e6:.1f} MB")


def main() -> None:
    force = "--force" in sys.argv
    CACHE.mkdir(exist_ok=True)
    failures = []
    for name, (url, max_age) in SOURCES.items():
        try:
            fetch(name, url, max_age, force)
        except (OSError, SystemExit) as error:
            failures.append(name)
            print(f"  {name}: FAILED ({error})", file=sys.stderr)
    if failures:
        sys.exit(1)


if __name__ == "__main__":
    main()
