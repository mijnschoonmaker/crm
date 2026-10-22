/* ---------- zelftest-haakje ----------
   Alleen in de testversie (glazenwasser-crm.html?selftest, nooit in de live versie): geeft de automatische
   zelftest (tests/selftest.mjs) toegang tot de rekenregels en acties, zodat bij elke update wordt gecontroleerd
   of bedragen, btw, factuurnummers en het afmelden nog kloppen. */
if(!LIVE&&typeof location!=="undefined"&&/[?&]selftest\b/.test(location.search)){
  window.MSTEST={state,S,save,del,totals,nextNr,nrDelen,wikKosten,fStatus,afronden,gewassen,billAll,setFStatus,iso,today,addDays,newId,strip,render,
    fin,beurtOmzet,groepEditor:typeof groepEditor==="function"?groepEditor:null,melding,stDienstSplit,klantActiefIn,kmFmt:typeof kmFmt==="function"?kmFmt:null,kmAfst:typeof kmAfst==="function"?kmAfst:null,saveSettings,
    views:()=>PAGES.map(p=>p[0]),ga:t=>{state.tab=t;render()}};
}
