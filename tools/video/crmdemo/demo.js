/* Testomgeving voor video's: het CRM van glazenwasser Dave, met realistische gegevens rond vandaag. Alles in het geheugen. */
(function(){
const T=new Date();T.setHours(12,0,0,0);
const iso=d=>{const x=new Date(d);return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0")};
const add=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
let seed=7;const R=()=>{seed=(seed*16807)%2147483647;return (seed-1)/2147483646};const pick=a=>a[Math.floor(R()*a.length)];
const werkdag=d=>{d=new Date(d);while(d.getDay()===0||d.getDay()===6)d=add(d,1);return d};
const NAMEN=[["Jansen","Marieke"],["de Vries","Peter"],["Bakker","Sanne"],["Visser","Tom"],["Smit","Lotte"],["Meijer","Henk"],["de Boer","Anneke"],["Mulder","Jeroen"],["de Groot","Ingrid"],["Bos","Kees"],["Vos","Linda"],["Peters","Martin"],["Hendriks","Esther"],["van Dijk","Bart"],["Dekker","Petra"],["Brouwer","Johan"],["de Wit","Nicole"],["Dijkstra","Willem"],["Smits","Femke"],["de Graaf","Rob"],["van der Meer","Ilse"],["Kok","Erik"],["Jacobs","Anouk"],["de Haan","Frank"],["Schouten","Monique"],["van den Berg","Arjen"],["Hoekstra","Wendy"],["Postma","Gerrit"],["Kuipers","Saskia"],["Veenstra","Harm"],["Wiersma","Ellen"],["Kramer","Dennis"],["Huisman","Karin"],["Boersma","Sjoerd"],["Zijlstra","Marloes"],["Bosma","Ruben"]];
const STR=[["Tolberterstraat","9351 BA","Leek"],["Oostindie","9351 AX","Leek"],["Zuiderstraat","9351 AJ","Leek"],["Diepswal","9351 BJ","Leek"],["Spanjaardshoek","9351 PS","Leek"],["Hoofdstraat","9356 AA","Tolbert"],["Kerkstraat","9355 AB","Midwolde"],["Raadhuisstraat","9351 AH","Leek"],["Nijlandstraat","9351 TS","Leek"],["Westeinde","9354 AA","Zevenhuizen"]];
const VN=["Marieke","Peter","Sanne","Tom","Lotte","Henk","Anneke","Jeroen","Ingrid","Kees","Linda","Martin","Esther","Bart","Petra","Johan","Nicole","Willem","Femke","Rob","Ilse","Erik","Anouk","Frank","Monique","Arjen","Wendy","Gerrit","Saskia","Harm"];
while(NAMEN.length<62){const a=NAMEN[Math.floor(R()*36)][0],v=VN[Math.floor(R()*VN.length)];if(!NAMEN.some(x=>x[0]===a&&x[1]===v))NAMEN.push([a,v])}
const kl=[],be=[],fa=[];const today=iso(T);
NAMEN.forEach(([a,v],i)=>{const s=STR[i%STR.length],fq=pick([8,8,8,8,6,4,12]),prijs=Math.round((32+R()*58)*2)/2,duur=[25,30,35,40,45,55,65][Math.floor(R()*7)];
  kl.push({id:"dk"+i,naam:a+", "+v,voornaam:v,achternaam:a,adres:s[0]+" "+(3+Math.floor(R()*120)),postcode:s[1],plaats:s[2],land:"NL",email:v.toLowerCase()+"@voorbeeld.nl",mobiel:"06"+String(10000000+Math.floor(R()*89999999)),soort:i%9===4?"zakelijk":"particulier",
    actief:true,akkoord:true,prospect:false,dienst:"Glasbewassing",prijs,frequentie:fq,duur,tijd:"",gepland:"",laatst:"",ronde:pick(["Leek-Noord","Leek-Zuid","Tolbert","Zevenhuizen"]),contactPlanning:"kennisgeving",aangemaakt:iso(add(T,-300-i*3)),autoplan:R()<.6,
    tijden:[{datum:iso(add(T,-60)),min:duur-3},{datum:iso(add(T,-30)),min:duur+2}],log:[{datum:iso(add(T,-300-i*3)),tekst:"Klant aangemaakt"}],opdrachten:[],objecten:[],hosp:i===0?[{id:"h1",soort:"huisdier",tekst:"Hond Max is lief, wel even bellen bij het hek"}]:[],notities:""})});
/* vandaag: 8 adressen, de eerste 3 al klaar */
const NU=new Date(),hm=m=>{m=Math.round(m/5)*5;return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0")},m0=Math.min(11*60+5,Math.max(7*60+45,NU.getHours()*60+NU.getMinutes()-150));
const TIJD=[m0,m0+45,m0+95,m0+165,m0+215,m0+290,m0+340,m0+385].map(hm);
kl.slice(0,8).forEach((k,i)=>{k.tijd=TIJD[i];if(i<3){k.laatst=today;k.gepland=iso(werkdag(add(T,k.frequentie*7)))}else k.gepland=today});
/* komende twee weken ingepland */
kl.slice(8,22).forEach((k,i)=>{const d=werkdag(add(T,1+Math.floor(i/2)));k.gepland=iso(d);k.tijd=["08:30","09:30","10:30","11:30","13:00","14:00"][i%6];k.laatst=iso(add(d,-k.frequentie*7))});
/* aan de beurt, nog niet ingepland */
kl.slice(22,29).forEach((k,i)=>{k.laatst=iso(add(T,-k.frequentie*7-1-i*2))});
kl.slice(29).forEach((k,i)=>{const g=werkdag(add(T,8+(i%30)));k.gepland=iso(g);k.laatst=iso(add(g,-k.frequentie*7));k.tijd=["08:30","09:30","10:30","11:30","13:00","14:00"][i%6]});
kl.forEach(k=>{if(!k.laatst)k.laatst=iso(add(T,-k.frequentie*7))});
/* historie: beurten + facturen */
let nr=1;const rows=[];
kl.forEach(k=>{let d=new Date(k.laatst);if(d>T)d=add(d,-k.frequentie*7);for(let n=0;n<6&&d>add(T,-280);n++){rows.push({k,d:new Date(d)});d=add(d,-k.frequentie*7)}});
rows.sort((a,b)=>a.d-b.d);
rows.forEach(({k,d},j)=>{const ds=iso(d),fid="df"+j,bid="db"+j,isToday=ds===today,ouder=(T-d)/864e5;
  const t=k.tijd||"10:00";const op=new Date(ds+"T"+t+":00");op.setMinutes(op.getMinutes()+k.duur);
  be.push({id:bid,klantId:k.id,klantNaam:k.naam,datum:ds,bedrag:k.prijs,betaald:ouder>6,gefactureerd:isToday?"":fid,dienst:"Glasbewassing",tijd:t,duur:k.duur+Math.round(R()*8-4),gemeten:true,startOp:"",op:op.toISOString()});
  if(isToday)return;
  const st=ouder>6?"betaald":"open",verv=iso(add(d,14));
  fa.push({id:fid,soort:"factuur",nummer:d.getFullYear()+"-"+String(nr++).padStart(4,"0"),klantId:k.id,klantNaam:k.naam,klantAdres:k.adres+", "+k.postcode+" "+k.plaats,klantEmail:k.email,datum:ds,verval:verv,regels:[{omschrijving:"Glasbewassing "+ds.split("-").reverse().join("-"),aantal:1,prijs:k.prijs}],btw:21,incl:true,status:st,betaaldOp:st==="betaald"?iso(add(d,1+Math.floor(R()*9))):"",betaalwijze:st==="betaald"?pick(["overmaken","ideal","ideal","incasso"]):"",verstuurdOp:ds,gemaakt:ds+"T16:00:00.000Z"})});
/* twee facturen te laat */
fa.filter(f=>f.status==="open").slice(0,2).forEach(f=>{f.datum=iso(add(T,-30));f.verval=iso(add(T,-16))});
const wd=new Date(today+"T"+hm(m0-25)+":00"),pz1=new Date(today+"T"+hm(m0+140)+":00"),pz2=new Date(today+"T"+hm(m0+150)+":00");
const DATA={klanten:kl,beurten:be,facturen:fa,routes:[{id:today,werk:{start:wd.toISOString(),stop:"",pauzes:[{van:pz1.toISOString(),tot:pz2.toISOString()}],door:"dave@glazenwasserdave.nl"}}],
  instellingen:[{id:"bedrijf",naam:"Glazenwasbedrijf Dave",adres:"Industrieweg 12",postcode:"9351 PA",plaats:"Leek",email:"info@glazenwasserdave.nl",telefoon:"0612345678",iban:"NL12RABO0123456789",kvk:"12345678",btw:21,incl:true,termijn:14,hoofdkleur:"#137a8a",dagAan:true,fhAan:true,reviewAan:true,reviewLink:"https://g.page/r/glazenwasserdave",kalVan:"07:00",kalTot:"18:00",kalTotMig:true,werkdagen:[1,2,3,4,5]}],berichten:[],kosten:[]};
const store={},L={};Object.keys(DATA).forEach(c=>{store[c]=new Map(DATA[c].map(d=>{const {id,...r}=d;return [id,r]}));L[c]=[]});
const snap=c=>({docs:[...(store[c]||new Map()).entries()].map(([id,d])=>({id,data:()=>d,exists:true}))});
const meld=c=>setTimeout(()=>L[c].forEach(cb=>cb(snap(c))),0);
const col=c=>{if(!store[c]){store[c]=new Map();L[c]=[]}return{onSnapshot(cb){L[c].push(cb);setTimeout(()=>cb(snap(c)),0);return()=>{}},get:async()=>snap(c),
  doc:id=>({set:async d=>{store[c].set(id,JSON.parse(JSON.stringify(d)));meld(c)},delete:async()=>{store[c].delete(id);meld(c)},get:async()=>({exists:store[c].has(id),id,data:()=>store[c].get(id)})})}};
window.claude={use:async n=>n==="db"?{collection:col}:n==="user"?{me:async()=>({name:"Dave",email:"dave@glazenwasserdave.nl"})}:null};
try{localStorage.setItem("ms.zoom","100")}catch(e){}
window.DEMO_LOGO="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTIwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiMxYTg0OTQiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiMwYjQ2NTIiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48Y2lyY2xlIGN4PSI2MCIgY3k9IjYwIiByPSI1OCIgZmlsbD0idXJsKCNnKSIvPjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjUyIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIuMzUiIHN0cm9rZS13aWR0aD0iMiIvPjxyZWN0IHg9IjM2IiB5PSIzMCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjUyIiByeD0iNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjUiLz48cGF0aCBkPSJNNjAgMzB2NTJNMzYgNTZoNDgiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSI0Ii8+PHBhdGggZD0iTTQ0IDQwbDEwLTZNNjggNjRsMTAtNiIgc3Ryb2tlPSIjOWZmMGQyIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIvPjx0ZXh0IHg9IjYwIiB5PSIxMDMiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCxIZWx2ZXRpY2Esc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjgwMCIgZm9udC1zaXplPSIxNSIgZmlsbD0iI2ZmZiIgbGV0dGVyLXNwYWNpbmc9IjIiPkRBVkU8L3RleHQ+PC9zdmc+";
})();
