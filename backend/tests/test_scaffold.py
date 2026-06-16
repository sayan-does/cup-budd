import os
from pathlib import Path


def test_app_version():
    import app
    assert app.__version__ == "0.1.0"


def test_config_imports():
    import app.config as _  # noqa: F401 - must not raise


def test_pyproject_toml_exists():
    assert Path("pyproject.toml").exists()


def test_dockerfile_exists():
    assert Path("Dockerfile").exists()


def test_env_example_exists():
    assert Path(".env.example").exists()


def test_alembic_ini_exists():
    assert Path("alembic.ini").exists()


def test_app_package_exists():
    assert Path("app/__init__.py").exists() or os.path.isdir("app")


def test_tests_directory_exists():
    assert os.path.isdir("tests")


def test_alembic_versions_directory_exists():
    assert os.path.isdir("alembic/versions")


def test_alembic_env_exists():
    assert Path("alembic/env.py").exists()


def test_templates_directory_exists():
    assert os.path.isdir("app/templates/notifications")


def test_project_structure():
    expected_dirs = [
        "app",
        "app/db",
        "app/db/models",
        "app/schemas",
        "app/api",
        "app/api/v1",
        "app/services",
        "app/jobs",
        "app/templates",
        "app/templates/notifications",
        "alembic",
        "alembic/versions",
        "tests",
    ]
    for d in expected_dirs:
        assert os.path.isdir(d), f"Missing directory: {d}"
