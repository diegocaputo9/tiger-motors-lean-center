#!/usr/bin/env python3
"""Re-save the PNG images embedded in a page with a high-quality 256-colour palette (libimagequant), keeping them embedded.
Dry run writes before/after sheets to ../cmpimg; add --apply to write the page.  Needs: pip install imagequant pillow
Usage from the repository root:  python3 tools/recompress-embedded-png.py [--apply] index.html modules.html"""
import re,base64,io,sys,hashlib,os,imagequant
from PIL import Image, ImageChops, ImageStat
pages=sys.argv[1:]; apply='--apply' in pages; pages=[p for p in pages if p!='--apply']
cache={}
def recompress(b64):
    if b64 in cache: return cache[b64]
    raw=base64.b64decode(b64); im=Image.open(io.BytesIO(raw)); im.load()
    rgba=im.convert('RGBA')
    q=imagequant.quantize_pil_image(rgba,dithering_level=1.0,max_colors=256,min_quality=85,max_quality=100)
    out=io.BytesIO(); q.save(out,'PNG',optimize=True)
    back=Image.open(io.BytesIO(out.getvalue())).convert('RGBA')
    # error measured on colour composited over white and over navy, so transparent edges count too
    err=0
    for bg in ((255,255,255,255),(12,35,64,255)):
        a=Image.alpha_composite(Image.new('RGBA',rgba.size,bg),rgba).convert('RGB')
        b=Image.alpha_composite(Image.new('RGBA',rgba.size,bg),back).convert('RGB')
        d=ImageChops.difference(a,b); st=ImageStat.Stat(d)
        err=max(err,max(st.mean), max(x[1] for x in d.getextrema())/255*0)  # mean error per channel
    n=base64.b64encode(out.getvalue()).decode()
    h=hashlib.md5(raw).hexdigest()[:8]
    res=(n if len(n)<len(b64)*0.9 else None, err, im.size, h, rgba, back)
    cache[b64]=res; return res
for p in pages:
    s=open(p,encoding='utf-8').read(); n0=len(s)
    def sub(m):
        new,err,size,h,a,b=recompress(m.group(1))
        tag='KEEP' if new is None or err>1.5 else 'OK'
        print(p,h,size,len(m.group(1))//1024,'KB ->',(len(new)//1024 if new else '-'),'KB','meanerr=%.2f'%err,tag)
        if not apply:
            w,hh=a.size; sheet=Image.new('RGBA',(w*2+10,hh),(12,35,64,255)); sheet.alpha_composite(a,(0,0)); sheet.alpha_composite(b,(w+10,0)); sheet.convert('RGB').save(os.path.join('..','cmpimg','%s.png')%h)
        return 'data:image/png;base64,'+(new if tag=='OK' else m.group(1))
    s2=re.sub(r'data:image/png;base64,([A-Za-z0-9+/=]+)',sub,s)
    print(p,n0//1024,'KB ->',len(s2)//1024,'KB')
    if apply: open(p,'w',encoding='utf-8').write(s2)
