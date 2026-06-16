"""Split TASKS.md into PHASE_1..5.md files."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def split_tasks(src_path: Path, out_dir: Path, phases: list) -> None:
    text = src_path.read_text(encoding="utf-8")
    m = re.search(r"^## T1 ", text, re.M)
    if not m:
        raise SystemExit(f"No T1 in {src_path}")
    body = text[m.start() :]
    parts = re.split(r"^(## T\d+)", body, flags=re.M)
    tasks: dict[int, str] = {}
    for i in range(1, len(parts), 2):
        title = parts[i].strip()
        num = int(re.search(r"T(\d+)", title).group(1))
        tasks[num] = title + parts[i + 1]

    final = ""
    fm = re.search(r"^## FINAL VERIFICATION", body, re.M)
    if fm:
        final = body[fm.start() :]

    out_dir.mkdir(parents=True, exist_ok=True)

    for idx, (pname, tnums, intro, gate) in enumerate(phases, start=1):
        task_range = f"T{tnums[0]}" + (f"–T{tnums[-1]}" if len(tnums) > 1 else "")
        lines = [
            f"> **Part of:** [`TASKS.md`](../TASKS.md) · **Phase {idx} of 5**",
            f"> **Tasks:** {task_range}",
            "",
            f"# {pname}",
            "",
            intro.replace("\\n", "\n"),
            "",
            "---",
            "",
        ]
        for n in tnums:
            if n not in tasks:
                raise SystemExit(f"T{n} missing in {src_path}")
            lines.append(tasks[n].rstrip())
            lines.extend(["", "---", ""])

        lines.extend(["## Phase gate", "", gate.replace("\\n", "\n"), ""])
        if idx == 5 and final:
            lines.extend(["---", "", final])

        (out_dir / f"PHASE_{idx}.md").write_text("\n".join(lines), encoding="utf-8")
        print(f"Wrote {out_dir / f'PHASE_{idx}.md'}")


backend_phases = [
    (
        "PHASE 1 — Project foundation",
        list(range(1, 4)),
        "**Goal:** Runnable Python project, typed config, async DB session.\n"
        "**Outcome:** `pytest` passes on scaffold + config + DB session tests.",
        "```bash\ncd backend && pip install -e \".[dev]\" && "
        "pytest tests/test_scaffold.py tests/test_config.py tests/test_db_session.py -q && ruff check .\n```\n\n"
        "Do not start Phase 2 until this gate is green.",
    ),
    (
        "PHASE 2 — Database & schemas",
        list(range(4, 7)),
        "**Goal:** ORM models, Alembic migrations, Pydantic request/response schemas.\n"
        "**Outcome:** `alembic upgrade head` builds full schema; model + schema tests pass.",
        "```bash\ncd backend && alembic upgrade head && "
        "pytest tests/test_models.py tests/test_migrations.py tests/test_schemas.py -q && ruff check .\n```",
    ),
    (
        "PHASE 3 — External data & cache",
        [7, 8],
        "**Goal:** World Cup API client + Redis cache layer.\n"
        "**Outcome:** All API endpoints mocked in tests; cache keys match spec.",
        "```bash\ncd backend && pytest tests/test_zafronix_client.py tests/test_cache.py -q && ruff check .\n```",
    ),
    (
        "PHASE 4 — Notification pipeline",
        list(range(9, 14)),
        "**Goal:** Templates, rules, push delivery, live polling, background jobs.\n"
        "**Outcome:** End-to-end notification path tested with mocks.",
        "```bash\ncd backend && pytest tests/test_templates.py tests/test_notification_rules.py "
        "tests/test_push_delivery.py tests/test_polling.py tests/test_jobs.py -q && ruff check .\n```",
    ),
    (
        "PHASE 5 — REST API & deployment",
        list(range(14, 17)),
        "**Goal:** FastAPI routes, app wiring, Docker/systemd deploy artifacts, full test suite.\n"
        "**Outcome:** Entire backend green + docker build.",
        "```bash\ncd backend && ruff check . && alembic upgrade head && pytest -q && "
        "docker build -t cup-budd-backend .\n```",
    ),
]

frontend_phases = [
    (
        "PHASE 1 — App foundation",
        list(range(1, 4)),
        "**Goal:** Vite/React/TS/Tailwind scaffold, AppShell/Header, Zustand user store.\n"
        "**Outcome:** Typecheck + layout + store tests pass.",
        "```bash\ncd frontend && npm run typecheck && npm run test -- --run "
        "src/test/smoke.test.tsx src/components/layout src/stores && npm run lint\n```",
    ),
    (
        "PHASE 2 — API client & push hooks",
        [4, 5],
        "**Goal:** Typed API client + MSW, service worker + push/install hooks.\n"
        "**Outcome:** API and hook tests pass.",
        "```bash\ncd frontend && npm run typecheck && npm run test -- --run src/api src/hooks && npm run lint\n```",
    ),
    (
        "PHASE 3 — Shared components",
        list(range(6, 9)),
        "**Goal:** UI primitives, team components, match components.\n"
        "**Outcome:** All component tests pass.",
        "```bash\ncd frontend && npm run typecheck && npm run test -- --run src/components && npm run lint\n```",
    ),
    (
        "PHASE 4 — Screens & routing",
        list(range(9, 14)),
        "**Goal:** Routes/guards + Onboarding, Home, Live Match, Profile screens.\n"
        "**Outcome:** All screen + App routing tests pass.",
        "```bash\ncd frontend && npm run typecheck && npm run test -- --run src/App.test.tsx src/screens && npm run lint\n```",
    ),
    (
        "PHASE 5 — PWA, E2E & deploy",
        [14, 15],
        "**Goal:** Manifest/icons, production build, Playwright E2E, Cloudflare deploy config.\n"
        "**Outcome:** Full frontend gate green.",
        "```bash\ncd frontend && npm run lint && npm run typecheck && npm run test -- --run && "
        "npm run build && npm run test:e2e\n```",
    ),
]

if __name__ == "__main__":
    split_tasks(
        ROOT / "docs/backend-specs/TASKS.md",
        ROOT / "docs/backend-specs/phases",
        backend_phases,
    )
    split_tasks(
        ROOT / "docs/frontend-specs/TASKS.md",
        ROOT / "docs/frontend-specs/phases",
        frontend_phases,
    )
    print("done")
