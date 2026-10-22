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
    pg.on("pageerror", lambda e: pg.fouten.append(str(e)))
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
    t = lambda f: pg.evaluate("f=>MSTEST.totals(f)", f)
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
            afmelden(pg)
            statistieken(pg)
            frequentie(pg)
            herinneringen(pg)
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
