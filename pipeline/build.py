"""Build the static data files the app loads, from the raw files in .cache.

Outputs (in ../public/data):
  orbits.bin    Float32 columns, one value per satellite per column (see ORBIT_COLUMNS).
  catalog.json  Metadata: reference epoch, column layout, lookup tables, names.

Every payload GCAT has ever recorded in Earth orbit is included, with its launch
and decay dates, so the app can show the sky at any moment since 1957.

GCAT gives each orbit's shape (perigee, apogee, inclination) but not where in
that orbit the satellite is, so for now the orientation and phase angles are
derived deterministically from the catalogue number: "illustrative positions".
Live positions from CelesTrak's elements replace them for active satellites
in a later step.
"""

import json
from datetime import UTC, datetime
from pathlib import Path

import duckdb
import numpy as np

ROOT = Path(__file__).parent
CACHE = ROOT / ".cache"
OUT = ROOT.parent / "public" / "data"

EARTH_RADIUS_KM = 6378.137
# Very eccentric orbits (lunar transfers, far-out science missions) would
# dominate the scene's scale without adding to the story.
MAX_APOGEE_KM = 100_000

ORBIT_CLASSES = ["LEO", "MEO", "GEO", "Elliptical"]
ORBIT_COLUMNS = [
    "semiMajorAxisKm",
    "eccentricity",
    "inclination",  # radians
    "raan",  # radians, at the reference epoch
    "argPerigee",  # radians, at the reference epoch
    "meanAnomaly",  # radians, at the reference epoch
    "launchDays",  # days relative to the reference epoch
    "decayDays",  # days relative to the reference epoch; huge if still in orbit
    "orbitClass",  # index into ORBIT_CLASSES
]
STILL_IN_ORBIT = 1e7


def read_gcat(con: duckdb.DuckDBPyConnection, name: str, view: str) -> None:
    """GCAT TSVs start with a '#'-prefixed header line and an '# Updated' line."""
    path = CACHE / name
    with path.open() as f:
        columns = f.readline().lstrip("#").strip().split("\t")
    # Views can't take prepared parameters, so materialise it as a table instead.
    con.execute(
        f"""
        create table {view} as
        select * from read_csv(?, delim = '\t', header = false, skip = 2,
                               names = ?, all_varchar = true, quote = '')
        """,
        [str(path), columns],
    )


def gcat_date(column: str) -> str:
    """SQL for GCAT dates such as '1957 Oct  4' or '1957 Dec  1 1000?'."""
    day = f"regexp_extract(trim({column}), '^\\d{{4}} \\w{{3}} +\\d{{1,2}}')"
    return f"try_strptime(regexp_replace({day}, ' +', ' ', 'g'), '%Y %b %d')"


def angle(seed: str) -> str:
    """A stable pseudo-random angle in radians, derived from the catalogue number."""
    return f"(hash(satcat || '{seed}') % 1000000) / 1000000.0 * 2 * pi()"


def main() -> None:
    con = duckdb.connect()
    read_gcat(con, "gcat-satcat.tsv", "satcat_standard")
    read_gcat(con, "gcat-satcat100k.tsv", "satcat_extended")
    read_gcat(con, "gcat-currentcat.tsv", "currentcat")
    read_gcat(con, "gcat-orgs.tsv", "orgs")

    epoch = datetime.now(UTC).replace(microsecond=0)

    # GCAT's main catalogs hold each object's *first* phase; later phases (a
    # rename, a change of owner, docking) are elsewhere, so a renamed satellite
    # looks like it left orbit. currentcat holds each object's *latest* phase:
    # it's the source for whether an object is still up, its current name and
    # owner, and its latest orbit. The first phase supplies the Earth orbit of
    # objects that later left it (e.g. lunar missions), where currentcat's
    # orbit would describe the Moon instead.
    con.execute(
        f"""
        create table satellites as
        with first_phase as (
            select trim(JCAT) as jcat, trim("Primary") as primary_body,
                   try_cast(trim(Perigee) as double) as perigee,
                   try_cast(trim(Apogee) as double) as apogee,
                   try_cast(trim(Inc) as double) as inc,
                   nullif(trim(OpOrbit), '-') as op_orbit
            from (from satcat_standard union all by name from satcat_extended)
        ),
        latest as (
            select trim(JCAT) as jcat,
                   -- NORAD number for objects in the US catalog (S) that have one,
                   -- otherwise GCAT's own ID: auxiliary objects share their parent's
                   -- NORAD number, and some recent ones have none yet ("NNA").
                   case when left(trim(JCAT), 1) = 'S' and regexp_full_match(trim(Satcat), '\\d+')
                        then trim(Satcat) else trim(JCAT) end as satcat,
                   trim(Name) as name,
                   trim(State) as country,
                   trim(Owner) as owner,
                   trim(Active) = 'A' as active,
                   trim(ExpandedStatus) as status,
                   {gcat_date("LDate")} as launched,
                   {gcat_date("DDate")} as ended,
                   trim(DDate) = '-' as ongoing,
                   try_cast(trim(Perigee) as double) as perigee,
                   try_cast(trim(Apogee) as double) as apogee,
                   try_cast(trim(Inc) as double) as inc,
                   nullif(trim(OpOrbit), '-') as op_orbit
            from currentcat
            where trim(Type) like 'P%'                -- payloads only
              and left(trim(JCAT), 1) in ('S', 'A', 'T') -- not analyst objects
        ),
        payloads as (
            select
                l.satcat, l.name, l.country, l.owner, l.launched,
                -- Still in Earth orbit now, or when it ended: re-entered, left, docked.
                l.ongoing and l.status in ('In Earth orbit', 'Lost') as in_orbit_now,
                l.active and l.ongoing as active,
                case when l.ongoing then null else l.ended end as decayed,
                -- The latest orbit if it's still around Earth, else the first phase's.
                case when l.ongoing and l.perigee is not null then l.perigee else f.perigee end as perigee,
                case when l.ongoing and l.apogee is not null then l.apogee else f.apogee end as apogee,
                case when l.ongoing and l.inc is not null then l.inc else f.inc end as inc,
                coalesce(l.op_orbit, f.op_orbit, '') as op_orbit
            from latest l left join first_phase f using (jcat)
            where coalesce(f.primary_body, 'Earth') = 'Earth'
              -- Still up but not around Earth (attached modules, deep space probes): skip.
              and (not l.ongoing or l.status in ('In Earth orbit', 'Lost'))
        )
        select
            *,
            {EARTH_RADIUS_KM} + (perigee + apogee) / 2 as a,
            (apogee - perigee) / (2 * {EARTH_RADIUS_KM} + perigee + apogee) as e,
            case
                when op_orbit like 'LLEO%' or op_orbit like 'LEO%' then 0
                when op_orbit like 'MEO%' then 1
                when op_orbit like 'GEO%' then 2
                else 3
            end as orbit_class,
            {angle("raan")} as raan,
            {angle("argp")} as argp,
            {angle("anomaly")} as anomaly
        from payloads
        where launched is not null
          and perigee > 0 and apogee >= perigee and apogee < {MAX_APOGEE_KM}
          and inc is not null
        order by launched, satcat
        """
    )

    def epoch_days(column: str) -> str:
        return f"epoch({column} - ?::timestamp) / 86400.0"

    rows = con.execute(
        f"""
        select a, e, radians(inc), raan, argp, anomaly,
               {epoch_days("launched")},
               coalesce({epoch_days("decayed")}, {STILL_IN_ORBIT}),
               orbit_class
        from satellites
        order by launched, satcat
        """,
        [epoch.replace(tzinfo=None)] * 2,
    ).fetchnumpy()
    orbits = np.stack([np.asarray(v, dtype=np.float32) for v in rows.values()])

    con.execute(
        "create table names as select * from read_csv(?, header = true, all_varchar = true)",
        [str(ROOT / "names.csv")],
    )

    # Display names: hand-curated names.csv first, then GCAT's own names. GCAT
    # names are often transliterated or formal ("China, People's Republic of"),
    # so countries keep only the part before the first comma or parenthesis,
    # and owners prefer the full name unless it's long.
    display_name = {
        "country": """
            regexp_replace(
                regexp_replace(nullif(trim(o.EName), '-'), '\\s*[,(].*$', ''),
                '^.*\\b(Republic|State) of (the Union of )?', '')
        """,
        "owner": """
            case when length(trim(o.Name)) <= 40 then nullif(trim(o.Name), '-')
                 else nullif(trim(o.ShortName), '-') end
        """,
    }

    def lookup(column: str) -> tuple[list[dict], list[int]]:
        """Distinct codes with display names, and each satellite's index into them."""
        table = con.execute(
            f"""
            select s.{column} as code,
                   coalesce(any_value(n.name), any_value({display_name[column]}), s.{column}) as name,
                   count(*) as n
            from satellites s
            left join orgs o on trim(o.Code) = s.{column}
            left join names n on n.kind = '{column}' and n.code = s.{column}
            group by s.{column} order by n desc
            """
        ).fetchall()
        index = {code: i for i, (code, _, _) in enumerate(table)}
        codes = con.execute(
            f"select {column} from satellites order by launched, satcat"
        ).fetchall()
        return (
            [{"code": code, "name": name} for code, name, _ in table],
            [index[code] for (code,) in codes],
        )

    countries, country_index = lookup("country")
    owners, owner_index = lookup("owner")
    # names.csv can also rename satellites. The ISS is catalogued as its first
    # module, Zarya, which GCAT (reasonably, for the module) lists as inactive.
    names, satcats, active = zip(
        *con.execute(
            """
            select coalesce(n.name, s.name), s.satcat, (s.active or n.name is not null)::int
            from satellites s left join names n on n.kind = 'satellite' and n.code = s.satcat
            order by s.launched, s.satcat
            """
        ).fetchall()
    )

    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "orbits.bin").write_bytes(orbits.tobytes())
    catalog = {
        "generatedAt": datetime.now(UTC).isoformat(),
        "epoch": epoch.isoformat(),
        "count": orbits.shape[1],
        "columns": ORBIT_COLUMNS,
        "orbitClasses": ORBIT_CLASSES,
        "countries": countries,
        "owners": owners,
        "satellites": {
            "name": names,
            "satcat": satcats,
            "country": country_index,
            "owner": owner_index,
            # 1 if GCAT lists the satellite as currently operating.
            "active": active,
        },
        "sources": [
            "GCAT, Jonathan C. McDowell, planet4589.org/space/gcat (CC-BY)",
        ],
    }
    (OUT / "catalog.json").write_text(json.dumps(catalog, separators=(",", ":")))

    in_orbit = int((orbits[7] > 0).sum())
    print(
        f"  {orbits.shape[1]} payloads, {in_orbit} in orbit now "
        f"({sum(active)} operating) -> {OUT}"
    )


if __name__ == "__main__":
    main()
