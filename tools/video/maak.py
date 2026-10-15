import json,subprocess,os
m=json.load(open("out/meta.json"));st=json.load(open("out/starts.json"));du=json.load(open("out/duur.json"))
subprocess.check_call(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i","out/frames.txt","-vf","fps=30,scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int:force_original_aspect_ratio=decrease,unsharp=3:3:0.35,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=#f3f6f7,format=yuv420p","-c:v","libx264","-crf","12","-preset","slow","-tune","animation","-profile:v","high","out/beeld.mp4"])
ins=[];flt=[]
if os.path.exists("out/stem_all.mp3"):
  ta=json.load(open("out/ta.json"));d=int(max(0,m["t0"]+ta-m["base"])*1000)
  subprocess.check_call(["ffmpeg","-y","-loglevel","error","-i","out/stem_all.mp3","-af",f"adelay={d}|{d},highpass=f=75,equalizer=f=180:t=q:w=1:g=2,equalizer=f=3200:t=q:w=1.2:g=1,equalizer=f=7500:t=q:w=1.5:g=-2.5,acompressor=threshold=-21dB:ratio=2.2:attack=12:release=180,loudnorm=I=-16:TP=-1.5:LRA=11","-ar","48000","-c:a","aac","-b:a","192k","out/stem.m4a"])
  st_=[]
for i,s in enumerate(st if not os.path.exists("out/stem_all.mp3") else []):
  ins+=["-i",f"out/seg{i}.mp3"];d=int(max(0,(m["t0"]+s-m["base"]))*1000)
  flt.append(f"[{i}:a]adelay={d}|{d},volume=1.0[a{i}]")
if not os.path.exists("out/stem_all.mp3"):
 flt.append("".join(f"[a{i}]" for i in range(len(st)))+f"amix=inputs={len(st)}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]")
 subprocess.check_call(["ffmpeg","-y","-loglevel","error",*ins,"-filter_complex",";".join(flt),"-map","[a]","-ar","48000","-c:a","aac","-b:a","192k","out/stem.m4a"])
subprocess.check_call(["ffmpeg","-y","-loglevel","error","-i","out/beeld.mp4","-i","out/stem.m4a","-c:v","copy","-c:a","copy","-shortest","-movflags","+faststart",os.environ.get("NAAM","out/klantportaal-uitleg.mp4")])
# controlebeeld: midden van elk segment
for i,s in enumerate(st):
  t=max(0,m["t0"]+s-m["base"]+du[i]/2)
  subprocess.check_call(["ffmpeg","-y","-loglevel","error","-ss",str(t),"-i","out/beeld.mp4","-frames:v","1","-vf","scale=270:-1",f"out/c{i}.png"])
subprocess.check_call(["ffmpeg","-y","-loglevel","error",*sum([["-i",f"out/c{i}.png"] for i in range(len(st))],[]),"-filter_complex","".join(f"[{i}:v]" for i in range(len(st)))+f"hstack=inputs={len(st)}","out/controle.png"])
print(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",os.environ.get("NAAM","out/klantportaal-uitleg.mp4")]).decode())
