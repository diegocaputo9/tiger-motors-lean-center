#!/usr/bin/env python3
"""Give styles.css and the site scripts a ?v=<content hash> in every page, so browsers fetch the new
file as soon as it changes instead of mixing a fresh page with a cached old stylesheet.
Run from the repository root before committing:  python3 tools/stamp-assets.py"""
import glob, hashlib, re

ASSETS = ['styles.css', 'auth.js', 'i18n.js', 'i18n-dict.js', 'modules-data.js']
ver = {a: hashlib.sha1(open(a, 'rb').read()).hexdigest()[:8] for a in ASSETS}
for page in glob.glob('*.html'):
    s = open(page, encoding='utf-8').read()
    out = s
    for a, v in ver.items():
        out = re.sub(r'((?:href|src)=")' + re.escape(a) + r'(?:\?v=[0-9a-f]+)?(")', r'\g<1>' + a + '?v=' + v + r'\2', out)
    if out != s:
        open(page, 'w', encoding='utf-8').write(out)
        print('stamped', page)
