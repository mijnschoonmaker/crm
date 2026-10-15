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
