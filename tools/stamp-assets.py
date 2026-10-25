#!/usr/bin/env python3
"""Give styles.css and the site scripts a ?v=<content hash> in every page, so browsers fetch the new
file as soon as it changes instead of mixing a fresh page with a cached old stylesheet.
Also writes "Last updated <date> · Revision <n>" into the page footers, where n is the number of
commits on main including the one about to be made.
Run from the repository root before committing:  python3 tools/stamp-assets.py"""
import datetime, glob, hashlib, re, subprocess

rev = int(subprocess.run(['git', 'rev-list', '--count', 'HEAD'], capture_output=True, text=True).stdout.strip() or 0) + 1
today = datetime.date.today()
stamp = 'Last updated %s %d, %d · Revision %d' % (today.strftime('%B'), today.day, today.year, rev)

ASSETS = ['styles.css', 'auth.js', 'i18n.js', 'i18n-dict.js', 'modules-data.js']
ver = {a: hashlib.sha1(open(a, 'rb').read()).hexdigest()[:8] for a in ASSETS}
for page in glob.glob('*.html'):
    s = open(page, encoding='utf-8').read()
    out = s
    for a, v in ver.items():
        out = re.sub(r'((?:href|src)=")' + re.escape(a) + r'(?:\?v=[0-9a-f]+)?(")', r'\g<1>' + a + '?v=' + v + r'\2', out)
    out = re.sub(r'(<p class="site-rev">)[^<]*(</p>)', r'\g<1>' + stamp + r'\2', out)
    if out != s:
        open(page, 'w', encoding='utf-8').write(out)
        print('stamped', page)
