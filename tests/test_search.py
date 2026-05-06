#!/usr/bin/env python3
"""Tests for BM25 search engine."""
import json
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT_DIR = Path(__file__).resolve().parent.parent / "scripts"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def run_search(query, domain, top=5):
    result = subprocess.run(
        [sys.executable, str(SCRIPT_DIR / "search.py"), "--query", query, "--domain", domain, "--top", str(top), "--data-dir", str(DATA_DIR)],
        capture_output=True, text=True
    )
    return result


class TestBM25Search:
    def test_basic_search_returns_json(self):
        r = run_search("test", "gate-patterns")
        assert r.returncode == 0
        data = json.loads(r.stdout)
        assert "results" in data
        assert "total_results" in data

    def test_unknown_domain_returns_error(self):
        r = run_search("test", "unknown-domain")
        data = json.loads(r.stdout)
        assert "error" in data

    def test_all_domain_searches_multiple_csvs(self):
        r = run_search("test", "all")
        assert r.returncode == 0
        data = json.loads(r.stdout)
        assert "results" in data
        assert data["total_results"] >= 0

    def test_bm25_cross_domain(self):
        r = run_search("test", "all")
        assert r.returncode == 0
        data = json.loads(r.stdout)
        assert "results" in data
