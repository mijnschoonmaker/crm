/* ---------- KERN ---------- */
const $=s=>document.querySelector(s);
const DAY=864e5;
const pad=n=>String(n).padStart(2,"0");
const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const today=()=>{const d=new Date();d.setHours(0,0,0,0);return d};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const parse=s=>{if(!s)return null;const[y,m,d]=String(s).split("-").map(Number);if(!y||!m||!d)return null;return new Date(y,m-1,d)};
const fmtD=s=>{const d=typeof s==="string"?parse(s):s;return d?d.toLocaleDateString("nl-NL",{day:"numeric",month:"short"}).replace(".",""):"—"};
const fmtL=s=>{const d=typeof s==="string"?parse(s):s;return d?d.toLocaleDateString("nl-NL",{day:"numeric",month:"long",year:"numeric"}):"—"};
const fmtNum=s=>{const d=typeof s==="string"?parse(s):s;return d?pad(d.getDate())+" - "+pad(d.getMonth()+1)+" - "+d.getFullYear():"—"};
const longD=d=>d?d.toLocaleDateString("nl-NL",{weekday:"long",day:"numeric",month:"long"}):"";
const wd=d=>d.toLocaleDateString("nl-NL",{weekday:"short"}).replace(".","");
const monthName=(y,m)=>new Date(y,m,1).toLocaleDateString("nl-NL",{month:"long",year:"numeric"});
const r2=n=>Math.round((Number(n)||0)*100)/100;
const eur=n=>"€ "+(Number(n)||0).toLocaleString("nl-NL",{minimumFractionDigits:2,maximumFractionDigits:2});
const eur0=n=>"€ "+Math.round(Number(n)||0).toLocaleString("nl-NL");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const cleanName=n=>String(n||"").replace(/^Voorbeeld:\s*/,"");
const initials=n=>{const w=cleanName(n).replace(/^(fam\.?|familie|dhr\.?|mevr\.?)\s+/i,"").split(/\s+/).filter(Boolean);return ((w[0]||"?")[0]+(w.length>1?w[w.length-1][0]:"")).toUpperCase()};
const hue=s=>{let h=0;for(const c of String(s||"x"))h=(h*31+c.charCodeAt(0))%360;return h};
const startOfWeek=d=>{const x=new Date(d);x.setHours(0,0,0,0);return addDays(x,-((x.getDay()+6)%7))};
const weekNr=d=>{const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const n=x.getUTCDay()||7;x.setUTCDate(x.getUTCDate()+4-n);const y=new Date(Date.UTC(x.getUTCFullYear(),0,1));return Math.ceil(((x-y)/DAY+1)/7)};
const fullAddr=k=>[k.adres,[k.postcode,k.plaats].filter(Boolean).join(" ")].filter(Boolean).join(", ");
const newId=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const strip=o=>{const c={...o};delete c.id;return c};
const VALIAS={klant_naam:"klant",customer_name:"klant",naam:"klant",bedrijfsnaam:"bedrijf",company_name:"bedrijf",job_date:"datum",job_time:"tijd",job_address:"adres",time_window:"tijdvak",service:"dienst"};
/* tags zoals in DienstenCRM: [veld.groep]. Oude {woorden} blijven ook werken. */
const TAGS=[
  ["Afzender",[["firstname.user","Voornaam"],["lastname.user","Achternaam"],["name.company","Bedrijfsnaam","bedrijf"],["street.company","Straatnaam"],["housenumber.company","Huisnr."],["postal.company","Postcode"],["city.company","Plaats"],["email.company","E-mail"],["phone.company","Telefoon","telefoon"],["cellphone.company","Mobiel"],["website.company","Website"],["kvk.company","KVK-nummer"],["iban.company","IBAN","iban"],["g_account_iban.company","IBAN G-rekening"],["terms.company","Link voorwaarden","voorwaarden"],["noticeperiod.company","Opzegtermijn","opzegtermijn"]]],
  ["Ontvanger",[["number.customer","Klantnummer"],["name.customer","Naam","klant"],["firstname.customer","Voornaam","voornaam"],["lastname.customer","Achternaam"],["salutation.customer","Aanhef (heer/mevrouw)","aanhef"],["sex.customer","Geslacht"],["company.customer","Bedrijfsnaam"],["street.customer","Straatnaam (post)"],["housenumber.customer","Huisnummer (post)"],["postal.customer","Postcode (post)"],["city.customer","Plaatsnaam (post)"],["email.customer","E-mail"],["phone.customer","Telefoon"]]],
  ["Afspraak",[["date.appointment","Datum","datum"],["time.appointment","Tijd","tijd"],["timeslot.appointment","Tijdvak (van–tot)","tijdvak"],["daypart.appointment","Dagdeel"],["weeknumber.appointment","Weeknummer"],["services.appointment","Diensten","diensten"],["subservices.appointment","Diensten (uitgebreidere versie)"],["articles.appointment","Artikelen"],["service.appointment","Hoofddienst","dienst"],["price.appointment","Prijs per beurt","prijs"],["interval.appointment","Hoe vaak","interval"],["address.appointment","Straatnaam (uitvoer)"],["housenumber.appointment","Huisnummer (uitvoer)"],["postal.appointment","Postcode (uitvoer)"],["city.appointment","Plaatsnaam (uitvoer)","plaats"],["fulladdress.appointment","Volledig adres (uitvoer)","adres"],["location.appointment","Locatieomschrijving"],["confirm_link.appointment","Afspraakbevestigingslink"]]],
  ["Factuur",[["nr.invoice","Factuurnummer","factuurnummer"],["total.invoice","Totaalbedrag","bedrag"],["btw.invoice","BTW","btwbedrag"],["extracost.invoice","Aanmaningskosten","aanmaningskosten"],["date.invoice","Factuurdatum","factuurdatum"],["duedate.invoice","Vervaldatum","vervaldatum"],["paydate.invoice","Betaaldatum","betaaldatum"],["date5days.invoice","Vandaag + 5 dagen"],["date7days.invoice","Vandaag + 7 dagen"],["date14days.invoice","Vandaag + 14 dagen"],["date21days.invoice","Vandaag + 21 dagen"],["date30days.invoice","Vandaag + 30 dagen"],["datepaymentdays.invoice","Vandaag + betalingstermijn"],["reminder.invoice","Herinneringsdatum","herinnerdatum"],["reminder2.invoice","2de herinneringsdatum","herinnerdatum2"],["daysoverdue.invoice","Dagen te laat","dagen_te_laat"],["mollielink.invoice","Betaallink","betaallink"],["payline.invoice","Betaalzin (met link)","betaalregel"],["link.review","Reviewlink","reviewlink"]]],
  ["Rapport",[["month.report","Maand","maand"],["revenue.report","Omzet","omzet"],["costs.report","Kosten","kosten"],["vat.report","Btw","btw"]]]];
const TAG2KEY={},KEY2TAG={};TAGS.forEach(([,l])=>l.forEach(([t,,k])=>{if(k){TAG2KEY[t]=k;KEY2TAG[k]=t}}));KEY2TAG.naam="name.customer";KEY2TAG.telefoonbedrijf="phone.company";KEY2TAG.straat="address.appointment";
const TAGALIAS={"number.invoice":"nr.invoice","amount.invoice":"total.invoice","paylink.invoice":"mollielink.invoice"};
/* oude {woord} → [tag] (voor teksten die al bewaard zijn) */
const naarTags=t=>String(t||"").replace(/(^|[^$])\{(\w+)\}/g,(m,p,k)=>KEY2TAG[k]||KEY2TAG[VALIAS[k]]?p+"["+(KEY2TAG[k]||KEY2TAG[VALIAS[k]])+"]":m);
function bedrijfTags(){const s=(typeof S==="function"?S():{})||{},m=String(s.adres||"").match(/^(.*?)\s+(\d+\s*\S*)$/),me=(typeof state!=="undefined"&&state.me&&state.me.name)||"";
  return {"firstname.user":s.voornaam||me.split(" ")[0]||"","lastname.user":s.achternaam||me.split(" ").slice(1).join(" "),"name.company":s.naam||"","street.company":m?m[1]:s.adres||"","housenumber.company":m?m[2]:"","postal.company":s.postcode||"","city.company":s.plaats||"",
    "email.company":s.email||"","phone.company":s.telefoon||"","cellphone.company":s.mobiel||s.telefoon||"","website.company":s.website||"","kvk.company":s.kvk||"","iban.company":s.iban||"","g_account_iban.company":s.giban||"","terms.company":s.voorwaarden||"","noticeperiod.company":s.opzegtermijn||"",...(()=>{const o={},t=typeof today==="function"?today():new Date(),f=d=>typeof fmtL==="function"?fmtL(iso(addDays(t,d))):"";[5,7,14,21,30].forEach(n=>o["date"+n+"days.invoice"]=f(n));o["datepaymentdays.invoice"]=f(Number(s.termijn)||14);o["mollielink.invoice"]=s.betaallink||"";return o})()}}
const fill=(tpl,o)=>{o=o||{};let co=null;return String(tpl||"").replace(/\[([a-z0-9_]+\.[a-z_]+)\]/g,(m,t)=>{t=TAGALIAS[t]||t;if(o[t]!=null)return o[t];const k=TAG2KEY[t];if(k&&o[k]!=null)return o[k];co=co||bedrijfTags();return co[t]??m}).replace(/\{(\w+)\}/g,(m,k)=>o[k]??o[VALIAS[k]]??m)};
/* opgemaakte mailtekst (vet, lettertype, grootte): veilig HTML, met tekstversie voor sms/kopiëren */
const isRich=t=>/<(b|strong|i|em|u|span|p|div|br|ul|ol|li|font|a)[\s>\/]/i.test(String(t||""));
function richSafe(html){const T=document.createElement("template");T.innerHTML=String(html||"");const OK=new Set(["B","STRONG","I","EM","U","BR","P","DIV","SPAN","UL","OL","LI","A","FONT"]),ST=["font-size","font-family","font-weight","font-style","text-decoration","text-decoration-line","color","text-align"];
  const walk=n=>{[...n.childNodes].forEach(c=>{if(c.nodeType===3)return;if(c.nodeType!==1){c.remove();return}walk(c);
    if(!OK.has(c.tagName)){c.replaceWith(...c.childNodes);return}
    if(c.tagName==="FONT"){const sp=document.createElement("span");const f=c.getAttribute("face"),sz=c.getAttribute("size");if(f)sp.style.fontFamily=f;if(sz)sp.style.fontSize=({1:"11px",2:"13px",3:"15px",4:"18px",5:"22px",6:"28px",7:"34px"})[sz]||"";sp.append(...c.childNodes);c.replaceWith(sp);return}
    const keep=c.tagName==="A"?c.getAttribute("href"):null,st=c.style;const css=ST.map(p=>st.getPropertyValue(p)?p+":"+st.getPropertyValue(p):"").filter(Boolean).join(";");
    [...c.attributes].forEach(a=>c.removeAttribute(a.name));if(css)c.setAttribute("style",css);if(keep&&/^(https?:|mailto:|tel:)/i.test(keep))c.setAttribute("href",keep)})};walk(T.content);return T.innerHTML}
function richText(html){const d=document.createElement("div");d.innerHTML=String(html||"").replace(/<br\s*\/?>/gi,"\n").replace(/<\/(p|div|li)>/gi,"\n").replace(/<li[^>]*>/gi,"• ");return (d.textContent||"").replace(/ /g," ").replace(/\n{3,}/g,"\n\n").trim()}
const plainRich=t=>String(t||"").split(/\n/).map(l=>esc(l)).join("<br>");
const fillHtml=(html,o)=>{const E=v=>esc(String(v)).replace(/\n/g,"<br>");return String(html||"").replace(/\[([a-z0-9_]+\.[a-z_]+)\]/g,m=>{const v=fill(m,o);return v===m?m:E(v)}).replace(/\{(\w+)\}/g,m=>{const v=fill(m,o);return v===m?m:E(v)})};
const plural=(n,a,b)=>n+" "+(n===1?a:b);
function pasen(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;return new Date(y,mo-1,da)}
const _fd={};
function feestdagen(y,land){const k=y+land;if(_fd[k])return _fd[k];const p=pasen(y),o={};const add=(d,n)=>o[iso(d)]=n;
  add(new Date(y,0,1),"Nieuwjaarsdag");add(addDays(p,1),"Tweede paasdag");add(addDays(p,39),"Hemelvaartsdag");add(addDays(p,50),"Tweede pinksterdag");add(new Date(y,11,25),"Eerste kerstdag");
  if(land==="BE"){add(new Date(y,4,1),"Dag van de Arbeid");add(new Date(y,6,21),"Nationale feestdag");add(new Date(y,7,15),"O.L.V.-Hemelvaart");add(new Date(y,10,1),"Allerheiligen");add(new Date(y,10,11),"Wapenstilstand")}
  else{const kd=new Date(y,3,27);add(kd.getDay()===0?new Date(y,3,26):kd,"Koningsdag");add(new Date(y,11,26),"Tweede kerstdag");if(y%5===0)add(new Date(y,4,5),"Bevrijdingsdag")}
  return _fd[k]=o}
const feestdag=d=>{const s=S();return s.feestdagen?feestdagen(d.getFullYear(),s.land)[iso(d)]||"":""};
const isWerkdag=d=>{const w=S().werkdagen||[1,2,3,4,5];return w.includes(d.getDay())&&!feestdag(d)};
function werkdagAanpassen(d){if(isWerkdag(d))return d;const dir=S().vrijeDag==="na"?1:-1;for(let i=1;i<8;i++){const x=addDays(d,i*dir);if(isWerkdag(x)&&(dir>0||x>=today()))return x}for(let i=1;i<8;i++){const x=addDays(d,i);if(isWerkdag(x))return x}return d}
const toon=x=>S().toonEx?exAmt(x):(Number(x)||0);
const btwLbl=()=>S().toonEx?"ex btw":"incl btw";

const sv=(p,extra="")=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"${extra}>${p}</svg>`;
const I={
  check:sv('<path d="M5 12.5l4.5 4.5L19 7.5"/>',' stroke-width="2.6"'),
  vandaag:sv('<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'),
  route:sv('<path d="M21 3L3 10.5l7.5 3L14 21z"/>'),
  planning:sv('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
  klanten:sv('<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 1 0 0-6M22 21c0-3-2-5-5-5"/>'),
  communicatie:sv('<path d="M4 5h16v11H8l-4 4z"/>'),
  offertes:sv('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v2h6V3M9 10h6M9 14h6M9 18h3"/>'),
  facturen:sv('<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h8M9 17h5"/>'),
  boekhouding:sv('<path d="M2 5c3-1.5 7-1.5 10 0v15c-3-1.5-7-1.5-10 0zM22 5c-3-1.5-7-1.5-10 0v15c3-1.5 7-1.5 10 0z"/>'),
  uitvoering:sv('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>'),
  calculator:sv('<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8v4H8zM8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>'),
  inzichten:sv('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
  instellingen:sv('<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>'),
  handleiding:sv('<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>'),
  plus:sv('<path d="M12 5v14M5 12h14"/>',' stroke-width="2.4"'),
  search:sv('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>'),
  nav:sv('<path d="M21 3L3 10.5l7.5 3L14 21z"/>'),
  msg:sv('<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/>'),
  up:sv('<path d="M6 15l6-6 6 6"/>',' stroke-width="2.2"'),
  down:sv('<path d="M6 9l6 6 6-6"/>',' stroke-width="2.2"'),
  left:sv('<path d="M15 6l-6 6 6 6"/>',' stroke-width="2.2"'),
  right:sv('<path d="M9 6l6 6-6 6"/>',' stroke-width="2.2"'),
  dl:sv('<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>'),
  ext:sv('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
  eye:sv('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
  pencil:sv('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  chat:sv('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  copy:sv('<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>'),
  upload:sv('<path d="M12 15V3M7 8l5-5 5 5M4 20h16"/>'),
  wrench:sv('<path d="M14.7 6.3a4 4 0 0 0 5 5L22 14l-8 8-2.3-2.3a4 4 0 0 0-5-5L2 10l8-8z" transform="scale(.9) translate(1 1)"/>'),
  building:sv('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4M8 7h2M14 7h2M8 11h2M14 11h2"/>'),
  more:'<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>',
  lock:sv('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  phone:sv('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
  play:sv('<path d="M7 4l13 8-13 8z"/>'),
  receipt:sv('<path d="M5 2v20l3-2 2 2 2-2 2 2 2-2 3 2V2l-3 2-2-2-2 2-2-2-2 2z"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
  collapse:sv('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M16 9l-3 3 3 3"/>'),
  refresh:sv('<path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12A9 9 0 0 1 18.5 5.8L21 8M21 3v5h-5M3 21v-5h5"/>'),
  wand:sv('<path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M3 21l9-9M12.2 6.2L11 5"/>'),
  note:sv('<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>'),
  cal2:sv('<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>'),
  alert:sv('<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01"/>'),
  x:sv('<path d="M18 6L6 18M6 6l12 12"/>',' stroke-width="2.2"'),
  mail:sv('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>'),
  sms:sv('<path d="M4 4h16v12H8l-4 4z"/><path d="M8 9h8M8 12h5"/>'),
  inbox:sv('<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5h13L22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/>'),
  globe:sv('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/>'),
  bell:sv('<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>'),
  clock:sv('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  card:sv('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
  bank:sv('<path d="M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M12 3l9 5H3z"/>'),
  euro:sv('<path d="M18 7a7 7 0 1 0 0 10M4 10h10M4 14h10"/>'),
  timer:sv('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M10 2h4"/>'),
  map:sv('<path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4z"/><path d="M8 2v16M16 6v16"/>'),
  pin:sv('<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
  sun:sv('<circle cx="12" cy="14" r="4"/><path d="M12 4v2M4.9 7.9l1.4 1.4M17.7 9.3l1.4-1.4M2 18h20M7 21h10"/>'),
  spark:sv('<path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/>'),
  filter:sv('<path d="M22 3H2l8 9.5V19l4 2v-8.5z"/>'),
  checksq:sv('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l3 3 5-6"/>'),
  user:sv('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>'),
  megaphone:sv('<path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1zM17 9a4 4 0 0 1 0 6"/>'),
  send:sv('<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>'),
  shield:sv('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>'),
  trend:sv('<path d="M23 6l-9.5 9.5-5-5L1 18M17 6h6v6"/>'),
  expand:sv('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
  camera:sv('<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'),
  trash:sv('<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>'),
  minus:sv('<path d="M5 12h14"/>',' stroke-width="2.4"'),
  mark:'<svg viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2.5" stroke="#fff" stroke-width="1.8"/><path d="M12 4v16M4 12h16" stroke="#fff" stroke-width="1.2" opacity=".55"/><path d="M7 17L17 7" stroke="#ebbd4c" stroke-width="2.6" stroke-linecap="round"/></svg>',
};

const PAGES=[["vandaag","Vandaag"],["route","Route"],["planning","Planning"],["klanten","Klanten"],["communicatie","Communicatie"],["offertes","Offertes"],["facturen","Facturen"],["uitvoering","Uitvoering"],["inzichten","Inzichten"],["instellingen","Instellingen"],["handleiding","Handleiding"]];
const DIENSTEN=["Glasbewassing","Glasbewassing buiten","Begane grond glas","Binnen en buiten","Dakgoot reinigen","Zonnepanelen reinigen","Kozijnen reinigen","Gevelreiniging","Schoonmaak"];
const KANAAL={whatsapp:"WhatsApp",sms:"SMS",email:"E-mail"};
const KOSTCAT=["Materiaal","Brandstof","Auto en bus","Gereedschap","Telefoon en internet","Verzekering","Kleding","Software","Overig"];
const TPL={
  aankondiging:{naam:"Aankondiging",doel:"Vaste beurt aankondigen",onderwerp:"Aankondiging: glasbewassing op [date.appointment] – [name.company]",mail:"Beste [firstname.customer],\n\nOp [date.appointment] komen we bij u langs, rond [time.appointment] uur *\n\nWe voeren dan de volgende werkzaamheden uit aan de [address.appointment] [housenumber.appointment]:\n[services.appointment]\n\nGraag vragen we u vooraf rekening te houden met het volgende:\n• Ramen en ventilatieroosters gesloten houden\n• Horren verwijderen en rolluiken openen\n• Poorten en hekwerk toegankelijk maken\n• Voldoende ruimte rondom de ramen vrijhouden\n• Een eventuele robotmaaier tijdelijk uitschakelen\n\nMocht er vooraf iets zijn waar we rekening mee moeten houden, laat het ons gerust weten.\n\nMet vriendelijke groet,\n[name.company]\n\n* Het genoemde tijdstip is een richttijd. Door route-, weers- of verkeersomstandigheden kan onze aankomst circa 45 minuten eerder of later zijn. Wanneer onderdelen niet toegankelijk zijn of niet zijn voorbereid, kan het voorkomen dat bepaalde werkzaamheden niet kunnen worden uitgevoerd. De gereserveerde tijd en prijs voor uw woning blijft in dat geval ongewijzigd.",sms:"Hoi [name.customer], op [date.appointment] [timeslot.appointment] komen we uw ramen wassen. Graag de poort open laten. [name.company]"},
  afkondiging:{naam:"Afkondiging",doel:"Bevestigen dat het werk klaar is",onderwerp:"Bevestiging: glasbewassing [date.appointment] afgerond – [name.company]",mail:"Beste [name.customer],\n\nDe werkzaamheden zijn inmiddels afgerond.\nIn de bijlage vindt u de factuur. U kunt deze eenvoudig voldoen via onderstaande betaallink.\n\n[mollielink.invoice]\n\nMet vriendelijke groet,\n[name.company]",sms:"[name.company]: de glasbewassing van [date.appointment] is voltooid. Bedrag: [price.appointment]. Bedankt!"},
  annuleren:{naam:"Afspraak annuleren",doel:"Een afspraak afzeggen",onderwerp:"Annulering: afspraak op [date.appointment] – [name.company]",mail:"Beste [name.customer],\n\nHelaas moeten wij de geplande glasbewassing op [date.appointment] annuleren.\n\nAdres: [fulladdress.appointment]\n\nWe nemen contact met u op voor een nieuwe afspraak. Excuses voor het ongemak.\n\nMet vriendelijke groet,\n[name.company]",sms:"Hoi [name.customer], helaas moeten we de afspraak van [date.appointment] annuleren. We nemen contact op voor een nieuwe datum. [name.company]"},
  afspraak:{naam:"Afspraak bevestigen",doel:"Nieuwe afspraak bevestigen",onderwerp:"Bevestiging afspraak – [name.company]",mail:"Beste [name.customer],\n\nHierbij bevestigen wij uw afspraak.\n\nDatum: [date.appointment]\nTijd: [timeslot.appointment]\nAdres: [fulladdress.appointment]\nDienst: [service.appointment]\n\nWilt u de poort of achterom open laten?\n\nMet vriendelijke groet,\n[name.company]",sms:"Hoi [name.customer], op [date.appointment] [timeslot.appointment] komen we de ramen wassen bij [fulladdress.appointment]. Wil je de poort open laten? [name.company]"},
  weer:{naam:"Afspraak verzetten",doel:"Verzetten, bv. door slecht weer",onderwerp:"Verzetten: uw afspraak op [date.appointment] – [name.company]",mail:"Beste [name.customer],\n\nWij willen u laten weten dat uw afspraak op [date.appointment] helaas verzet moet worden, bijvoorbeeld door het weer.\n\nAdres: [fulladdress.appointment]\n\nWij laten u zo snel mogelijk weten wanneer we wel komen.\n\nMet vriendelijke groet,\n[name.company]",sms:"Hoi [name.customer], door het weer schuiven we de glasbewassing van [date.appointment] een paar dagen op. We laten je weten wanneer we komen. [name.company]"},
  wijzigen:{naam:"Afspraak wijzigen",doel:"Tijd of dienst gewijzigd",onderwerp:"Wijziging: uw afspraak op [date.appointment] – [name.company]",mail:"Beste [name.customer],\n\nEr is een wijziging in uw afspraak.\n\nNieuwe datum: [date.appointment]\nTijd: [timeslot.appointment]\nAdres: [fulladdress.appointment]\nDienst: [service.appointment]\n\nKomt dit niet uit? Laat het ons weten.\n\nMet vriendelijke groet,\n[name.company]",sms:"Hoi [name.customer], je afspraak is gewijzigd naar [date.appointment] [timeslot.appointment]. Komt het niet uit? Laat het weten. [name.company]"},
  aanmaning:{naam:"Betaalherinnering",doel:"Openstaande factuur",onderwerp:"Herinnering: openstaande factuur [nr.invoice] – [name.company]",mail:"Beste [name.customer],\n\nOnze factuur [nr.invoice] van [total.invoice] staat nog open. Wellicht is deze aan uw aandacht ontsnapt. De vervaldatum was [duedate.invoice].\n\nWilt u het bedrag overmaken op [iban.company] t.n.v. [name.company], onder vermelding van [nr.invoice]?\n\nHeeft u de betaling net gedaan? Dan kunt u dit bericht als niet verzonden beschouwen.\n\nMet vriendelijke groet,\n[name.company]",sms:"Herinnering: factuur [nr.invoice] van [total.invoice] staat nog open. [mollielink.invoice] [name.company]"},
  factuur:{naam:"Factuur versturen",doel:"Factuur na het werk",onderwerp:"Factuur [nr.invoice] van [name.company]",mail:"Beste [name.customer],\n\nBijgaand ontvangt u de factuur voor de uitgevoerde werkzaamheden.\n\nHeeft u vragen over deze factuur? Neem gerust contact met ons op.\n\nMet vriendelijke groet,\n[name.company]",sms:"Hoi [name.customer], hierbij factuur [nr.invoice] van [total.invoice]. Graag overmaken vóór [duedate.invoice] op [iban.company]. [mollielink.invoice] [name.company]"},
  herinnering:{naam:"Herinnering afspraak",doel:"Dag vooraf herinneren",onderwerp:"Herinnering: afspraak morgen – [name.company]",mail:"Beste [name.customer],\n\nDit is een herinnering dat wij morgen bij u langskomen.\n\nDatum: [date.appointment]\nTijd: [timeslot.appointment]\nAdres: [fulladdress.appointment]\nDienst: [service.appointment]\n\nAlvast bedankt dat u ervoor zorgt dat wij erbij kunnen.\n\nMet vriendelijke groet,\n[name.company]",sms:"Herinnering: morgen ([date.appointment]) [timeslot.appointment] komen we langs op [fulladdress.appointment]. [name.company]"},
  offerte:{naam:"Offerte versturen",doel:"Offerte naar een klant",onderwerp:"Uw offerte van [name.company]",mail:"Beste [name.customer],\n\nHartelijk dank voor uw interesse. Hierbij ontvangt u onze offerte [nr.invoice] voor [total.invoice]. De offerte is geldig tot [duedate.invoice].\n\nLaat gerust weten of u akkoord gaat, dan plannen we u direct in.\n\nMet vriendelijke groet,\n[name.company]",sms:""},
  welkom:{naam:"Welkom nieuwe klant",doel:"Nieuwe klant verwelkomen",onderwerp:"Welkom bij [name.company]!",mail:"Beste [name.customer],\n\nHartelijk welkom bij [name.company]! Wij zijn verheugd u als klant te mogen verwelkomen.\n\nWij wassen uw ramen elke [interval.appointment] voor [price.appointment]. Vragen of iets aanpassen? Stuur gerust een bericht.\n\nMet vriendelijke groet,\n[name.company]",sms:""},
  voltooid:{naam:"Werk voltooid",doel:"Bedanken na de klus",onderwerp:"Job voltooid – dank u wel! – [name.company]",mail:"Beste [name.customer],\n\nWij hebben vandaag de werkzaamheden bij u uitgevoerd.\n\nUitgevoerde dienst: [service.appointment]\nAdres: [fulladdress.appointment]\n\nBedankt voor uw vertrouwen. De factuur ontvangt u apart.\n\nMet vriendelijke groet,\n[name.company]",sms:"Hoi [name.customer], we zijn klaar met de [service.appointment] op [fulladdress.appointment]. Bedankt! [name.company]"},
  review:{naam:"Reviewverzoek",doel:"Om een review vragen",onderwerp:"Tevreden over ons werk?",mail:"Beste [name.customer],\n\nBedankt dat we voor u mochten werken!\n\nZou u ons willen helpen met een korte review? Het kost u minder dan een minuut en het helpt ons enorm om nieuwe klanten te bereiken.\n\nMet vriendelijke groet,\n[name.company]",sms:"Hoi [name.customer], bedankt dat we je ramen weer mochten wassen! Zou je een korte review willen geven? [link.review] [name.company]"},
  nieuwsbrief:{naam:"Nieuwsbrief / algemeen",doel:"Bericht aan meerdere klanten",onderwerp:"Nieuws van [name.company]",mail:"Beste [name.customer],\n\nEen kort bericht van [name.company]: \n\nMet vriendelijke groet,\n[name.company]",sms:"Hoi [name.customer], een kort bericht van [name.company]: "},
  verjaardag:{naam:"Verjaardag",doel:"Klant feliciteren op de verjaardag",onderwerp:"Van harte gefeliciteerd! – [name.company]",mail:"Beste [name.customer],\n\nVan harte gefeliciteerd met uw verjaardag! Wij wensen u een fijne dag.\n\nMet vriendelijke groet,\n[name.company]",sms:"Hoi [name.customer], van harte gefeliciteerd met uw verjaardag! Groet, [name.company]"},
  vrij:{naam:"Eigen bericht",doel:"Leeg bericht",onderwerp:"Bericht van [name.company]",mail:"Beste [name.customer],\n\n\n\nMet vriendelijke groet,\n[name.company]",sms:"Hoi [name.customer], "}
};
const FHM=[
  {aan:true,dagen:3,kanaal:"email",naam:"1e herinnering",onderwerp:"Herinnering: factuur [nr.invoice] staat nog open",mail:"Beste [name.customer],\n\nVolgens onze administratie staat factuur [nr.invoice] van [total.invoice] nog open. De vervaldatum was [duedate.invoice].\n\n[payline.invoice]Of maak het bedrag over op [iban.company] t.n.v. [name.company], onder vermelding van [nr.invoice].\n\nMet vriendelijke groet,\n[name.company]",sms:"Herinnering: factuur [nr.invoice] van [total.invoice] staat nog open. [mollielink.invoice] - [name.company]"},
  {aan:true,dagen:10,kanaal:"email",naam:"2e herinnering",onderwerp:"Tweede herinnering: factuur [nr.invoice]",mail:"Beste [name.customer],\n\nFactuur [nr.invoice] van [total.invoice] is inmiddels [daysoverdue.invoice] dagen over de vervaldatum. Wilt u het bedrag zo snel mogelijk overmaken op [iban.company] t.n.v. [name.company], onder vermelding van [nr.invoice]?\n\n[payline.invoice]Heeft u al betaald, dan kunt u dit bericht negeren.\n\nMet vriendelijke groet,\n[name.company]",sms:"2e herinnering: factuur [nr.invoice] ([total.invoice]) staat nog open. [mollielink.invoice] - [name.company]"},
  {aan:true,dagen:21,kanaal:"email",naam:"Aanmaning",onderwerp:"Aanmaning: factuur [nr.invoice]",mail:"Beste [name.customer],\n\nOndanks eerdere herinneringen hebben wij de betaling van factuur [nr.invoice] ([total.invoice]) nog niet ontvangen. Wij verzoeken u het bedrag binnen 14 dagen over te maken op [iban.company] t.n.v. [name.company], onder vermelding van [nr.invoice].\n\nNeem gerust contact op via [phone.company] als er iets niet klopt.\n\nMet vriendelijke groet,\n[name.company]",sms:"Aanmaning: factuur [nr.invoice] ([total.invoice]) is [daysoverdue.invoice] dagen te laat. Graag binnen 14 dagen betalen. [name.company]"}];
const DEF={naam:"",adres:"",postcode:"",plaats:"",telefoon:"",email:"",kvk:"",btwnr:"",iban:"",peppolId:"",land:"NL",taal:"nl",btw:21,incl:true,termijn:14,startadres:"",
  logo:"",logoMail:"",logoGrootte:72,logoUitlijning:"links",hoofdkleur:"#137a8a",accentkleur:"#e3b23c",
  smsNaam:"",toonEx:false,betaallink:"",
  dagAan:true,dagKanaal:"whatsapp",dagVast:true,dagDagen:1,dagTijd:"18:00",dagUurAan:false,dagUren:2,dagOnderwerp:"Herinnering: morgen komen wij langs",
  dagMail:"Beste [name.customer],\n\nEen korte herinnering: op [date.appointment] komen wij langs voor [service.appointment] op [fulladdress.appointment], [timeslot.appointment].\n\nZorgt u ervoor dat wij erbij kunnen? Alvast bedankt.\n\nMet vriendelijke groet,\n[name.company]",
  dagSms:"Herinnering: op [date.appointment] komen wij langs op [fulladdress.appointment], [timeslot.appointment]. [name.company]",
  fhAan:false,fhTijd:"09:00",fhSkip:3,fhWerkdagen:true,fhIncasso:true,fhStop:true,fhM:FHM,
  rapportAan:false,rapportDag:1,boekhouderEmail:"",
  skipRedenen:["Niet thuis","Slecht weer","Geen toegang","Klant belde af","Ziek","Anders"],annuleerRedenen:["Verhuisd","Te duur","Doet het zelf","Ontevreden","Anders"],betaalwijze:"overmaken",
  welkomAan:true,voorwaarden:"",opzegtermijn:"1 maand",incassoVragen:false,
  werkdagen:[1,2,3,4,5],vrijeDag:"voor",feestdagen:true,
  reviewAan:false,reviewMax:2,reviewDagen:180,reviewLink:""};

const state={tab:"vandaag",klanten:[],beurten:[],facturen:[],routes:{},settings:{},sjablonen:{},berichten:[],kosten:[],prijzen:{},aangiftes:{},
  q:"",kf:"alle",ronde:"",sel:null,kpp:25,kpage:1,
  fFilter:"alle",fq:"",oFilter:"alle",mq:"",mch:"alle",mst:"alle",mpp:25,ctab:"recent",mpage:1,tq:"",tf:"alle",tplSide:{},
  pview:"dag",slot:30,rowH:1,pstat:"alle",pq:"",planDay:null,multiDays:null,planMode:false,pick:null,achter:false,mon:null,
  week:startOfWeek(new Date()),vDay:null,routeDay:null,
  btab:"overzicht",bjaar:new Date().getFullYear(),bper:"jaar",itab:"geld",iper:"maand",hq:"",open:{},
  collapsed:false,loaded:false,db:null,dl:null,assets:null,me:null};
try{const t=localStorage.getItem("zeem.tab");if(t&&PAGES.some(x=>x[0]===t))state.tab=t;else if(window.matchMedia&&matchMedia("(max-width:979px)").matches)state.tab="route";state.collapsed=localStorage.getItem("zeem.col")==="1"}catch(e){}
const S=()=>({...DEF,...state.settings});
const big=()=>matchMedia("(min-width:980px)").matches;

/* ---------- OPSLAG ----------
   Alles wat mijnschoonmaker bewaart loopt via dit blok: save(), del(), init() en BLOB (adres van foto's en bestanden).
   Bij de overstap naar een eigen server wordt alleen dit blok vervangen door de database van de server;
   de rest van mijnschoonmaker blijft hetzelfde. Gegevensformaat per collectie: zie exportAlles() (versie 1). */
const BLOB="/_blob/";
const LIVE=typeof window!=="undefined"&&!!window.ZEEM_LIVE;
const SETEXTRA={};
const RAW={};
const COLS=["klanten","beurten","facturen","routes","instellingen","berichten","kosten"];
const mem={};COLS.forEach(c=>mem[c]=new Map());
function apply(col,docs){
  RAW[col]=docs;
  if(col==="instellingen"){const g=id=>{const d=docs.find(x=>x.id===id);return d?strip(d):{}};state.settings=g("bedrijf");state.sjablonen=g("sjablonen");state.prijzen=g("prijzen");state.aangiftes=g("aangiftes");state.ramen=g("ramen");state.planmails=g("planmails");state.uitv=g("uitvoering");if(typeof U!=="undefined"&&!Udirty)U=null}
  if(col==="instellingen"&&!state._slotInit&&docs.length){state._slotInit=1;const b=docs.find(x=>x.id==="bedrijf");if(b){if(b.slotStd)state.slot=Number(b.slotStd);if(b.ultra)state.rowH=.7;else if(b.compact)state.rowH=.85}}
  else if(col==="routes"){state.routes={};docs.forEach(d=>state.routes[d.id]=d)}
  else state[col]=docs;
}
async function save(col,id,data){if(state.db)await state.db.collection(col).doc(id).set(data);else{mem[col].set(id,{...data,id});apply(col,[...mem[col].values()]);schedule()}}
async function del(col,id){if(state.db)await state.db.collection(col).doc(id).delete();else{mem[col].delete(id);apply(col,[...mem[col].values()]);schedule()}}
let rq=0;function schedule(){if(rq)return;rq=requestAnimationFrame(()=>{rq=0;render()})}
async function init(){
  const use=async n=>{try{return window.claude?await window.claude.use(n):null}catch(e){return null}};
  [state.dl,state.assets]=await Promise.all([use("downloads"),use("assets")]);
  use("user").then(async u=>{if(!u)return;state.u=u;try{state.me=await u.me();schedule()}catch(e){}});
  const db=await use("db");
  if(!db){state.loaded=true;$("#status").innerHTML='<div class="notice">Opslaan is hier niet beschikbaar. Wijzigingen blijven alleen staan tot je de pagina sluit.</div>';schedule();return}
  state.db=db;const seen=new Set();
  if(!LIVE)$("#status").innerHTML='<div class="notice verhuisd"><b>Deze CRM is verhuisd.</b> Gebruik voortaan <a href="https://crm.mijnschoonmaker.com" target="_blank" rel="noopener">crm.mijnschoonmaker.com</a> (of <a href="https://mijnschoonmaker-95789.web.app" target="_blank" rel="noopener">mijnschoonmaker-95789.web.app</a>). Wat je hier wijzigt, komt niet in de nieuwe CRM.</div>';
  COLS.forEach(col=>db.collection(col).onSnapshot(s=>{
    apply(col,s.docs.map(d=>({...d.data(),id:d.id})));seen.add(col);if(seen.size===COLS.length){if(!state.loaded)setTimeout(migGeenTijd,400);state.loaded=true}schedule();
  },e=>{$("#status").innerHTML='<div class="notice">Gegevens konden niet worden geladen ('+esc(e.code)+'). Vernieuw de pagina.</div>'}));
}

/* ---------- HULPJES ---------- */
let toastT;
function toast(msg,acts){
  document.querySelectorAll(".toast").forEach(t=>t.remove());
  if(typeof acts==="function")acts=[{label:"Ongedaan maken",fn:acts}];
  const el=document.createElement("div");el.className="toast";el.setAttribute("role","status");
  el.innerHTML='<span class="toast-ic">'+((I&&I.check&&/opgeslagen|toegevoegd|verwijderd|verstuurd|bijgewerkt|gewijzigd|klaar|gelukt|ingepland|loopt|geregistreerd|afgemeld|gefactureerd|afgevinkt/i.test(msg))?I.check:(I&&I.alert?I.alert:""))+'</span><span class="toast-tx">'+esc(msg)+"</span>";
  (acts||[]).forEach(a=>{const b=document.createElement("button");b.type="button";b.textContent=a.label;b.onclick=()=>{el.remove();a.fn()};el.appendChild(b)});
  (dlg.open?dlg:document.body).appendChild(el);clearTimeout(toastT);el.onclick=e=>{if(e.target.tagName!=="BUTTON")el.remove()};toastT=setTimeout(()=>el.remove(),acts&&acts.length?6500:Math.min(8000,3000+String(msg).length*35));
}
async function copy(text,btn){
  try{await navigator.clipboard.writeText(text);toast("Gekopieerd")}
  catch(e){const ta=document.createElement("textarea");ta.value=text;ta.style.position="fixed";ta.style.opacity="0";(btn?.closest("dialog")||document.body).appendChild(ta);ta.select();
    let ok=false;try{ok=document.execCommand("copy")}catch(_){}ta.remove();toast(ok?"Gekopieerd":"Kopiëren lukte niet. Selecteer de tekst zelf.")}
}
const err=e=>toast("Niet opgeslagen: "+(e?.message||e?.code||"onbekende fout"));
const EMPTY_ILL=`<div class="ill-fan"><span><b></b><b></b></span><span><b></b><b></b><b></b></span><span><b></b><b></b></span></div>`;
const empty=(t,s,btn="")=>`<div class="empty"><div class="ill">${EMPTY_ILL}</div><strong>${t}</strong><span>${s}</span>${btn}</div>`;
const dlg=$("#dlg"),form=$("#dlgForm");
let dlgGuard=null;
async function sluitDlg(then){if(dlgGuard){let ok=false;try{ok=await dlgGuard()}catch(e){console.error(e)}if(!ok)return}dlgGuard=null;if(then)then();else dlg.close()}
function openDlg(html,{wide=false,drawer=false,xwide=false}={}){dlgGuard=null;dlg.className=drawer?"drawer":xwide?"xwide":wide?"wide":"";form.dataset.sheet="";form.innerHTML=html;form.onsubmit=e=>e.preventDefault();if(!dlg.open)dlg.showModal();dlg.scrollTop=0}
dlg.addEventListener("click",e=>{if(e.target===dlg)sluitDlg()});
dlg.addEventListener("cancel",e=>{if(dlgGuard){e.preventDefault();sluitDlg()}});
dlg.addEventListener("close",()=>{dlgGuard=null});
const statusPill=(cls,txt)=>`<span class="pill ${cls} dotp">${esc(txt)}</span>`;
async function runSeq(list,fn,done){try{for(const x of list)await fn(x);if(done)toast(done)}catch(e){err(e)}}


/* eenmalig: afspraken zonder tijd uit de planning halen; ze staan daarna weer bij Te plannen */
async function migGeenTijd(){try{if((state.settings||{}).migGeenTijd)return;
  const l=state.klanten.filter(k=>k.gepland&&!k.tijd&&k.actief!==false);
  for(const k of l)await save("klanten",k.id,{...strip(k),gepland:"",tijd:"",aanbieden:true});
  const sd={...state.settings,migGeenTijd:true};await save("instellingen","bedrijf",sd);state.settings=sd;
  if(l.length)toast(plural(l.length,"afspraak zonder tijd","afspraken zonder tijd")+" uit de planning gehaald · ze staan bij Te plannen")}catch(e){console.error(e)}}
