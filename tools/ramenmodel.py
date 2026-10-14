import json, os, shutil
from ultralytics import YOLO
os.makedirs("public/ai", exist_ok=True)
for v in ["n", "s"]:
    m = YOLO(f"yolov8{v}-oiv7.pt")
    names = m.names
    idx = {k: n for k, n in names.items() if n.lower() in ("window", "door", "house", "building", "skylight", "roof", "porch")}
    print(v, idx)
    p = m.export(format="onnx", imgsz=640, simplify=True, opset=17, dynamic=False)
    shutil.copy(p, f"public/ai/ramen-{v}.onnx")
    json.dump({"klassen": {str(k): n for k, n in idx.items()}, "aantal": len(names), "imgsz": 640}, open(f"public/ai/ramen-{v}.json", "w"))
    print(v, os.path.getsize(f"public/ai/ramen-{v}.onnx"))
