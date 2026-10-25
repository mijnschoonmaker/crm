"""Zelftest van het Mansard CRM.

Draait bij elke update in GitHub (workflow "Online zetten") vóórdat er iets live gaat.
Faalt er één controle, dan stopt de update en staat in het overzicht precies wat er mis is.

Lokaal draaien:  python3 tests/selftest.py   (vanuit de map van de repository)
"""
import http.server, json, os, socketserver, sys, threading, functools
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = []  # (groep, naam, ok, detail)


def check(groep, naam, ok, detail=""):
    RES.append((groep, naam, bool(ok), str(detail)[:300]))


class Handler(http.server.SimpleHTTPRequestHandler):
    """repository als webroot; bestaat een bestand niet, dan uit public/ (zoals de live site)"""
    def translate_path(self, path):
        p = super().translate_path(path)
        if not os.path.exists(p):
            alt = os.path.join(ROOT, "public", os.path.relpath(p, ROOT))
            if os.path.exists(alt):
                return alt
        return p

    def log_message(self, *a):
        pass


def server():
    h = functools.partial(Handler, directory=ROOT)
    s = socketserver.TCPServer(("127.0.0.1", 0), h)
    threading.Thread(target=s.serve_forever, daemon=True).start()
    return s, s.server_address[1]


def nieuwe_pagina(b, w, h):
    pg = b.new_page(viewport={"width": w, "height": h})
    pg.route(lambda u: not u.startswith("http://127.0.0.1"), lambda r: r.abort())
    pg.fouten = []
    pg.on("pageerror", lambda e: pg.fouten.append(str(e)+" @ "+str(getattr(e,"stack","") or "")[:400].replace(chr(10)," | ")))
    return pg


def crm(b, base, w=1300, h=900):
    pg = nieuwe_pagina(b, w, h)
    pg.goto(base + "/glazenwasser-crm.html?selftest")
    pg.wait_for_function("window.MSTEST && MSTEST.state", timeout=20000)
    pg.wait_for_timeout(800)
    return pg


def pagina_s(pg, groep):
    """elke pagina van het CRM openen: geen fouten en er staat iets op"""
    for v in pg.evaluate("MSTEST.views()"):
        voor = len(pg.fouten)
        try:
            pg.evaluate("v=>MSTEST.ga(v)", v)
            pg.wait_for_timeout(250)
            n = pg.evaluate("(document.querySelector('main')||document.body).innerText.trim().length")
            nieuw = pg.fouten[voor:]
            check(groep, f"Pagina '{v}' opent", not nieuw and n > 20, "; ".join(nieuw) or f"{n} tekens")
        except Exception as e:
            check(groep, f"Pagina '{v}' opent", False, e)


def instellingen(pg):
    """elke instellingenkaart openen en weer sluiten"""
    G = "Instellingen"
    pg.evaluate("MSTEST.ga('instellingen')")
    pg.wait_for_timeout(400)
    ids = pg.evaluate("[...new Set([...document.querySelectorAll('[data-act=setedit]')].map(e=>e.dataset.v))]")
    for v in ids:
        voor = len(pg.fouten)
        pg.evaluate("v=>{MSTEST.ga('instellingen');const e=document.querySelector('[data-act=setedit][data-v=\"'+v+'\"]');if(e)e.click()}", v)
        pg.wait_for_timeout(250)
        open_ = pg.evaluate("!!document.querySelector('dialog[open]')||MSTEST.state.tab!=='instellingen'")
        pg.evaluate("document.querySelectorAll('dialog[open]').forEach(d=>{try{d.close()}catch(e){}})")
        nieuw = pg.fouten[voor:]
        check(G, f"Instelling '{v}' opent zonder fouten", not nieuw and open_, "; ".join(nieuw) or ("geen venster" if not open_ else ""))


def rekenregels(pg):
    G = "Rekenregels"
    t = lambda f: {k: v for k, v in pg.evaluate("f=>MSTEST.totals(f)", f).items() if k != "tarieven"}
    r = t({"regels": [{"aantal": 1, "prijs": 121}], "btw": 21, "incl": True})
    check(G, "Btw 21% inclusief: € 121 = € 100 + € 21", r == {"ex": 100, "btw": 21, "inc": 121}, r)
    r = t({"regels": [{"aantal": 2, "prijs": 50}], "btw": 21, "incl": False})
    check(G, "Btw 21% exclusief: 2 × € 50 = € 121 incl.", r == {"ex": 100, "btw": 21, "inc": 121}, r)
    r = t({"regels": [{"aantal": 3, "prijs": 10.9}], "btw": 9, "incl": True})
    check(G, "Btw 9%: 3 × € 10,90 = € 30 + € 2,70", r == {"ex": 30, "btw": 2.7, "inc": 32.7}, r)
    r = t({"regels": [{"aantal": 1, "prijs": 80}], "btw": 0, "incl": True})
    check(G, "Btw verlegd (0%): geen btw", r == {"ex": 80, "btw": 0, "inc": 80}, r)
    r = t({"regels": [{"aantal": 1, "prijs": 45}, {"aantal": 1, "prijs": -5}], "btw": 21, "incl": True})
    check(G, "Korting als minregel telt mee", r["inc"] == 40, r)
    w = pg.evaluate("[MSTEST.wikKosten(0),MSTEST.wikKosten(100),MSTEST.wikKosten(3000),MSTEST.wikKosten(1e7)]")
    check(G, "Wettelijke incassokosten (WIK-staffel)", w == [0, 40, 425, 6775], w)
    d = pg.evaluate("MSTEST.nrDelen('2026-0141')")
    check(G, "Factuurnummer uit elkaar halen", d == {"pre": "2026-", "n": 141, "pad": 4}, d)
    if pg.evaluate("!!MSTEST.kmFmt"):
        k = pg.evaluate("['v962fn','VFL32F','12abc3','ab12cd'].map(MSTEST.kmFmt)")
        check(G, "Kentekens netjes schrijven", k == ["V-962-FN", "VFL-32-F", "12-ABC-3", "AB-12-CD"], k)


def nummering(pg):
    G = "Factuurnummers"
    r = pg.evaluate("""async()=>{const T=MSTEST,j=String(new Date().getFullYear()+5),d=j+'-03-01';
      const a=T.newId('ftest'),b=T.newId('ftest');
      await T.save('facturen',a,{soort:'factuur',nummer:j+'-0007',datum:d,regels:[],status:'open'});
      await T.save('facturen',b,{soort:'factuur',nummer:j+'-0012',datum:d,regels:[],status:'open'});
      const uit={volgende:T.nextNr('factuur',d),offerte:T.nextNr('offerte',d)};
      await T.del('facturen',a);await T.del('facturen',b);return {...uit,j}}""")
    check(G, "Volgend factuurnummer sluit aan op het hoogste", r["volgende"] == r["j"] + "-0013", r)
    check(G, "Eerste offertenummer van het jaar", r["offerte"] == "OFF-" + r["j"] + "-001", r)
    # twee gebruikers maken tegelijk een factuur met hetzelfde nummer: de nieuwste (van deze gebruiker) schuift door
    r = pg.evaluate("""async()=>{const T=MSTEST,j=String(new Date().getFullYear()+6),d=j+'-03-01';
      await T.save('facturen','fzz-ander',{soort:'factuur',nummer:j+'-0001',datum:d,regels:[],status:'open'});
      await T.save('facturen','fzz-mijn',{soort:'factuur',nummer:j+'-0001',datum:d,regels:[],status:'concept'});
      await T.nrBewaker();await new Promise(r=>setTimeout(r,300));
      const g=id=>(T.state.facturen.find(x=>x.id===id)||{}).nummer,uit={ander:g('fzz-ander'),mijn:g('fzz-mijn'),j};
      await T.del('facturen','fzz-ander');await T.del('facturen','fzz-mijn');return uit}""")
    check(G, "Dubbel nummer: de oudste houdt zijn nummer", r["ander"] == r["j"] + "-0001", r)
    check(G, "Dubbel nummer: de nieuwe krijgt het volgende vrije nummer", r["mijn"] == r["j"] + "-0002", r)


def abonnement(pg):
    G = "Abonnement"
    r = pg.evaluate("""()=>{const T=MSTEST;if(!T.msStatus||!T.MS)return null;const oud=T.MS.doc,v=T.iso(T.today()),dag=n=>T.iso(T.addDays(T.today(),n));
      const s=d=>{T.MS.doc=d;return T.msStatus()};
      const uit={goed:s({status:'actief'}),kort:s({status:'actief',achterstand:true,foutOp:dag(-3)}),lang:s({status:'actief',achterstand:true,foutOp:dag(-20)})};
      T.MS.doc=oud;return uit}""")
    if r is None:
        check(G, "Abonnementsstatus te testen", False, "msStatus niet bereikbaar"); return
    check(G, "Actief abonnement: toegang", r["goed"]["ok"], r["goed"])
    check(G, "Mislukte betaling: eerst 14 dagen gewoon doorwerken", r["kort"]["ok"] and r["kort"]["soort"] == "achterstand", r["kort"])
    check(G, "Na 14 dagen zonder betaling: dicht", (not r["lang"]["ok"]) and r["lang"]["soort"] == "onbetaald", r["lang"])


def afmelden(pg):
    G = "Afmelden en factureren"
    r = pg.evaluate("""async()=>{const T=MSTEST,id=T.newId('ktest'),vd=T.iso(T.today());
      await T.save('klanten',id,{naam:'Zelftest, Klant',adres:'Teststraat 1',postcode:'1234 AB',plaats:'Teststad',email:'test@voorbeeld.nl',
        prijs:45,frequentie:4,dienst:'Glasbewassing',gepland:vd,tijd:'09:00',duur:30,actief:true,autoplan:true,tellingGecontroleerd:true,soort:'particulier',log:[],objecten:[]});
      const k=T.state.klanten.find(x=>x.id===id);
      await T.afronden(k,'concept');await new Promise(r=>setTimeout(r,400));
      const k2=T.state.klanten.find(x=>x.id===id)||{},b=T.state.beurten.find(x=>x.klantId===id),f=T.state.facturen.find(x=>x.klantId===id&&x.soort==='factuur');
      const uit={laatst:k2.laatst,gepland:k2.gepland,vd,beurt:!!b,factuur:!!f,status:f&&f.status,inc:f?T.totals(f).inc:null,koppeling:!!(b&&f&&b.gefactureerd===f.id)};
      if(f){await T.setFStatus(f.id,'betaald');await new Promise(r=>setTimeout(r,300));
        const f2=T.state.facturen.find(x=>x.id===f.id),b2=T.state.beurten.find(x=>x.id===b.id);
        uit.betaald=f2&&f2.status;uit.betaaldOp=f2&&f2.betaaldOp;uit.beurtBetaald=b2&&b2.betaald}
      try{const dl=document.querySelector('dialog[open]');if(dl)dl.close()}catch(e){}
      for(const x of T.state.beurten.filter(x=>x.klantId===id))await T.del('beurten',x.id);
      for(const x of T.state.facturen.filter(x=>x.klantId===id))await T.del('facturen',x.id);
      await T.del('klanten',id);return uit}""")
    check(G, "Afmelden maakt een beurt aan", r["beurt"], r)
    check(G, "Afmelden maakt een conceptfactuur", r["factuur"] and r["status"] == "concept", r)
    check(G, "Factuurbedrag is de prijs van de klant (€ 45)", r["inc"] == 45, r)
    check(G, "Beurt is aan de factuur gekoppeld", r["koppeling"], r)
    check(G, "Laatste bezoek staat op vandaag", r["laatst"] == r["vd"], r)
    check(G, "Volgende afspraak is doorgepland", bool(r["gepland"]) and r["gepland"] > r["vd"], r)
    check(G, "Op betaald zetten zet datum en beurt op betaald", r.get("betaald") == "betaald" and r.get("betaaldOp") == r["vd"] and r.get("beurtBetaald") is True, r)


def statistieken(pg):
    """Statistieken, Analyse, werkdag en facturen rekenen met dezelfde bedragen"""
    G = "Statistieken kloppen"
    r = pg.evaluate("""async()=>{const T=MSTEST,vd=T.iso(T.today()),id=x=>T.newId(x),kA=id('kst'),kB=id('kst'),kP=id('kst'),f1=id('fst'),f2=id('fst'),b=[id('bst'),id('bst'),id('bst'),id('bst')];
      const kl=(i,x)=>T.save('klanten',i,{naam:'Statistiek, '+x,prijs:60.5,frequentie:4,actief:true,aangemaakt:vd,log:[],objecten:[]});
      await kl(kA,'A');await kl(kB,'B');await T.save('klanten',kP,{naam:'Statistiek, Prospect',prospect:true,actief:true,aangemaakt:vd,log:[],objecten:[]});
      /* factuur voor twee beurten: 2 x 60,50 incl 21% = 100 ex */
      await T.save('facturen',f1,{soort:'factuur',nummer:'ST-1',klantId:kA,datum:vd,status:'open',btw:21,incl:true,regels:[{omschrijving:'Glasbewassing',aantal:1,prijs:60.5},{omschrijving:'Glasbewassing',aantal:1,prijs:60.5}]});
      /* btw verlegd: 80 ex */
      await T.save('facturen',f2,{soort:'factuur',nummer:'ST-2',klantId:kB,datum:vd,status:'open',btw:0,incl:true,regels:[{omschrijving:'Glasbewassing',aantal:1,prijs:80}]});
      await T.save('beurten',b[0],{klantId:kA,datum:vd,bedrag:60.5,gefactureerd:f1,dienst:'Glasbewassing'});
      await T.save('beurten',b[1],{klantId:kA,datum:vd,bedrag:60.5,gefactureerd:f1,dienst:'Glasbewassing'});
      await T.save('beurten',b[2],{klantId:kB,datum:vd,bedrag:80,gefactureerd:f2,dienst:'Glasbewassing'});
      await T.save('beurten',b[3],{klantId:kB,datum:vd,bedrag:50,gefactureerd:'',dienst:'Glasbewassing',geannuleerd:true});
      const bs=T.state.beurten.filter(x=>b.includes(x.id)),fs=T.state.facturen.filter(x=>[f1,f2].includes(x.id));
      const werk=bs.reduce((a,x)=>a+T.beurtOmzet(x),0),sp=T.stDienstSplit(bs),dienst=Object.values(sp.per).reduce((a,v)=>a+v,0);
      const geld=fs.reduce((a,f)=>a+T.totals(f).ex,0),F=T.fin([T.today(),T.today()]),inFin=fs.every(f=>F.fs.includes(f));
      const kP_=T.state.klanten.find(x=>x.id===kP),actP=T.klantActiefIn(kP_,vd,vd,{});
      for(const x of b)await T.del('beurten',x);for(const x of [f1,f2])await T.del('facturen',x);for(const x of [kA,kB,kP])await T.del('klanten',x);
      const r=v=>Math.round(v*100)/100;return {werk:r(werk),dienst:r(dienst),geld:r(geld),inFin,actP,geann:T.beurtOmzet({geannuleerd:true,bedrag:50})}}""")
    check(G, "Omzet uit werk = gefactureerde omzet (€ 180 ex btw)", r["werk"] == 180 and r["geld"] == 180, r)
    check(G, "Factuur met twee beurten telt niet dubbel bij omzet per dienst", r["dienst"] == r["werk"], r)
    check(G, "Btw verlegd telt voor het volle bedrag", r["geld"] == 180, r)
    check(G, "Facturen tellen mee in Geld en Boekhouding (zelfde periode)", r["inFin"], r)
    check(G, "Geannuleerde afspraak telt niet als omzet", r["geann"] == 0, r)
    check(G, "Offerte-prospect telt niet als klant", r["actP"] is False, r)


def frequentie(pg):
    G = "Offerte-editor"
    r = pg.evaluate("""()=>{if(!MSTEST.groepEditor)return null;const g={naam:'Gevel',items:[{id:'a',naam:'Daklijst',eenheid:'per strekkende meter',prijs:3.5,sec:60,aantal:20}]};
      const h=MSTEST.groepEditor(g,'t',{offerte:true,freqDefault:8}),d=document.createElement('div');d.innerHTML=h;const s=d.querySelector('select[data-gf=fq]');
      const g2={...g,items:[{...g.items[0],fq:0}]},d2=document.createElement('div');d2.innerHTML=MSTEST.groepEditor(g2,'t',{});
      return {leeg:s&&s.value==='',tekst:s&&s.options[s.selectedIndex].text,zelfde:d2.querySelector('select[data-gf=fq]').options[d2.querySelector('select[data-gf=fq]').selectedIndex].text}}""")
    if r is None:
        return check(G, "Frequentie-keuze aanwezig", False, "groepEditor niet gevonden")
    check(G, "Frequentie staat niet vooraf ingevuld (Selecteer)", r["leeg"] and r["tekst"] == "Selecteer", r)
    check(G, "Gekozen 'Zelfde als glasbewassing' blijft staan", r["zelfde"] == "Zelfde als glasbewassing", r)


def herinneringen(pg):
    G = "Herinneringen en WIK"
    r = pg.evaluate("""()=>{const T=MSTEST;if(!T.fhVolgende)return null;const d=n=>T.iso(T.addDays(T.today(),n));
      const basis={soort:'factuur',status:'open',verstuurdOp:d(-40),regels:[{aantal:1,prijs:50}]};
      const a=T.fhVolgende({...basis,verval:d(-1)});                                   // net te laat: herinnering nog niet
      const b=T.fhVolgende({...basis,verval:d(-30)});                                  // ruim te laat: herinnering klaar
      const c=T.fhVolgende({...basis,verval:d(-30),herinneringen:1,herinnerdOp:d(0)}); // net herinnerd: WIK pas over 7 dagen
      const e=T.fhVolgende({...basis,verval:d(-60),herinneringen:2,herinnerdOp:d(-16),wikOp:d(-16)}); // WIK 16 dagen geleden: Likifin
      const f=T.fhVolgende({...basis,verval:d(-60),herinneringen:2,herinnerdOp:d(-5),wikOp:d(-5)});   // WIK 5 dagen geleden: nog niet
      const g=T.fhVolgende({...basis,verval:d(-30),verstuurdOp:''});                   // niet verstuurd: geen herinnering
      const p=T.fhPoort({...basis,verval:d(-30)},true);                                // WIK terwijl eerst herinnering moet
      return {a:[a&&a.soort,a&&a.klaar,a&&a.datum,d(2)],b:[b.soort,b.klaar],c:[c.soort,c.klaar,c.datum,d(7)],e:[e.soort,e.klaar],f:[f.soort,f.klaar],g,p}}""")
    if r is None:
        return check(G, "Regels aanwezig", False, "fhVolgende niet gevonden")
    check(G, "Herinnering niet eerder dan de ingestelde dagen", r["a"][0] == "herinnering" and r["a"][1] is False and r["a"][2] == r["a"][3], r["a"])
    check(G, "Herinnering klaar als het zover is", r["b"] == ["herinnering", True], r["b"])
    check(G, "WIK-brief pas na de herinnering, met dagen ertussen", r["c"][0] == "wik" and r["c"][1] is False and r["c"][2] == r["c"][3], r["c"])
    check(G, "15 dagen na de WIK-brief klaar voor Likifin", r["e"] == ["likifin", True], r["e"])
    check(G, "Niet eerder naar Likifin", r["f"] == ["likifin", False], r["f"])
    check(G, "Geen herinnering voor een niet-verstuurde factuur", r["g"] is None, r["g"])
    check(G, "WIK-brief kan niet vóór de herinnering", r["p"] is False, r["p"])


def teplannen(pg):
    G = "Planning"
    r = pg.evaluate("""async()=>{const T=MSTEST;if(!T.teplannen)return null;const d=n=>T.iso(T.addDays(T.today(),n)),id=T.newId('kp');
      await T.save('klanten',id,{naam:'Plan, Test',prijs:40,frequentie:8,laatst:d(-10),gepland:d(30),actief:true,ramenRegel:{f:[5],vol:[d(2)]},log:[],objecten:[]});
      const a=T.teplannen(T.addDays(T.today(),7)).some(k=>k.id===id);
      {const k0=T.state.klanten.find(x=>x.id===id);await T.save('klanten',id,{...T.strip(k0),aanbodGezien:d(2)})}
      const c=T.teplannen(T.addDays(T.today(),7)).some(k=>k.id===id);
      const k=T.state.klanten.find(x=>x.id===id);await T.save('klanten',id,{...T.strip(k),ramenRegel:{f:[5],vol:[d(40)]}});
      const b=T.teplannen(T.addDays(T.today(),7)).some(k=>k.id===id);await T.del('klanten',id);
      const id2=T.newId('kp');await T.save('klanten',id2,{naam:'Nieuw, Test',prijs:50,frequentie:16,actief:true,aanbieden:true,ramenRegel:{f:[11,5],vol:[d(60),d(60)]},log:[],objecten:[]});
      const e=T.teplannen(T.today()).some(k=>k.id===id2),f=T.teplannen(T.addDays(T.today(),61)).some(k=>k.id===id2);await T.del('klanten',id2);
      const h3=T.newId('kp'),j3=T.newId('kp');await T.save('klanten',h3,{naam:'Hoofd, Test',prijs:50,frequentie:16,actief:true,laatst:d(-5),opdrachten:[{id:'oT',dienst:'Glasbewassing',prijs:100,frequentie:16,volgende:d(60),actief:true}],log:[],objecten:[]});
      await T.save('klanten',j3,{naam:'Hoofd, Test',prijs:100,frequentie:16,actief:true,aanbieden:true,hoofdKlantId:h3,opdrachtId:'oT',log:[],objecten:[],opdrachten:[]});
      const g=T.teplannen(T.today()).some(k=>k.id===j3),h=T.teplannen(T.addDays(T.today(),61)).some(k=>k.id===j3);await T.del('klanten',j3);await T.del('klanten',h3);return {a,b,c,e,f,g,h}}""")
    if r is None:
        return check(G, "Te plannen", False, "teplannen niet gevonden")
    check(G, "Eerdere aanboddatum komt bij Te plannen", r["a"] is True, r)
    check(G, "Bewust later ingepland: niet nog eens bij Te plannen", r.get("c") is False, r)
    check(G, "Latere aanboddatum laat de afspraak staan", r["b"] is False, r)
    check(G, "Nieuwe klant met latere aanboddatum: nog niet bij Te plannen", r.get("e") is False and r.get("f") is True, r)
    check(G, "Losse opdracht volgt 'Volgende keer' van de hoofdklant", r.get("g") is False and r.get("h") is True, r)
    # gemiste afspraak (eerder ingepland dan de frequentie): verplaatsen naar morgen is niet "te vroeg"
    r = pg.evaluate("""()=>{const T=MSTEST;if(!T.teVroeg)return null;const d=n=>T.iso(T.addDays(T.today(),n));
      const k={naam:'Vroeg, Test',frequentie:6,laatst:d(-14),actief:true};
      return {zonder:T.teVroeg(k,d(1)),gemist:T.teVroeg({...k,gepland:d(-1)},d(1))}}""")
    if r is not None:
        check(G, "Ver vóór de beurt inplannen geeft een waarschuwing", r["zonder"] is True, r)
        check(G, "Gemiste afspraak verplaatsen is niet te vroeg", r["gemist"] is False, r)
    # beheercode van de klant: op concepten live van de klant, op verstuurde facturen de vastgelegde code
    r = pg.evaluate("""()=>{const T=MSTEST;if(!T.invData)return null;const k={id:'bc1',naam:'VvE Test',soort:'vve',adres:'Laan 1',postcode:'1234 AB',plaats:'Stad',beheercode:'1334.0001 SVC: 068829'};
      const f={soort:'factuur',nummer:'T-1',klantId:'bc1',klantNaam:'VvE Test',datum:T.iso(T.today()),verval:T.iso(T.today()),regels:[],status:'concept'};
      const n=x=>T.invData(x,k).naar.join(' | ');
      return {concept:n(f),vast:n({...f,status:'verstuurd',beheercode:'OUD 1'}),geen:n({...f,status:'verstuurd'}),offerte:n({...f,soort:'offerte'})}}""")
    if r is not None:
        check(G, "Beheercode staat op de conceptfactuur", "Beheercode: 1334.0001 SVC: 068829" in r["concept"], r)
        check(G, "Verstuurde factuur houdt de vastgelegde beheercode", "Beheercode: OUD 1" in r["vast"] and "1334" not in r["vast"], r)
        check(G, "Oude verstuurde factuur krijgt geen beheercode achteraf", "Beheercode" not in r["geen"], r)
        check(G, "Geen beheercode op een offerte", "Beheercode" not in r["offerte"], r)
    r = pg.evaluate("""()=>{const T=MSTEST;if(!T.bcVast)return null;const id=T.newId('k');T.state.klanten.push({id,naam:'VvE Vast',beheercode:'ABC 1'});
      const c=T.bcVast({soort:'factuur',klantId:id,status:'concept',beheercode:'X'}),v=T.bcVast({soort:'factuur',klantId:id,status:'verstuurd'}),o=T.bcVast({soort:'factuur',klantId:id,status:'betaald',beheercode:'OUD'});
      T.state.klanten.pop();return {c:'beheercode' in c,v:v.beheercode||'',o:o.beheercode}}""")
    if r is not None:
        check(G, "Beheercode wordt vastgelegd bij versturen", r["v"] == "ABC 1" and r["c"] is False and r["o"] == "OUD", r)
    # btw per regel: 9% voor glasbewassing binnen (particulier) en trappenhuis VvE, de rest 21%
    r = pg.evaluate("""()=>{const T=MSTEST;if(!T.btwVast)return null;const S=T.state,id1=T.newId('k'),id2=T.newId('k'),id3=T.newId('k');
      S.klanten.push({id:id1,naam:'Part',soort:'particulier'},{id:id2,naam:'VvE',soort:'vve'},{id:id3,naam:'Zak',soort:'zakelijk'});
      const f=(kid,oms,st)=>T.btwVast({soort:'factuur',klantId:kid,status:st||'concept',btw:21,incl:true,regels:oms.map(o=>({omschrijving:o,aantal:1,prijs:100}))},!st);
      const p=f(id1,['Glasbewassing buiten','Glasbewassing binnen']),v=f(id2,['Trappenhuis schoonmaak','Glasbewassing','Glasbewassing van de gevel','Ramen in het trappenhuis']),z=f(id3,['Glasbewassing binnen']);
      const oud=f(id1,['Glasbewassing binnen'],'open'),tp=T.totals(p),verl=T.totals({...p,btw:0});
      S.klanten.splice(-3,3);
      return {p:p.regels.map(r=>r.btw??null),v:v.regels.map(r=>r.btw??null),z:z.regels.map(r=>r.btw??null),oud:oud.regels.map(r=>r.btw??null),
        inc:tp.inc,ex:tp.ex,n:tp.tarieven.length,b9:(tp.tarieven.find(x=>x.pct===9)||{}).btw,verl:verl.btw}}""")
    if r is not None:
        G2 = "Facturen"
        check(G2, "Btw: glasbewassing binnen particulier 9%, buiten 21%", r["p"] == [None, 9], r)
        check(G2, "Btw: VvE trappenhuis 9%, glas/gevel 21%", r["v"] == [9, None, None, 9], r)
        check(G2, "Btw: zakelijk binnen blijft 21%", r["z"] == [None], r)
        check(G2, "Btw: verstuurde factuur wordt niet aangepast", r["oud"] == [None], r)
        check(G2, "Btw: totaal per tarief klopt (incl. prijzen)", r["inc"] == 200 and r["n"] == 2 and abs(r["ex"] - round(100/1.21 + 100/1.09, 2)) < 0.011 and abs(r["b9"] - round(100 - 100/1.09, 2)) < 0.011, r)
        check(G2, "Btw verlegd: alles 0%", r["verl"] == 0, r)
    # Control Center: cijfers gelijk aan de rest van het CRM, signalen alleen uit echte gegevens
    r = pg.evaluate("""()=>{const T=MSTEST;if(!T.ccKpis)return null;const K=T.ccKpis(),S=T.ccSignalen();
      const open=T.state.facturen.filter(f=>f.soort!=='offerte'&&!['concept','betaald','oninbaar'].includes(f.status));
      const som=Math.round(open.reduce((a,f)=>a+Math.max(0,T.totals(f).inc-(Number(f.deelBetaald)||0)),0)*100)/100;
      const ach=open.filter(f=>T.fStatus(f)[1]==='Achterstallig').length,sig=S.find(s=>/vervallen/.test(s.t));
      T.state.klanten.push({id:'cczoek1',naam:'Zoektest, Anna',adres:'Kerkstraat 1',postcode:'9801 AB',plaats:'Zuidhorn'});const z=T.ccZoek('zoektest').concat(T.ccZoek('9801ab'));T.state.klanten.pop();
      return {kOpen:K.open,som,kAch:K.nAch,ach,sigOk:ach?!!sig&&sig.p==='kritiek':!sig,zoek:z.length,allesGeldig:S.every(s=>s.t&&s.u&&s.go&&s.knop)}}""")
    if r is not None:
        G3 = "Control Center"
        check(G3, "Openstaand bedrag gelijk aan Facturen", abs(r["kOpen"] - r["som"]) < 0.01, r)
        check(G3, "Aantal vervallen facturen klopt", r["kAch"] == r["ach"], r)
        check(G3, "Signaal vervallen facturen alleen als ze er zijn (kritiek)", r["sigOk"], r)
        check(G3, "Elke melding heeft uitleg en een knop", r["allesGeldig"], r)
        check(G3, "Zoeken vindt klanten (naam en postcode)", r["zoek"] >= 2, r)
    r = pg.evaluate("""()=>{const T=MSTEST;if(!T.ccAlle)return null;const S=T.state,id='cctl1',kid='cck1';const oud=S.ccStatus;
      S.klanten.push({id:kid,naam:'Wachtrij, Test'});S.facturen.push({id,soort:'factuur',nummer:'T-9',klantId:kid,klantNaam:'Wachtrij, Test',status:'open',datum:'2026-01-01',verval:'2026-01-15',regels:[{omschrijving:'x',aantal:1,prijs:10}],btw:21,incl:true});
      const key='fv:'+id,in0=T.ccSignalen().some(m=>m.key===key);
      S.ccStatus={later:{[key]:new Date(Date.now()+3600e3).toISOString()}};const inLater=T.ccSignalen().some(m=>m.key===key);
      S.ccStatus={afgehandeld:{[key]:new Date().toISOString()}};const inKlaar=T.ccSignalen().some(m=>m.key===key);
      S.ccStatus={afgehandeld:{[key]:new Date(Date.now()-8*864e5).toISOString()}};const terug=T.ccSignalen().some(m=>m.key===key);
      S.ccStatus=oud;S.facturen.pop();S.klanten.pop();return {in0,inLater,inKlaar,terug}}""")
    if r is not None:
        check(G3, "Wachtrij: vervallen factuur staat erin", r["in0"], r)
        check(G3, "Wachtrij: 'later' haalt hem tijdelijk weg", not r["inLater"], r)
        check(G3, "Wachtrij: afgehandeld haalt hem weg", not r["inKlaar"], r)
        check(G3, "Wachtrij: na 7 dagen komt een nog vervallen factuur terug", r["terug"], r)

    r = pg.evaluate("""()=>{const T=MSTEST;if(!T.volgendeNa)return null;const d=n=>T.iso(T.addDays(T.today(),n));
      const k={id:'vp1',naam:'Verplaats, Test',gepland:d(3),tijd:'09:00',frequentie:4,autoplan:true,reeks:[{d:d(31),t:'09:00'},{d:d(59),t:'09:00'}]};
      const alle=T.verplaatsAllePatch(k,d(5),'11:00');
      const k2={id:'vp2',naam:'Ritme, Test',gepland:d(0),tijd:'08:00',frequentie:4,autoplan:true,eenmalig:{van:d(2),tijd:'10:00'}};
      const na=T.volgendeNa(k2);
      const k3={id:'vp3',naam:'Vast, Test',gepland:d(1),tijd:'08:00',weekdagen:[T.addDays(T.today(),1).getDay()]};
      const al3=T.verplaatsAllePatch(k3,d(2),'08:00');
      const k4={id:'vp4',naam:'Los, Test',gepland:d(1),tijd:'08:00',frequentie:998};const k5={id:'vp5',naam:'Ritme, Zonder',gepland:d(0),tijd:'08:00',frequentie:4,eenmalig:{van:d(2),tijd:'08:30'}};const na5=T.volgendeNa(k5);
      return {r0:alle.reeks[0].d===d(33)&&alle.reeks[0].t==='11:00',r1:alle.reeks[1].d===d(61),tijd:alle.tijd==='11:00'&&alle.gepland===d(5)&&alle.eenmalig==='',
        naTijd:na.tijd,naOk:na.gepland>T.iso(T.today()),naEm:na.eenmalig==='',wd:(al3.weekdagen||[])[0]===T.addDays(T.today(),2).getDay(),v1:T.heeftVervolg(k),v4:T.heeftVervolg(k4),ab5:na5.aanbodVanaf===T.iso(T.addDays(T.today(),30))||na5.aanbodVanaf>T.iso(T.today()),g5:na5.gepland,t5:na5.tijd}}""")
    if r is not None:
        G4 = "Afspraak verplaatsen"
        check(G4, "Alle afspraken: reeks schuift even ver mee met de nieuwe tijd", r["r0"] and r["r1"] and r["tijd"], r)
        check(G4, "Alleen deze: daarna weer de vaste tijd en het oude ritme", r["naTijd"] == "10:00" and r["naOk"] and r["naEm"], r)
        check(G4, "Alle afspraken: vaste weekdag schuift mee", r["wd"], r)
        check(G4, "Vraag alleen bij opdrachten met vervolgafspraken", r["v1"] and not r["v4"], r)
        check(G4, "Alleen deze, zonder doorplannen: weer aan de beurt volgens het oude ritme", r["ab5"] and r["g5"] == "" and r["t5"] == "08:30", r)
    r = pg.evaluate("""()=>{const T=MSTEST;if(!T.ccAlle)return null;const id='ogtest1';T.state.facturen.push({id,soort:'offerte',nummer:'OFF-T-1',klantNaam:'Test, Getekend',status:'geaccepteerd',akkoordOp:T.iso(T.today()),getekend:{naam:'Test',op:new Date().toISOString()},getekendNieuw:true,regels:[{omschrijving:'Glas',aantal:1,prijs:50}],btw:21,incl:true});
      const m=T.ccAlle().find(x=>x.key==='og:'+id);T.state.facturen.pop();return {er:!!m,nieuw:!!(m&&m.nieuw),knop:m&&m.go}}""")
    if r is not None:
        check("Control Center", "Ondertekende offerte geeft een melding", r["er"] and r["nieuw"] and r["knop"] == "f:ogtest1", r)


def nieuweOpdracht(pg):
    G = "Opdrachten"
    r = pg.evaluate("""async()=>{const T=MSTEST;if(!T.openOpdrachtWerk)return null;const id=T.newId('ko');
      await T.save('klanten',id,{naam:'Opdracht, Test',klantnr:'1099',prijs:40,frequentie:8,actief:true,dienst:'Glasbewassing',log:[],objecten:[]});
      T.openOpdrachtWerk(id,'new');await new Promise(r=>setTimeout(r,300));const kop=(document.querySelector('.jp-k1 b')||{}).textContent||'',lijnen=document.querySelectorAll('#owLines .ow-line').length;
      document.querySelectorAll('dialog[open]').forEach(d=>d.close());T.openOpdrachtWerk(id,'main');await new Promise(r=>setTimeout(r,300));const kop2=(document.querySelector('.jp-k1 b')||{}).textContent||'';
      document.querySelectorAll('dialog[open]').forEach(d=>d.close());await T.del('klanten',id);return {kop,lijnen,kop2}}""")
    if r is None:
        return check(G, "Nieuwe opdracht", False, "openOpdrachtWerk niet gevonden")
    check(G, "Nieuwe opdracht krijgt een eigen nummer (…-2)", r["kop"].endswith("-2"), r)
    check(G, "Nieuwe opdracht toont alleen zijn eigen regel", r["lijnen"] == 1, r)
    check(G, "Hoofdopdracht blijft …-1", r["kop2"].endswith("-1"), r)
    # VvE: per taak een frequentie; bij het afmelden alleen wat aan de beurt is
    r = pg.evaluate("""async()=>{const T=MSTEST;if(!T.vveAanDeBeurt)return null;const id=T.newId('kv'),d=n=>T.iso(T.addDays(T.today(),n));
      await T.save('klanten',id,{naam:'VvE Freq',soort:'vve',klantnr:'1098',prijs:60,frequentie:1,actief:true,dienst:'Trappenhuis schoonmaak',log:[],objecten:[],vveTaken:['Trappenhuis','Hekwerk'],vveFreq:{Hekwerk:'kwartaal'}});
      const k=T.state.klanten.find(x=>x.id===id),bid=T.newId('b');
      const eerst={trap:T.vveAanDeBeurt(k,'Trappenhuis',d(0)),hek:T.vveAanDeBeurt(k,'Hekwerk',d(0))};
      await T.save('beurten',bid,{klantId:id,datum:d(-20),taken:[{naam:'Hekwerk',ok:true},{naam:'Trappenhuis',ok:true}]});
      const na={hek:T.vveAanDeBeurt(k,'Hekwerk',d(0)),hekLater:T.vveAanDeBeurt(k,'Hekwerk',d(75))};
      T.openOpdrachtWerk(id,'main');await new Promise(r=>setTimeout(r,300));
      const rijen=[...document.querySelectorAll('#ow-vvetaken .vve-er')].map(r=>r.querySelector('[data-vtn]').value+'='+r.querySelector('[data-vtf]').value);
      document.getElementById('owVveTk').click();const nr=document.querySelector('#ow-vvetaken .vve-er:last-child');nr.querySelector('[data-vtn]').value='Ramen';nr.querySelector('[data-vtf]').value='jaar';
      document.getElementById('owSave').click();await new Promise(r=>setTimeout(r,500));const k2=T.state.klanten.find(x=>x.id===id)||{};
      document.querySelectorAll('dialog[open]').forEach(x=>x.close());await T.del('beurten',bid);await T.del('klanten',id);
      return {eerst,na,rijen,taken:k2.vveTaken,freq:k2.vveFreq}}""")
    if r is not None:
        check(G, "VvE: nieuwe periodieke taak is meteen aan de beurt", r["eerst"]["hek"] is True and r["eerst"]["trap"] is True, r)
        check(G, "VvE: kwartaaltaak niet opnieuw na 20 dagen, wel na 95", r["na"]["hek"] is False and r["na"]["hekLater"] is True, r)
        check(G, "VvE: frequentie per taak in de opdracht", r["rijen"] == ["Trappenhuis=beurt", "Hekwerk=kwartaal"], r)
        check(G, "VvE: taak met frequentie opslaan", r["taken"] == ["Trappenhuis", "Hekwerk", "Ramen"] and r["freq"] == {"Hekwerk": "kwartaal", "Ramen": "jaar"}, r)


def opdrachtNummers(pg):
    G = "Opdrachten"
    r = pg.evaluate("""async()=>{const T=MSTEST,id=T.newId('kn'),w=()=>new Promise(r=>setTimeout(r,250)),K=()=>T.state.klanten.find(x=>x.id===id);
      await T.save('klanten',id,{naam:'Nummer, Test',klantnr:'1098',prijs:40,frequentie:8,actief:true,dienst:'Glasbewassing',log:[],objecten:[],opdrachten:[{id:'oa',dienst:'Goten',prijs:30,frequentie:52},{id:'ob',dienst:'Dakkapel',prijs:50,frequentie:52}]});await w();
      const n1=K().opdrachten.map(o=>o.nr);
      await T.save('klanten',id,{...T.strip(K()),opdrachten:K().opdrachten.filter(o=>o.id!=='oa')});await w();const n2=K().opdrachten.map(o=>o.nr);
      await T.save('klanten',id,{...T.strip(K()),opdrachten:[...K().opdrachten,{id:'oc',dienst:'Zonnepanelen',prijs:20,frequentie:52}]});await w();const n3=K().opdrachten.map(o=>o.nr);
      /* apart inplannen */
      await T.save('klanten',id,{...T.strip(K()),opdrachten:K().opdrachten.map(o=>o.id==='ob'?{...o,apart:true,duur:240}:o)});await w();await w();
      const job=T.state.klanten.find(x=>x.hoofdKlantId===id&&x.opdrachtId==='ob');
      const inPlan=!!job&&T.teplannen(T.addDays(T.today(),7)).some(k=>k.id===job.id),inLijst=!!job&&T.klantFilter().some(k=>k.id===job.id),meelift=T.extraOpdr(K()).some(o=>o.id==='ob');
      await T.save('klanten',id,{...T.strip(K()),opdrachten:K().opdrachten.map(o=>o.id==='ob'?{...o,apart:false}:o)});await w();await w();
      const job2=job&&T.state.klanten.find(x=>x.id===job.id);
      for(const x of T.state.klanten.filter(x=>x.hoofdKlantId===id))await T.del('klanten',x.id);await T.del('klanten',id);
      return {n1,n2,n3,job:!!job,duur:job&&job.duur,inPlan,inLijst,meelift,uit:job2?job2.actief===false:null}}""")
    check(G, "Extra opdrachten krijgen vaste nummers (2 en 3)", r["n1"] == [2, 3], r)
    check(G, "Na verwijderen houdt de andere opdracht zijn nummer", r["n2"] == [3], r)
    check(G, "Een nummer wordt niet opnieuw gebruikt", r["n3"] == [3, 4], r)
    check(G, "Apart inplannen maakt een eigen afspraak (job)", r["job"] and r["duur"] == 240, r)
    check(G, "Losse opdracht staat in Te plannen", r["inPlan"] is True, r)
    check(G, "Losse opdracht telt niet als extra klant", r["inLijst"] is False, r)
    check(G, "Losse opdracht gaat niet mee met de glasbewassing", r["meelift"] is False, r)
    check(G, "Vinkje uit: losse afspraak stopt", r["uit"] is True, r)


def werkdagTijd(pg):
    G = "Werkdag"
    r = pg.evaluate("""async()=>{const T=MSTEST;if(!T.wdCijfers)return null;const id=T.newId('kw'),d=T.iso(T.addDays(T.today(),-400)),bid=T.newId('b'),b2=T.newId('b');
      await T.save('klanten',id,{naam:'Werk, Test',prijs:56.2,frequentie:8,duur:30,actief:true,log:[],objecten:[]});
      await T.save('routes',d,{werk:{start:d+'T09:00:00.000Z',stop:d+'T11:00:00.000Z',pauzes:[]}});
      await T.save('beurten',bid,{klantId:id,datum:d,bedrag:56.2,duur:3,gemeten:true,gefactureerd:'',op:d+'T10:00:00.000Z'});
      const c=T.wdCijfers(d),kort=T.beurtMin(T.state.beurten.find(x=>x.id===bid));
      await T.save('beurten',b2,{klantId:id,datum:'1999-01-01',bedrag:1,duur:25,gemeten:true});const echt=T.beurtMin(T.state.beurten.find(x=>x.id===b2));
      await T.del('beurten',bid);await T.del('beurten',b2);await T.del('routes',d);await T.del('klanten',id);
      return {fact:c.fact,omzet:c.omzet,perFact:Math.round(c.perFact*100)/100,geschat:c.geschat,kort,echt}}""")
    if r is None:
        return check(G, "Facturabele tijd", False, "wdCijfers niet gevonden")
    check(G, "Te korte meting telt als geplande duur", r["kort"] == 30 and r["fact"] == 30, r)
    check(G, "Per facturabel uur blijft realistisch", r["omzet"] > 0 and abs(r["perFact"] - r["omzet"] * 2) < 0.02 and r["geschat"] == 1, r)
    check(G, "Echte meting blijft staan", r["echt"] == 25, r)


def relatiecodes(pg):
    G = "SnelStart"
    r = pg.evaluate("""async()=>{const T=MSTEST;if(!T.relVolgende)return null;const ids=[T.newId('kr'),T.newId('kr'),T.newId('kr')],oud=T.S().bhKlantStart;
      await T.saveSettings({bhKlantStart:'9000'});
      for(const id of ids)await T.save('klanten',id,{naam:'Rel, '+id,prijs:10,frequentie:8,actief:true,log:[],objecten:[]});
      const nrs=ids.map(id=>T.state.klanten.find(k=>k.id===id).klantnr);
      const ids2=[T.newId('kr'),T.newId('kr')];await Promise.all(ids2.map(id=>T.save('klanten',id,{naam:'Rel, '+id,prijs:10,frequentie:8,actief:true,log:[],objecten:[]})));
      const nrs2=ids2.map(id=>T.state.klanten.find(k=>k.id===id).klantnr);
      const eigen=T.newId('kr');await T.save('klanten',eigen,{naam:'Rel, eigen',klantnr:'8237',prijs:10,frequentie:8,actief:true,log:[],objecten:[]});const e=T.state.klanten.find(k=>k.id===eigen).klantnr;
      /* customers_active uit SnelStart/DienstenCRM importeren: bestaande klant wordt aangevuld, niet dubbel */
      const best=T.newId('kr');await T.save('klanten',best,{naam:'Import, Bestaand',adres:'Kerkstraat 12',postcode:'9861 AB',plaats:'Grootegast',prijs:40,frequentie:8,actief:true,log:[],objecten:[]});
      document.querySelectorAll('dialog[open]').forEach(d=>d.close());await new Promise(r=>setTimeout(r,100));const voor=T.state.klanten.length;T.openImport();await new Promise(r=>setTimeout(r,200));const ta=document.getElementById('impText');
      ta.value='Relatiecode;Naam;Contactpersoon;Adres;Postcode;Plaats;Telefoon;Fax;Email\\n7311;Import, Bestaand;;Kerkstraat 12;9861AB;Grootegast;;;\\n7312;Import, Nieuw;;Dorpsweg 3;9861 CD;Grootegast;;;';
      ta.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,200));document.getElementById('impGo').click();await new Promise(r=>setTimeout(r,800));
      const kb=T.state.klanten.find(k=>k.id===best),nw=T.state.klanten.filter(k=>k.naam==='Import, Nieuw');
      const imp={erbij:T.state.klanten.length-voor,code:kb&&kb.klantnr,prijs:kb&&kb.prijs,nieuw:nw.map(k=>k.klantnr)};
      for(const k of nw)await T.del('klanten',k.id);await T.del('klanten',best);
      for(const id of [...ids,...ids2,eigen])await T.del('klanten',id);await T.saveSettings({bhKlantStart:oud||''});
      return {nrs,nrs2,e,imp}}""")
    if r is None:
        return check(G, "Relatiecodes", False, "relVolgende niet gevonden")
    check(G, "Nieuwe klanten krijgen een vast nummer vanaf het ingestelde begin", r["nrs"][0] >= "9000" and len(set(r["nrs"])) == 3, r)
    check(G, "Tegelijk opslaan geeft geen dubbele relatiecodes", len(set(r["nrs2"] + r["nrs"])) == 5, r)
    check(G, "Oud klantnummer (uit DienstenCRM) blijft staan", r["e"] == "8237", r)
    check(G, "Import van customers_active vult bestaande klant aan met relatiecode", r["imp"]["code"] == "7311" and r["imp"]["prijs"] == 40, r["imp"])
    check(G, "Import maakt geen dubbele klant aan", r["imp"]["erbij"] == 1 and r["imp"]["nieuw"] == ["7312"], r["imp"])


def portaal(b, base):
    G = "Klantportaal"
    for w, h, naam in [(1300, 900, "computer"), (390, 844, "telefoon")]:
        pg = nieuwe_pagina(b, w, h)
        pg.goto(base + "/public/portaal.html?demo")
        pg.wait_for_timeout(2500)
        tabs = pg.evaluate("[...new Set([...document.querySelectorAll('[data-tab]')].map(e=>e.dataset.tab))]")
        check(G, f"Portaal opent ({naam})", not pg.fouten and len(tabs) >= 3, "; ".join(pg.fouten) or tabs)
        for t in tabs:
            voor = len(pg.fouten)
            pg.evaluate("t=>{const e=[...document.querySelectorAll('[data-tab]')].find(x=>x.dataset.tab===t&&x.offsetParent);if(e)e.click()}", t)
            pg.wait_for_timeout(500)
            n = pg.evaluate("document.body.innerText.trim().length")
            check(G, f"Tab '{t}' ({naam})", not pg.fouten[voor:] and n > 50, "; ".join(pg.fouten[voor:]))
        pg.close()


def main():
    s, port = server()
    base = f"http://127.0.0.1:{port}"
    with sync_playwright() as p:
        b = p.chromium.launch()
        try:
            pg = crm(b, base)
            check("Laden", "CRM laadt zonder fouten", not pg.fouten, "; ".join(pg.fouten))
            pagina_s(pg, "Pagina's (computer)")
            instellingen(pg)
            rekenregels(pg)
            nummering(pg)
            abonnement(pg)
            afmelden(pg)
            statistieken(pg)
            frequentie(pg)
            herinneringen(pg)
            teplannen(pg)
            nieuweOpdracht(pg)
            opdrachtNummers(pg)
            werkdagTijd(pg)
            relatiecodes(pg)
            check("Laden", "Geen fouten tijdens de flows", not pg.fouten, "; ".join(pg.fouten))
            pg.close()
            pm = crm(b, base, 390, 844)
            pagina_s(pm, "Pagina's (telefoon)")
            pm.close()
        except Exception as e:
            check("Zelftest", "Zelftest kon niet afmaken", False, e)
        try:
            portaal(b, base)
        except Exception as e:
            check("Klantportaal", "Portaaltest kon niet afmaken", False, e)
        b.close()
    s.shutdown()

    fout = [r for r in RES if not r[2]]
    regels = [f"## Zelftest: {len(RES) - len(fout)} van {len(RES)} goed", ""]
    if fout:
        regels += ["### Niet goed", "", "| Onderdeel | Controle | Wat er mis is |", "|---|---|---|"]
        regels += [f"| {g} | {n} | {d.replace('|', '/')} |" for g, n, _, d in fout]
        regels.append("")
    regels += ["<details><summary>Alle controles</summary>", "", "| | Onderdeel | Controle |", "|---|---|---|"]
    regels += [f"| {'✅' if ok else '❌'} | {g} | {n} |" for g, n, ok, _ in RES]
    regels += ["", "</details>"]
    tekst = "\n".join(regels)
    print(tekst)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as f:
            f.write(tekst + "\n")
    with open(os.path.join(ROOT, "tests", "uitslag.json"), "w") as f:
        json.dump([{"groep": g, "naam": n, "ok": ok, "detail": d} for g, n, ok, d in RES], f, ensure_ascii=False, indent=1)
    sys.exit(1 if fout else 0)


if __name__ == "__main__":
    main()
