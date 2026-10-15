import json,subprocess,os
m=json.load(open("out/meta.json"));st=json.load(open("out/starts.json"));du=json.load(open("out/duur.json"))
subprocess.check_call(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i","out/frames.txt","-vf","fps=30,scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=#f3f6f7,format=yuv420p","-c:v","libx264","-crf","18","-preset","slow","out/beeld.mp4"])
ins=[];flt=[]
for i,s in enumerate(st):
  ins+=["-i",f"out/seg{i}.mp3"];d=int(max(0,(m["t0"]+s-m["base"]))*1000)
  flt.append(f"[{i}:a]adelay={d}|{d},volume=1.0[a{i}]")
flt.append("".join(f"[a{i}]" for i in range(len(st)))+f"amix=inputs={len(st)}:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]")
subprocess.check_call(["ffmpeg","-y","-loglevel","error",*ins,"-filter_complex",";".join(flt),"-map","[a]","-ar","48000","-c:a","aac","-b:a","192k","out/stem.m4a"])
subprocess.check_call(["ffmpeg","-y","-loglevel","error","-i","out/beeld.mp4","-i","out/stem.m4a","-c:v","copy","-c:a","copy","-shortest","-movflags","+faststart",os.environ.get("NAAM","out/klantportaal-uitleg.mp4")])
# controlebeeld: midden van elk segment
for i,s in enumerate(st):
  t=max(0,m["t0"]+s-m["base"]+du[i]/2)
  subprocess.check_call(["ffmpeg","-y","-loglevel","error","-ss",str(t),"-i","out/beeld.mp4","-frames:v","1","-vf","scale=270:-1",f"out/c{i}.png"])
subprocess.check_call(["ffmpeg","-y","-loglevel","error",*sum([["-i",f"out/c{i}.png"] for i in range(len(st))],[]),"-filter_complex","".join(f"[{i}:v]" for i in range(len(st)))+f"hstack=inputs={len(st)}","out/controle.png"])
print(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",os.environ.get("NAAM","out/klantportaal-uitleg.mp4")]).decode())
