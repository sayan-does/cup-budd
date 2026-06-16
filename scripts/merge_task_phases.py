"""Merge phases/*.md back into a single TASKS.md with in-file phase sections."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read_section_0(tasks_path: Path) -> str:
    text = tasks_path.read_text(encoding="utf-8")
    m = re.search(r"^## 1\. Five phases", text, re.M)
    if m:
        return text[: m.start()].rstrip() + "\n"
    return text


def merge_phases(side: str, section_0_end_marker: str, phase_names: list[str]) -> None:
    tasks_path = ROOT / f"docs/{side}-specs/TASKS.md"
    phases_dir = ROOT / f"docs/{side}-specs/phases"

    header = read_section_0(tasks_path)

    # Replace 0.6 / phase table with in-file phase overview
    header = re.sub(
        r"### 0\.6 Order of work.*?(?=^---|\Z)",
        "",
        header,
        flags=re.M | re.S,
    )

    parts = [header.rstrip(), "", "---", ""]

    for idx, pname in enumerate(phase_names, start=1):
        phase_file = phases_dir / f"PHASE_{idx}.md"
        body = phase_file.read_text(encoding="utf-8")
        # Strip per-file breadcrumb and duplicate title block
        body = re.sub(
            r"^> \*\*Part of:\*\*.*?\n> \*\*Tasks:\*\*.*?\n\n",
            "",
            body,
            flags=re.M,
        )
        body = re.sub(rf"^# {re.escape(pname)}\n\n.*?\n\n---\n\n", "", body, count=1, flags=re.M | re.S)
        # Extract phase gate
        gate_match = re.search(r"## Phase gate\n\n(.*?)(?:\n\n---|\Z)", body, re.S)
        gate = gate_match.group(1).strip() if gate_match else ""
        body = re.sub(r"\n---\n\n## Phase gate.*", "", body, flags=re.S)
        body = re.sub(r"\n---\n\n## Final verification.*", "", body, flags=re.S)
        body = body.strip()

        parts.extend(
            [
                f"## PHASE {idx} — {pname.split(' — ', 1)[-1]}",
                "",
                f"> **Complete every task in this phase before starting PHASE {idx + 1}.**",
                f"> **Phase gate (run after all tasks below):**",
                "",
                "```bash",
                gate.replace("```bash\n", "").replace("\n```", "").strip(),
                "```",
                "",
                "---",
                "",
                body,
                "",
                "---",
                "",
            ]
        )

    # Final verification at end
    if side == "backend":
        final = """## FINAL VERIFICATION (after PHASE 5)

1. Run the PHASE 5 gate command.
2. Green in one clean run → backend complete.
3. Any red → fix the failing task (§0.4 loop), then **re-run the entire PHASE 5 gate from the top**.
4. Repeat until green in a single run."""
        gate_cmd = "cd backend && ruff check . && alembic upgrade head && pytest -q && docker build -t cup-budd-backend ."
    else:
        final = """## FINAL VERIFICATION (after PHASE 5)

1. Run the PHASE 5 gate command.
2. Green in one clean run → frontend complete.
3. Any red → fix the failing task (§0.4 loop), then **re-run the entire PHASE 5 gate from the top**.
4. Repeat until green in a single run.
5. Run manual integration smoke from [`../BUILD_ORDER.md`](../BUILD_ORDER.md) §5."""
        gate_cmd = "cd frontend && npm run lint && npm run typecheck && npm run test -- --run && npm run build && npm run test:e2e"

    parts.extend([final, ""])

    # Update section 1 in header - rebuild full doc with new section 1 table
    out = "\n".join(parts)
    phase_table = build_phase_table(side, phase_names)
    out = re.sub(
        r"## 1\. Five phases.*?(?=^## PHASE 1|\Z)",
        phase_table,
        out,
        count=1,
        flags=re.S,
    )
    if "## PHASE 1" not in out[:2000]:
        # Insert phase table before PHASE 1 if missing
        out = out.replace("---\n\n## PHASE 1", phase_table + "\n---\n\n## PHASE 1", 1)

    tasks_path.write_text(out, encoding="utf-8")
    print(f"Wrote {tasks_path}")


def build_phase_table(side: str, phase_names: list[str]) -> str:
    if side == "backend":
        rows = [
            ("1", "T1–T3", "Project foundation", "scaffold, config, DB session"),
            ("2", "T4–T6", "Database & schemas", "models, migrations, Pydantic"),
            ("3", "T7–T8", "External data & cache", "World Cup API client, Redis"),
            ("4", "T9–T13", "Notification pipeline", "templates, rules, push, polling, jobs"),
            ("5", "T14–T16", "REST API & deployment", "routes, app wiring, deploy"),
        ]
    else:
        rows = [
            ("1", "T1–T3", "App foundation", "scaffold, AppShell, store"),
            ("2", "T4–T5", "API client & push hooks", "MSW, service worker"),
            ("3", "T6–T8", "Shared components", "UI, team, match components"),
            ("4", "T9–T13", "Screens & routing", "Onboarding, Home, Match, Profile"),
            ("5", "T14–T15", "PWA, E2E & deploy", "manifest, Playwright, Cloudflare"),
        ]

    lines = [
        "## 1. Five phases — work in order (same file)",
        "",
        "This file is divided into **PHASE 1 → 5** below. Complete each phase fully and pass its **phase gate** before scrolling to the next phase.",
        "",
        "| Phase | Tasks | Name | Builds |",
        "|-------|-------|------|--------|",
    ]
    for num, tasks, name, builds in rows:
        lines.append(f"| **{num}** | {tasks} | {name} | {builds} |")
    lines.extend(["", "### 0.6 Task order (do not reorder across phases)", ""])
    if side == "backend":
        lines.append("```")
        lines.append("PHASE 1: T1 → T2 → T3")
        lines.append("PHASE 2: T4 → T5 → T6")
        lines.append("PHASE 3: T7 → T8")
        lines.append("PHASE 4: T9 → T10 → T11 → T12 → T13")
        lines.append("PHASE 5: T14 → T15 → T16")
        lines.append("```")
    else:
        lines.append("```")
        lines.append("PHASE 1: T1 → T2 → T3")
        lines.append("PHASE 2: T4 → T5")
        lines.append("PHASE 3: T6 → T7 → T8")
        lines.append("PHASE 4: T9 → T10 → T11 → T12 → T13")
        lines.append("PHASE 5: T14 → T15")
        lines.append("```")
    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    merge_phases(
        "backend",
        "",
        [
            "PHASE 1 — Project foundation",
            "PHASE 2 — Database & schemas",
            "PHASE 3 — External data & cache",
            "PHASE 4 — Notification pipeline",
            "PHASE 5 — REST API & deployment",
        ],
    )
    merge_phases(
        "frontend",
        "",
        [
            "PHASE 1 — App foundation",
            "PHASE 2 — API client & push hooks",
            "PHASE 3 — Shared components",
            "PHASE 4 — Screens & routing",
            "PHASE 5 — PWA, E2E & deploy",
        ],
    )
    print("done")
