#!/usr/bin/env python3
"""Make the light copies of the testimonial photos that the testimonials page shows in its grid
(testimonial-photos/thumbs/, 760px wide). The full photos stay where they are and open when clicked.
Run from the repository root after adding or replacing a photo:  python3 tools/make-thumbs.py"""
import glob, os
from PIL import Image, ImageOps

W = 760
os.makedirs('testimonial-photos/thumbs', exist_ok=True)
for f in sorted(glob.glob('testimonial-photos/*.jpg')):
    out = 'testimonial-photos/thumbs/' + os.path.basename(f)
    if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(f):
        continue
    im = ImageOps.exif_transpose(Image.open(f)).convert('RGB')
    if im.width > W:
        im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
    im.save(out, 'JPEG', quality=76, optimize=True, progressive=True, subsampling=2)
    print('made', out, os.path.getsize(f) // 1024, 'KB ->', os.path.getsize(out) // 1024, 'KB')
