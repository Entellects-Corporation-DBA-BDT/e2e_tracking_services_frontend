from pathlib import Path
import fitz,json,math
from openpyxl import load_workbook
R=Path(__file__).parent;O=R/"Navarasa_Kitchen_Signature_Menu_Updated.pdf"; W,H=612,792
M=(.035,.29,.28);G=(.92,.46,.12);C=(1,.97,.91);I=(.20,.08,.16);U=(.34,.29,.27)
fs={"r":r"C:\Windows\Fonts\georgia.ttf","b":r"C:\Windows\Fonts\georgiab.ttf","s":r"C:\Windows\Fonts\segoeui.ttf","sb":r"C:\Windows\Fonts\segoeuib.ttf"}
w=load_workbook(R/"menu.xlsx",data_only=True).active
A=[(str(a),str(b),str(c),str(d or "")) for a,b,c,d in w.iter_rows(min_row=4,values_only=True) if a]
# Expand the Indo-Chinese matrix into individually priced dishes.
expanded=[]
for row in A:
 if row[0] != "INDO-CHINESE SPECIALS":
  expanded.append(row)
  continue
 for dish in ("Fried Rice","Schezwan Fried Rice","Schezwan Noodles","Hakka Noodles","Street Style Fried Rice","Street Style Noodles"):
  for kind,price in (("Veg","$13.99"),("Paneer","$13.99"),("Veg Manchurian","$13.99"),("Egg","$13.99"),("Chicken","$14.99"),("Shrimp","$15.99")):
   expanded.append((row[0],f"{kind} {dish}",price,""))
A=expanded
cats=list(dict.fromkeys(x[0] for x in A))
D=fitz.open()
def setup(p):
 for n,f in fs.items():p.insert_font(fontname=n,fontfile=f)
def image(p,r,f,k=True):p.insert_image(r,filename=str(R/f),keep_proportion=k)
def wrap(t,f,z,m):
 q="";a=[]
 for v in t.split():
  n=(q+" "+v).strip()
  if fitz.get_text_length(n,fontname=("Times-Bold" if f=="b" else "Helvetica"),fontsize=z)<=m:q=n
  else:
   if q:a.append(q)
   q=""
   for ch in v:
    if fitz.get_text_length(q+ch,fontname=("Times-Bold" if f=="b" else "Helvetica"),fontsize=z)<=m:q+=ch
    else:a.append(q);q=ch
 if q:a.append(q)
 return a
def base(p,n):
 p.draw_rect(p.rect,fill=C,color=None)
 # restrained patterned paper texture
 for xx in range(18,612,48):
  for yy in range(104,744,48):
   p.draw_circle((xx,yy),8,color=G,width=.28,stroke_opacity=.075)
   p.draw_line((xx-8,yy),(xx,yy-8),color=M,width=.2,stroke_opacity=.055);p.draw_line((xx,yy-8),(xx+8,yy),color=M,width=.2,stroke_opacity=.055)
 # oversized, softly visible restaurant-logo watermark
 image(p,(96,204,516,624),"logo_watermark.png")
 # three coordinated masthead designs
 style=n%3
 if style==0:
  p.draw_rect((0,0,W,82),fill=M,color=None);p.draw_rect((0,0,W,5),fill=G,color=None);p.draw_rect((0,70,W,76),fill=G,color=None)
  for xx in range(12,612,24):p.draw_circle((xx,76),6,fill=G,color=G)
 elif style==1:
  p.draw_rect((0,0,W,76),fill=M,color=None);p.draw_rect((0,66,W,82),fill=G,color=None)
  p.draw_line((0,60),(612,26),color=(1,.78,.35),width=1.2,stroke_opacity=.45)
  for xx in range(380,620,28):p.draw_circle((xx,17),7,color=G,width=.6,stroke_opacity=.55)
 else:
  p.draw_rect((0,0,W,82),fill=M,color=None);p.draw_rect((0,0,170,82),fill=G,color=None)
  p.draw_circle((170,41),41,fill=G,color=None);p.draw_rect((205,70,W,77),fill=G,color=None)
  for xx in range(220,612,32):p.draw_circle((xx,73),5,fill=G,color=G)
 p.draw_circle((48,40),34,fill=(1,.97,.91),color=G,width=1.6);image(p,(17,9,79,71),"logo_transparent.png")
 p.insert_text((94,32),"NAVARASA KITCHEN",fontname="b",fontsize=19,color=(1,1,1));p.insert_text((94,53),"A CELEBRATION OF INDIAN TRADITION",fontname="s",fontsize=7.4,color=(1,.88,.58))
 p.draw_line((368,23),(368,59),color=G,width=.7);p.insert_textbox((386,23,574,43),"PREMIUM DINING MENU",fontname="sb",fontsize=8.2,color=(1,1,1),align=2);p.insert_textbox((386,45,574,59),"PLAINFIELD, ILLINOIS",fontname="s",fontsize=6.8,color=(1,.87,.56),align=2)
 p.draw_line((36,750),(576,750),color=G,width=1);p.insert_text((36,769),"Allergy Notice: Please inform our staff of any food allergies or dietary requirements before ordering.",fontname="s",fontsize=5.8,color=U);p.insert_text((36,778),"Our kitchen handles common allergens, and cross-contact may occur.",fontname="s",fontsize=5.8,color=U)
 p.draw_circle((556,768),14,fill=M,color=G,width=1);p.insert_textbox((542,762,570,775),str(n),fontname="sb",fontsize=7,color=(1,1,1),align=1)
def new(n):
 p=D.new_page(width=W,height=H);setup(p);base(p,n);return p
def met(a):
 c,d,pr,de=a;pr=pr.replace("ðŸŒ¶ï¸","").strip();nl=wrap(d,"b",8.7,176);dl=wrap(de,"s",6.5,244);return nl,dl,max(12,len(nl)*10)+len(dl)*7.6+8,pr,"ðŸŒ¶" in a[2]
def hd(p,x,y,t,cont):
 idx=cats.index(t) if t in cats else 19;variant=idx%3;label=t+(" · CONTINUED" if cont else "")
 if variant==0:
  p.draw_rect((x+20,y+7,x+262,y+43),fill=(.88,.73,.48),color=None,fill_opacity=.24);p.draw_rect((x+16,y+3,x+258,y+39),fill=(1,.955,.85),color=G,width=1.1)
  p.draw_line((x+52,y+38),(x+248,y+38),color=M,width=.8);tc=M
 elif variant==1:
  p.draw_rect((x+16,y+3,x+258,y+41),fill=M,color=G,width=1.1);p.draw_rect((x+52,y+34,x+258,y+41),fill=G,color=None)
  image(p,(x+224,y+7,x+252,y+20),"mirchi_accent.png",False);tc=(1,1,1)
 else:
  p.draw_rect((x+16,y+3,x+258,y+41),fill=(1,.90,.70),color=M,width=.8)
  p.draw_rect((x+52,y+3,x+258,y+9),fill=G,color=None);p.draw_line((x+52,y+36),(x+250,y+36),color=M,width=.8);tc=I
 p.draw_circle((x+25,y+22),25,fill=C,color=G,width=2.2);image(p,(x+2,y-1,x+48,y+45),f"circle_{idx:02}.png",False)
 p.insert_textbox((x+57,y+11,x+246,y+32),label,fontname="b",fontsize=8.6,color=tc)
 return y+55
def it(p,x,y,a):
 nl,dl,h,pr,hot=met(a)
 for j,l in enumerate(nl):p.insert_text((x+8,y+9+j*10),l,fontname="b",fontsize=8.7,color=I)
 pw=fitz.get_text_length(pr,fontname="Helvetica-Bold",fontsize=8.8);p.insert_text((x+254-pw,y+9),pr,fontname="sb",fontsize=8.8,color=M)
 if hot:p.draw_circle((x+247-pw,y+5),2.3,fill=(.7,.08,.04),color=(.7,.08,.04))
 yy=y+max(12,len(nl)*10)+1
 for l in dl:p.insert_text((x+8,yy+6),l,fontname="s",fontsize=6.5,color=U);yy+=7.6
 p.draw_line((x+8,y+h-3),(x+254,y+h-3),color=G,width=.25,stroke_opacity=.45);return y+h
# Combined cover and menu guide page
p=new(1);image(p,(36,96,576,330),"chef_kitchen.png",False)
p.draw_rect((36,300,576,330),fill=M,color=None,fill_opacity=.88);p.insert_textbox((50,306,562,326),"FROM OUR KITCHEN TO YOUR TABLE",fontname="sb",fontsize=12,color=(1,1,1),align=1)
p.insert_textbox((60,348,552,390),"Explore our menu by category",fontname="b",fontsize=19,color=M,align=1)
for i,c in enumerate(cats):
 col=i%4;row=i//4;x=44+col*134;y0=410+row*60
 image(p,(x,y0,x+42,y0+42),f"circle_{i:02}.png",False)
 p.insert_textbox((x+48,y0+5,x+126,y0+40),c,fontname="sb",fontsize=6.8,color=I)
p.insert_textbox((60,712,552,738),"Every dish and price on the following pages is presented exactly from our current menu.",fontname="s",fontsize=8,color=U,align=1)
xs=[36,314];pn=2;p=new(pn);co=0;y=96;cat="";first=True
for a in A:
 if a[0]!=cat:cat=a[0];first=True
 if first and cat=="Breads and Sides":
  section_height=55+sum(met(row)[2] for row in A if row[0]==cat)
  if y+section_height>742:
   co+=1
   if co==2:pn+=1;p=new(pn);co=0
   y=96
 need=met(a)[2]+(55 if first else 0)
 if y+need>742:
  co+=1
  if co==2:pn+=1;p=new(pn);co=0
  y=hd(p,xs[co],96,cat,not first);first=False
 elif first:y=hd(p,xs[co],y,cat,False);first=False
 y=it(p,xs[co],y,a)
D.set_metadata({"title":"Navarasa Kitchen â€” Premium Menu","author":"Navarasa Kitchen"});D.save(O,garbage=4,deflate=True,clean=True);D.close()
q=fitz.open(O);t="\n".join(p.get_text() for p in q);rep={"items":len(A),"categories":len(dict.fromkeys(x[0] for x in A)),"pages":q.page_count,"missing_dishes":[x[1] for x in A if x[1] not in t],"missing_prices":[x[1] for x in A if x[2].replace("ðŸŒ¶ï¸","").strip() not in t],"tagline":"Taste the Indian Tradition" in t,"allergy":"Allergy Notice:" in t};(R/"validation_report.json").write_text(json.dumps(rep,indent=2),encoding="utf8");print(json.dumps(rep,indent=2))
