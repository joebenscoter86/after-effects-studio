import subprocess,sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
v=sys.argv[1]
base=Path('quality/renders/2026-10-10-portable-causal-native')
folder=base/(v+'-frames');folder.mkdir(exist_ok=True)
subprocess.run(['ffmpeg','-v','error','-i',str(base/('threshold-'+v+'.mp4')),'-start_number','0',str(folder/'f%03d.png')],check=True)
offset=9 if v=='v2' else 0
groups={'broad':[0,12,24,40,45,75,105+offset,120+offset,135+offset,147+offset,159+offset,239],
'threshold':[f+offset for f in range(102,111)],
'travel':[f+offset for f in range(116,125)],
'contact':[f+offset for f in range(132,141)],
'opening':[f+offset for f in [137,140,144,148,152,156,157,158,159,160,161,162]]}
for name,frames in groups.items():
    cols=3;tw=640;th=360;pad=26
    sheet=Image.new('RGB',(cols*tw,((len(frames)+cols-1)//cols)*(th+pad)),(245,245,245))
    d=ImageDraw.Draw(sheet)
    for i,f in enumerate(frames):
        im=Image.open(folder/('f%03d.png'%f)).convert('RGB').resize((tw,th))
        x=(i%cols)*tw;y=(i//cols)*(th+pad)
        sheet.paste(im,(x,y+pad));d.text((x+12,y+6),v+' / '+name+' / f'+str(f)+' / '+('%.3fs'%(f/30)),fill=(0,0,0))
    sheet.save(base/(v+'-'+name+'-sheet.jpg'),quality=95)
print(v,groups)

