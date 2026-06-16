from pathlib import Path


def test_migration_files_exist():
    versions_dir = Path("alembic/versions")
    migration_files = list(versions_dir.glob("*.py"))
    assert len(migration_files) > 0, "No migration files found"


def test_migration_importable():
    from alembic.script import ScriptDirectory
    script = ScriptDirectory("alembic")
    heads = script.get_heads()
    assert len(heads) > 0
    for head in heads:
        rev = script.get_revision(head)
        assert rev is not None
        assert rev.doc is not None


def test_migration_has_upgrade_and_downgrade():
    import importlib.util
    import sys

    versions_dir = Path("alembic/versions")
    for migration_file in sorted(versions_dir.glob("*.py")):
        if migration_file.name == "__init__.py":
            continue
        module_name = migration_file.stem
        spec = importlib.util.spec_from_file_location(module_name, migration_file)
        module = importlib.util.module_from_spec(spec)
        sys.modules[module_name] = module
        spec.loader.exec_module(module)
        assert hasattr(module, "upgrade"), f"{migration_file.name} missing upgrade()"
        assert hasattr(module, "downgrade"), f"{migration_file.name} missing downgrade()"
