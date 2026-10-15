/* ---------- Foto bekijken: tik op een bijzonderheid → groot beeld, tekst aanpassen, erop tekenen of verwijderen ---------- */
function fotoBekijk(bron,i){
  const lees=()=>{if(bron.soort==="factuur"){const f=state.facturen.find(x=>x.id===bron.id);return f?{doc:f,lijst:f.bijlagen||[],veld:"bijlagen",col:"facturen"}:null}
    const k=state.klanten.find(x=>x.id===bron.id);return k?{doc:k,lijst:k.bevindingen||[],veld:"bevindingen",col:"klanten"}:null};
  const b0=lees();if(!b0||!b0.lijst[i])return;
  const back=dlg.open&&$("#jobPanel")?{job:$("#jobPanel").dataset.k,d:$("#jobPanel").dataset.d}:dlg.open&&bron.soort==="factuur"?{f:bron.id}:null;
  const ov=document.createElement("div");ov.className="an fk";document.body.appendChild(ov);document.body.classList.add("an-open");
  let bewerk=false;
  const sluit=()=>{ov.remove();document.body.classList.remove("an-open")};
  const herlaad=()=>{if(back&&back.job)setTimeout(()=>openJob(back.job,back.d),50);else if(back&&back.f)setTimeout(()=>openFactuurWerk(back.f),50);else render()};
  const zet=async patch=>{const b=lees();if(!b)return;const l=[...b.lijst];l[i]={...l[i],...patch};await save(b.col,b.doc.id,{...strip(b.doc),[b.veld]:l})};
  const teken=()=>{const b=lees();if(!b||!b.lijst[i]){sluit();return}const it=b.lijst[i];
    ov.innerHTML=`<div class="an-top"><button type="button" class="an-tb" data-fk="x">Sluiten</button><b>${esc(it.zijde||"Opgemerkt")}${it.datum?` · ${esc(fmtD(it.datum))}`:""}</b><span class="an-tb" style="visibility:hidden">Sluiten</span></div>
      <div class="fk-st"><img src="${BLOB}${esc(it.id)}" alt=""></div>
      <div class="fk-bar">${bewerk?`<label class="fk-l">Toelichting voor de klant<textarea id="fkN" rows="2">${esc(it.notitie||"")}</textarea></label>
        <div class="fk-zs">${BV_ZIJDE.map(z=>`<button type="button" data-fkz="${z}" aria-pressed="${it.zijde===z}">${z}</button>`).join("")}</div>
        <div class="fk-acts"><button type="button" data-fk="annuleer">Annuleren</button><button type="button" class="fk-ok" data-fk="opslaan">${I.check}Opslaan</button></div>`
      :`<p class="fk-n">${esc(it.notitie||"Geen toelichting")}</p>
        <div class="fk-acts"><button type="button" data-fk="tekst">${I.edit||I.note||"✎"}Tekst</button><button type="button" data-fk="pen">${I.camera}Tekenen</button><button type="button" class="fk-del" data-fk="del">${I.trash||I.x}Verwijderen</button></div>`}</div>`;
    ov.querySelectorAll("[data-fkz]").forEach(z=>z.onclick=()=>{const on=z.getAttribute("aria-pressed")!=="true";ov.querySelectorAll("[data-fkz]").forEach(x=>x.setAttribute("aria-pressed","false"));z.setAttribute("aria-pressed",String(on))});
    ov.querySelectorAll("[data-fk]").forEach(btn=>btn.onclick=async()=>{const a=btn.dataset.fk;
      if(a==="x")sluit();
      else if(a==="tekst"){bewerk=true;teken()}
      else if(a==="annuleer"){bewerk=false;teken()}
      else if(a==="opslaan"){const z=ov.querySelector('[data-fkz][aria-pressed="true"]');try{await zet({notitie:$("#fkN").value.trim(),zijde:z?z.dataset.fkz:""});bewerk=false;toast("Opgeslagen");teken();herlaad()}catch(e){err(e)}}
      else if(a==="del"){if(!(await vraag("Foto verwijderen",`Deze foto verdwijnt ook ${bron.soort==="factuur"?"van de factuur":"van de volgende factuur"}.`,"Verwijderen")))return;
        try{const b=lees();const l=[...b.lijst];l.splice(i,1);await save(b.col,b.doc.id,{...strip(b.doc),[b.veld]:l});toast("Foto verwijderd");sluit();herlaad()}catch(e){err(e)}}
      else if(a==="pen"){/* bestaande foto ophalen, erop tekenen en als nieuwe foto bewaren */
        let file=null;try{const r=await fetch(BLOB+it.id);const bl=await r.blob();file=new File([bl],it.naam||"foto.jpg",{type:bl.type||"image/jpeg"})}catch(e){}
        if(!file)return toast("De foto kon niet worden geladen");
        ov.style.display="none";const nf=await fotoAnnoteren(file);ov.style.display="";if(!nf||nf===file){return}
        try{toast("Foto uploaden…");const r=await state.assets.upload(nf);await zet({id:r.id,naam:nf.name||it.naam||"foto.jpg"});toast("Tekening bewaard");teken();herlaad()}catch(e){toast("De foto kon niet worden geüpload")}}
    });
  };
  teken();
}
