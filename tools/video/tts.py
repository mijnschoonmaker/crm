import asyncio,json,edge_tts,subprocess,sys
STEM="nl-NL-FennaNeural"   # vaste CRM-stem
T=json.load(open("tools/video/tekst.json"))
async def main():
  out=[]
  for i,s in enumerate(T):
    f=f"out/seg{i}.mp3"
    await edge_tts.Communicate(s["t"],STEM,rate="-4%",pitch="+0Hz").save(f)
    d=float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f]).decode().strip())
    out.append(d);print(i,round(d,2),s["t"][:50])
  json.dump(out,open("out/duur.json","w"))
asyncio.run(main())
