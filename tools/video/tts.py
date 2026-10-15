import asyncio,json,edge_tts,subprocess,os,re
STEM="nl-NL-FennaNeural"   # vaste CRM-stem
TX=os.environ.get("TEKST","tools/video/tekst.json");TEMPO=os.environ.get("TEMPO","+0%");TOON=os.environ.get("TOON","-3Hz")
T=json.load(open(TX))
dur=lambda f:float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]).decode().strip())
woorden=lambda s:re.findall(r"[\wÀ-ÿ']+",s)
async def los():
  out=[]
  for i,s in enumerate(T):
    f=f"out/seg{i}.mp3";await edge_tts.Communicate(s["t"],STEM,rate=TEMPO).save(f);out.append(dur(f))
  json.dump(out,open("out/duur.json","w"))

def natuurlijk(wd,src,dst,per=0.072,maxf=1.25,komma=0.30,zin=0.60):
  """uitgerekte woorden (vooral aan het eind van een zin) iets inkorten en lange stiltes korter maken,
  zonder de toonhoogte te veranderen; geeft de nieuwe woordstarts terug"""
  tot=dur(src);flt=[];lab=[];k=0;nieuw=[];tijd=0.0
  for i,(w,off,d) in enumerate(wd):
    nxt=wd[i+1][1] if i+1<len(wd) else tot
    d=max(0.02,min(d,nxt-off));pauze=max(0.0,nxt-off-d)
    f=min(maxf,max(1.0,(d/max(1,len(w)))/per)) if len(w)>=3 else 1.0
    nieuw.append(round(tijd,3))
    flt.append(f"[0:a]atrim={off:.3f}:{off+d:.3f},asetpts=PTS-STARTPTS"+(f",atempo={f:.3f}" if f>1.001 else "")+f",afade=t=in:d=0.004,afade=t=out:st={d/f-0.004:.3f}:d=0.004[s{k}]");lab.append(f"[s{k}]");k+=1;tijd+=d/f
    if pauze>0.01:
      np_=min(pauze,zin if pauze>0.45 else komma)
      flt.append(f"[0:a]atrim={off+d:.3f}:{off+d+np_:.3f},asetpts=PTS-STARTPTS[s{k}]");lab.append(f"[s{k}]");k+=1;tijd+=np_
  flt.append("".join(lab)+f"concat=n={k}:v=0:a=1[uit]")
  open("out/nat.txt","w").write(";".join(flt))
  subprocess.check_call(["ffmpeg","-y","-loglevel","error","-i",src,"-filter_complex_script","out/nat.txt","-map","[uit]","-c:a","libmp3lame","-b:a","192k",dst])
  print("natuurlijk:",round(tot,2),"->",round(dur(dst),2),"s")
  return nieuw
async def een():
  """alles in één keer inspreken: vloeiender, met de woordgrenzen om het beeld op te laten aansluiten"""
  tekst=" ".join(s["t"] for s in T);grens=[];wd=[]
  try:c=edge_tts.Communicate(tekst,STEM,rate=TEMPO,pitch=TOON,boundary="WordBoundary")
  except TypeError:c=edge_tts.Communicate(tekst,STEM,rate=TEMPO,pitch=TOON)
  with open("out/stem_all.mp3","wb") as f:
    async for ch in c.stream():
      if ch["type"]=="audio":f.write(ch["data"])
      elif ch["type"]=="WordBoundary":grens.append(ch["offset"]/1e7);wd.append([ch.get("text",""),round(ch["offset"]/1e7,3),round(ch.get("duration",0)/1e7,3)])
  json.dump(wd,open("out/woorden.json","w"),ensure_ascii=False)
  if wd and os.environ.get("NAT","1")!="0":
    os.replace("out/stem_all.mp3","out/stem_raw.mp3");ns=natuurlijk(wd,"out/stem_raw.mp3","out/stem_all.mp3")
    grens=ns;wd2=[[w[0],ns[i],None] for i,w in enumerate(wd)];json.dump(wd2,open("out/woorden.json","w"),ensure_ascii=False)
  tot=dur("out/stem_all.mp3");n=[len(woorden(s["t"])) for s in T];print("woorden",sum(n),"grenzen",len(grens))
  st=[];k=0
  for i in range(len(T)):
    st.append(grens[k] if k<len(grens) else (st[-1] if st else 0));k+=n[i]
  if len(grens)<sum(n)*.8:  # terugval: naar verhouding van het aantal woorden
    acc=0;st=[]
    for x in n:st.append(tot*acc/sum(n));acc+=x
  st[0]=0.0
  du=[(st[i+1] if i+1<len(st) else tot)-st[i] for i in range(len(st))]
  json.dump(du,open("out/duur.json","w"));json.dump(st,open("out/tstart.json","w"))
  print("starts",[round(x,2) for x in st],"totaal",round(tot,2))
asyncio.run(een() if os.environ.get("EEN") else los())
