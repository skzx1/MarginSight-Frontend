"""Local heuristic audit. Never prints matching values; not a substitute for review.

Scans first-party text and ZIP/Office/gzip copies, including ignored local data.
Vendor dependencies are excluded. Reports paths/types/line numbers only.
"""
from pathlib import Path
import gzip
import io
import json
import re
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {'node_modules', '.git', '__pycache__', '.next'}
REPORT = ROOT / '.local' / 'secret-audit-report.json'
MAX_ENTRY = 64 * 1024 * 1024
MAX_ARCHIVE_TOTAL = 256 * 1024 * 1024
RULES = {
    'AWS_ACCESS_KEY_ID': r'\b(?:AKIA|ASIA)[A-Z0-9]{16}\b',
    'PRIVATE_KEY': r'-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----',
    'GITHUB_TOKEN': r'\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b',
    'SLACK_TOKEN': r'\bxox[baprs]-[A-Za-z0-9-]{20,}',
    'GOOGLE_API_KEY': r'\bAIza[A-Za-z0-9_-]{35}\b',
    'STRIPE_LIVE_KEY': r'\b[rs]k_live_[A-Za-z0-9]{20,}\b',
    'JWT_LITERAL': r'\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}',
    'AWS_SIGNED_URL': r'(?i)X-Amz-(?:Signature|Security-Token)=[A-Za-z0-9%+/=_-]{16,}',
    'CREDENTIAL_URL': r'(?i)\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|https?)://[^\s:/"\']+:[^\s@/"\']+@',
    'SECRET_LITERAL': r'''(?ix)(?:["']?)(?:aws_secret_access_key|aws_session_token|client_secret|channel_secret|channel_access_token|api_key|api_secret|access_token|refresh_token|password|passwd|secret_key|private_key)(?:["']?)\s*[:=]\s*["']([^"'\r\n]{12,})["']''',
}
COMPILED = {name: re.compile(pattern) for name, pattern in RULES.items()}
findings, privacy, skipped = [], [], []
stats = {'filesystemFiles': 0, 'textEntries': 0, 'archiveEntries': 0, 'pdfFilesNotExtracted': 0}


def scan_text(data, label):
    if b'\x00' in data[:4096]:
        return
    text = data.decode('utf-8', errors='replace')
    stats['textEntries'] += 1
    generated = any(part in label.replace('!', '/').split('/') for part in ('dist', 'out', '.next')) or label.endswith('.map')
    for name, pattern in COMPILED.items():
        if name == 'SECRET_LITERAL' and (generated or len(data) > 2 * 1024 * 1024):
            continue  # SDK bundles contain examples; high-confidence rules still run.
        for match in pattern.finditer(text):
            value = match.group(1) if name == 'SECRET_LITERAL' else match.group()
            if name == 'SECRET_LITERAL' and (re.search(r'\s|[{}<>`]', value) or value.startswith(('process.', 'https://', '${'))):
                continue
            findings.append({'path': label, 'rule': name, 'line': text.count('\n', 0, match.start()) + 1})
    count = 0
    if not generated and len(data) < 2 * 1024 * 1024 and '@' in text:
        count = len(re.findall(r'(?i)\b[A-Z0-9._%+-]{1,64}@[A-Z0-9.-]{1,253}\.[A-Z]{2,24}\b', text))
    if count:
        privacy.append({'path': label, 'type': 'EMAIL_LIKE_TEXT', 'count': count})


def scan_data(data, label, depth=0):
    ext = Path(label).suffix.lower()
    if ext in {'.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico'}:
        skipped.append({'path': label, 'reason': 'image: visual review required'})
        return
    if ext == '.pdf':
        stats['pdfFilesNotExtracted'] += 1
        skipped.append({'path': label, 'reason': 'PDF: not extracted by this text scanner'})
        return
    if ext in {'.zip', '.docx', '.xlsx', '.pptx'}:
        if depth >= 3:
            skipped.append({'path': label, 'reason': 'archive nesting limit'})
            return
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                total = 0
                for entry in archive.infolist():
                    if entry.is_dir():
                        continue
                    total += entry.file_size
                    target = label + '!' + entry.filename
                    if entry.file_size > MAX_ENTRY or total > MAX_ARCHIVE_TOTAL:
                        skipped.append({'path': target, 'reason': 'archive size limit'})
                        continue
                    if any(p in SKIP_DIRS for p in Path(entry.filename).parts):
                        continue
                    stats['archiveEntries'] += 1
                    scan_data(archive.read(entry), target, depth + 1)
        except (zipfile.BadZipFile, RuntimeError, OSError):
            skipped.append({'path': label, 'reason': 'unreadable archive'})
        return
    if ext == '.gz':
        try:
            with gzip.GzipFile(fileobj=io.BytesIO(data)) as compressed:
                expanded = compressed.read(MAX_ENTRY + 1)
            if len(expanded) > MAX_ENTRY:
                skipped.append({'path': label, 'reason': 'gzip size limit'})
            else:
                scan_text(expanded, label + '!expanded')
        except OSError:
            skipped.append({'path': label, 'reason': 'unreadable gzip'})
        return
    scan_text(data, label)


def main():
    import os
    for base, directories, names in os.walk(ROOT):
        directories[:] = [d for d in directories if d not in SKIP_DIRS]
        for name in names:
            path = Path(base) / name
            if path == REPORT or path.is_symlink():
                continue
            label = path.relative_to(ROOT).as_posix()
            stats['filesystemFiles'] += 1
            if name in {'credentials', 'id_rsa', 'id_ed25519', '.netrc', '.npmrc', '.pypirc'} or path.suffix.lower() in {'.pem', '.key', '.p12', '.pfx'}:
                findings.append({'path': label, 'rule': 'CREDENTIAL_FILENAME', 'line': None})
            if path.stat().st_size > MAX_ENTRY:
                skipped.append({'path': label, 'reason': 'file size limit'})
                continue
            scan_data(path.read_bytes(), label)
    report = {'scanner': 'local heuristic; candidates require review; no matching values retained', 'stats': stats, 'findings': findings, 'privacy': privacy, 'skipped': skipped}
    REPORT.parent.mkdir(exist_ok=True)
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({'stats': stats, 'candidateCount': len(findings), 'privacyFileCount': len(privacy), 'skippedCount': len(skipped), 'report': str(REPORT)}, indent=2))
    for finding in findings[:150]:
        print(json.dumps(finding, ensure_ascii=True))


if __name__ == '__main__':
    main()
