/* ---------- Waar stond de fotograaf? GPS en kompas van de telefoon bij een foto ----------
   1. Uit de foto zelf (EXIF): GPS-positie, kijkrichting (GPSImgDirection) en brandpuntsafstand.
   2. Zit dat er niet in (veel browsers halen de locatie eruit), dan de sensoren van de telefoon op het moment dat de foto
      werd gemaakt: navigator.geolocation en het kompas (deviceorientation).
   Dient als startpunt: welke gevel staat op de foto en waar ongeveer de hoeken zitten. De exacte stand rekent de meetlint daarna
   uit de vier gevelhoeken. Resultaat: {lat,lng,acc?,dir?,pitch?,f35?,bron:"exif"|"telefoon"} of null. */
async function exifGeo(file){try{const buf=await file.slice(0,262144).arrayBuffer(),v=new DataView(buf);if(v.getUint16(0)!==0xFFD8)return null;
    let o=2;while(o<v.byteLength-4){const m=v.getUint16(o),len=v.getUint16(o+2);if(m===0xFFE1&&v.getUint32(o+4)===0x45786966){return leesTiff(v,o+10)}if((m&0xFF00)!==0xFF00)break;o+=2+len}return null}
  catch(e){return null}
  function leesTiff(v,t){const le=v.getUint16(t)===0x4949,u16=p=>v.getUint16(p,le),u32=p=>v.getUint32(p,le);
    const ifd=p=>{const n=u16(t+p),o={};for(let i=0;i<n;i++){const e=t+p+2+i*12;o[u16(e)]={type:u16(e+2),n:u32(e+4),off:e+8}}return o};
    const rat=(e,i=0)=>{const p=t+u32(e.off)+i*8;const a=u32(p),b=u32(p+4);return b?a/b:0};
    const val=e=>e.type===3?u16(e.off):e.type===4?u32(e.off):e.type===5?rat(e):e.type===2?String.fromCharCode(v.getUint8(e.n<=4?e.off:t+u32(e.off))):null;
    const i0=ifd(u32(t+4)),r={};
    if(i0[0x8769]){const ex=ifd(u32(i0[0x8769].off));if(ex[0xA405])r.f35=val(ex[0xA405])||undefined;if(!r.f35&&ex[0x920A])r.fmm=rat(ex[0x920A])}
    if(i0[0x8825]){const g=ifd(u32(i0[0x8825].off));const dms=e=>e?rat(e,0)+rat(e,1)/60+rat(e,2)/3600:null;
      const la=dms(g[2]),lo=dms(g[4]);if(la&&lo){r.lat=(val(g[1])==="S"?-1:1)*la;r.lng=(val(g[3])==="W"?-1:1)*lo}
      if(g[0x11]){const d=rat(g[0x11]);if(isFinite(d))r.dir=d}}
    if(r.lat==null&&r.dir==null)return r.f35?{f35:r.f35}:null;return{...r,bron:"exif"}}}
/* sensoren: aanzetten bij een tik op "Foto toevoegen" (iOS vraagt dan om toestemming), de laatste meting bewaren */
const FS={pos:null,dir:null,pitch:null,t:0,aan:false};
function fotoSensorAan(){FS.t=Date.now();if(FS.aan)return;FS.aan=true;
  try{if(navigator.geolocation)navigator.geolocation.watchPosition(p=>{FS.pos={lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy,t:Date.now()}},()=>{},{enableHighAccuracy:true,maximumAge:5000,timeout:20000})}catch(e){}
  const op=e=>{let d=null;if(typeof e.webkitCompassHeading==="number")d=e.webkitCompassHeading;else if(e.absolute&&typeof e.alpha==="number")d=(360-e.alpha)%360;
    if(d!=null){FS.dir=d;FS.pitch=typeof e.beta==="number"?e.beta-90:null;FS.dt=Date.now()}};
  try{const D=window.DeviceOrientationEvent;if(D&&typeof D.requestPermission==="function")D.requestPermission().then(s=>{if(s==="granted")addEventListener("deviceorientation",op)}).catch(()=>{});
    else{addEventListener("deviceorientationabsolute",op);addEventListener("deviceorientation",op)}}catch(e){}}
function fotoSensorLaatst(){if(!FS.aan||Date.now()-FS.t>180000)return null;const p=FS.pos&&Date.now()-FS.pos.t<120000?FS.pos:null;if(!p&&FS.dir==null)return null;
  return{...(p?{lat:p.lat,lng:p.lng,acc:Math.round(p.acc)}:{}),...(FS.dir!=null?{dir:Math.round(FS.dir),...(FS.pitch!=null?{pitch:Math.round(FS.pitch)}:{})}:{}),bron:"telefoon"}}
async function fotoGeo(file){const ex=await exifGeo(file),se=fotoSensorLaatst();if(!ex&&!se)return null;
  const r={...(se||{}),...(ex||{})};if(ex&&ex.lat==null&&se&&se.lat!=null){r.lat=se.lat;r.lng=se.lng;r.acc=se.acc}if(ex&&ex.dir==null&&se&&se.dir!=null){r.dir=se.dir;if(se.pitch!=null)r.pitch=se.pitch}
  r.bron=ex&&ex.lat!=null?"exif":"telefoon";return r.lat!=null||r.dir!=null?r:null}
