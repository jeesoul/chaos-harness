#!/usr/bin/env python
"""
search.py — BM25 搜索引擎
读取 CSV 知识库，BM25 排序检索，返回 JSON 结果

调用: python3 search.py --query <text> --domain <domain|all> [--top <n>] [--data-dir <path>]
"""

import argparse
import csv
import json
import os
import sys
from pathlib import Path

try:
    from rank_bm25 import BM25Okapi
    HAS_BM25 = True
except ImportError:
    HAS_BM25 = False

DOMAIN_MAP = {
    "gate-patterns": "gate-patterns.csv",
    "iron-law-rules": "iron-law-rules.csv",
    "test-patterns": "test-patterns.csv",
    "anti-patterns": "anti-patterns.csv",
    "ui-patterns": "ui-patterns.csv",
    "prd-quality-rules": "prd-quality-rules.csv",
    "ui-color-palettes": "ui-color-palettes.csv",
    "ui-styles": "ui-styles.csv",
    "ui-typography": "ui-typography.csv",
    "ui-components": "ui-components.csv",
    "ui-animations": "ui-animations.csv",
    "ui-responsive": "ui-responsive.csv",
    "ui-product-types": "ui-product-types.csv",
    "ui-ux-guidelines": "ui-ux-guidelines.csv",
    "ui-charts": "ui-charts.csv",
}


def resolve_data_dir(script_dir, data_dir_arg):
    if data_dir_arg:
        return Path(data_dir_arg)
    return script_dir.parent / "data"


def load_csv(data_dir, filename):
    path = data_dir / filename
    if not path.exists():
        return None, f"CSV not found: {path}"
    rows = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rid = row.get("id", "").strip()
            if not rid:
                print(f"WARNING: skipping row with empty id in {filename}", file=sys.stderr)
                continue
            rows.append(row)
    return rows, None


def tokenize(text):
    return list(text.lower())


def bm25_search(corpus, tokenized_query, top_n):
    if HAS_BM25:
        bm25 = BM25Okapi(corpus)
        scores = bm25.get_scores(tokenized_query)
    else:
        scores = tfidf_fallback(corpus, tokenized_query)
    ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
    return ranked[:top_n]


def tfidf_fallback(corpus, tokenized_query):
    query_set = set(tokenized_query)
    scores = []
    for doc in corpus:
        doc_set = set(doc)
        intersection = len(query_set & doc_set)
        scores.append(intersection / max(len(doc_set), 1))
    return scores


def search_domain(data_dir, domain, query, top_n):
    if domain == "all":
        all_results = []
        for dname, fname in DOMAIN_MAP.items():
            rows, err = load_csv(data_dir, fname)
            if err:
                print(f"WARNING: {err}", file=sys.stderr)
                continue
            results = search_rows(rows, query, top_n * 3, dname)
            all_results.extend(results)
        all_results.sort(key=lambda x: x["score"], reverse=True)
        return all_results[:top_n], None
    else:
        fname = DOMAIN_MAP.get(domain)
        if not fname:
            return None, f"Unknown domain: {domain}"
        rows, err = load_csv(data_dir, fname)
        if err:
            return None, err
        results = search_rows(rows, query, top_n, domain)
        return results, None


def search_rows(rows, query, top_n, domain):
    docs = []
    for row in rows:
        text = " ".join(str(v) if v is not None else "" for v in row.values())
        docs.append(tokenize(text))
    query_tokens = tokenize(query)
    ranked = bm25_search(docs, query_tokens, top_n)
    results = []
    for idx, score in ranked:
        if score <= 0:
            continue
        row = rows[idx]
        matched = [k for k, v in row.items() if v and any(q in str(v).lower() for q in query_tokens)]
        results.append({
            "id": row.get("id", ""),
            "score": round(float(score), 2),
            "source_domain": domain,
            "matched_fields": matched,
            "data": {k: v for k, v in row.items() if v is not None},
        })
    return results


def main():
    parser = argparse.ArgumentParser(description="BM25 search engine")
    parser.add_argument("--query", required=True, help="Search query")
    parser.add_argument("--domain", required=True, help="Domain or 'all'")
    parser.add_argument("--top", type=int, default=5, help="Top N results")
    parser.add_argument("--data-dir", default=None, help="Path to data directory")
    args = parser.parse_args()

    script_dir = Path(__file__).resolve().parent
    data_dir = resolve_data_dir(script_dir, args.data_dir)

    results, err = search_domain(data_dir, args.domain, args.query, args.top)
    if err:
        print(err, file=sys.stderr)
        print(json.dumps({"error": err, "query": args.query, "domain": args.domain, "results": [], "total_results": 0}))
        sys.exit(1)

    output = {
        "query": args.query,
        "domain": args.domain,
        "results": results,
        "total_results": len(results),
    }
    print(json.dumps(output, ensure_ascii=False))
    sys.exit(0)


if __name__ == "__main__":
    main()
