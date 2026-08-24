#!/usr/bin/env python3
"""Translate ForgeAI's English locale to Spanish (Latin America) with placeholder checks."""

import concurrent.futures
import json
import os
import re
import sys
import time
from pathlib import Path
from urllib import request, error

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "src/locales/en.json"
TARGET = ROOT / "src/locales/es_419.json"
MODEL = "gpt-5-mini"
CHUNK_SIZE = 20
PLACEHOLDER = re.compile(r"\{\{\w+\}\}")


def should_translate(value: str) -> bool:
    stripped = value.strip()
    return bool(stripped) and not stripped.startswith(("http://", "https://"))


def flatten(value, path=()):
    if isinstance(value, dict):
        for key, child in value.items():
            yield from flatten(child, path + (key,))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            yield from flatten(child, path + (index,))
    elif isinstance(value, str) and should_translate(value):
        yield path, value


def set_at_path(root, path, value):
    current = root
    for segment in path[:-1]:
        current = current[segment]
    current[path[-1]] = value


def call_model(chunk):
    payload = {
        "model": MODEL,
        "max_completion_tokens": 3500,
        "reasoning": {"effort": "minimal"},
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are an expert software localization translator. Translate interface copy from English "
                    "to natural Spanish for Latin America. Keep product names, model names, HTML/Markdown, "
                    "format tokens, keyboard shortcuts, and placeholders such as {{count}} exactly unchanged. "
                    "Return JSON only: an array of translated strings in the exact same order and count as input."
                ),
            },
            {
                "role": "user",
                "content": json.dumps([text for _, text in chunk], ensure_ascii=False),
            },
        ],
    }
    base = os.environ["OPENAI_API_BASE"].rstrip("/")
    endpoint = f"{base}/chat/completions"
    body = json.dumps(payload).encode("utf-8")
    req = request.Request(
        endpoint,
        data=body,
        headers={
            "Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    last_error = None
    for attempt in range(3):
        try:
            with request.urlopen(req, timeout=120) as response:
                raw = json.loads(response.read().decode("utf-8"))
            content = raw["choices"][0]["message"]["content"]
            translations = json.loads(content)
            if not isinstance(translations, list) or len(translations) != len(chunk):
                raise ValueError("El modelo no devolvió la cantidad esperada de traducciones.")
            for (_, source), translated in zip(chunk, translations):
                if not isinstance(translated, str) or not translated.strip():
                    raise ValueError("El modelo devolvió una traducción vacía.")
                if sorted(PLACEHOLDER.findall(source)) != sorted(PLACEHOLDER.findall(translated)):
                    raise ValueError(f"Marcadores modificados: {source!r} -> {translated!r}")
            return translations
        except (error.URLError, error.HTTPError, KeyError, ValueError, json.JSONDecodeError) as exc:
            last_error = exc
            time.sleep(2 ** attempt)
    raise RuntimeError(f"No se pudo traducir un lote: {last_error}")


def main():
    if not os.environ.get("OPENAI_API_KEY") or not os.environ.get("OPENAI_API_BASE"):
        raise RuntimeError("Faltan las credenciales del modelo integrado.")
    original = json.loads(SOURCE.read_text(encoding="utf-8"))
    work_items = list(flatten(original))
    chunks = [work_items[index:index + CHUNK_SIZE] for index in range(0, len(work_items), CHUNK_SIZE)]
    print(f"Traduciendo {len(work_items)} textos en {len(chunks)} lotes con {MODEL}.", flush=True)

    translated = json.loads(json.dumps(original, ensure_ascii=False))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = {executor.submit(call_model, chunk): position for position, chunk in enumerate(chunks)}
        results = {}
        for future in concurrent.futures.as_completed(futures):
            position = futures[future]
            results[position] = future.result()
            print(f"Lote {position + 1}/{len(chunks)} listo.", flush=True)

    for position, chunk in enumerate(chunks):
        for (path, _), translation in zip(chunk, results[position]):
            set_at_path(translated, path, translation)

    TARGET.write_text(json.dumps(translated, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Escrito: {TARGET}", flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
