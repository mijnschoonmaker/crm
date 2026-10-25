/* ---------- zelftest-haakje ----------
   Alleen in de testversie (glazenwasser-crm.html?selftest, nooit in de live versie): geeft de automatische
   zelftest (tests/selftest.mjs) toegang tot de rekenregels en acties, zodat bij elke update wordt gecontroleerd
   of bedragen, btw, factuurnummers en het afmelden nog kloppen. */
if(!LIVE&&typeof location!=="undefined"&&/[?&]selftest\b/.test(location.search)){
  window.MSTEST={state,S,save,del,totals,nextNr,nrDelen,wikKosten,fStatus,afronden,gewassen,billAll,setFStatus,iso,today,addDays,newId,strip,render,
    fin,beurtOmzet,klantFilter,extraOpdr,opdrNr:typeof opdrNr==="function"?opdrNr:null,openOpdrachtWerk:typeof openOpdrachtWerk==="function"?openOpdrachtWerk:null,teplannen,fhVolgende:typeof fhVolgende==="function"?fhVolgende:null,fhPoort:typeof fhPoort==="function"?fhPoort:null,groepEditor:typeof groepEditor==="function"?groepEditor:null,melding,stDienstSplit,klantActiefIn,openImport,relVolgende:typeof relVolgende==="function"?relVolgende:null,beurtMin,meetTeKort,wdCijfers:typeof wdCijfers==="function"?wdCijfers:null,kmFmt:typeof kmFmt==="function"?kmFmt:null,kmAfst:typeof kmAfst==="function"?kmAfst:null,saveSettings,
    teVroeg:typeof teVroeg==="function"?teVroeg:null,invData:typeof invData==="function"?invData:null,bcVast,ccKpis:typeof ccKpis==="function"?ccKpis:null,ccSignalen:typeof ccSignalen==="function"?ccSignalen:null,ccZoek:typeof ccZoek==="function"?ccZoek:null,openFactuurWerk:typeof openFactuurWerk==="function"?openFactuurWerk:null,paperHtml:typeof paperHtml==="function"?paperHtml:null,btwRegel:typeof btwRegel==="function"?btwRegel:null,btwVast:typeof btwVast==="function"?btwVast:null,vveAanDeBeurt:typeof vveAanDeBeurt==="function"?vveAanDeBeurt:null,nrBewaker,msStatus:typeof msStatus==="function"?msStatus:null,MS:typeof MS!=="undefined"?MS:null,
    views:()=>PAGES.map(p=>p[0]),ga:t=>{state.tab=t;render()}};
}
