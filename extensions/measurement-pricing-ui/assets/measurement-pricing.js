(function(){
  function matchTier(pricing, w, h){
    if(!pricing || !Array.isArray(pricing.tiers)) return null;
    return pricing.tiers.find(t=>{
      const rw = t.rules?.width || {}, rh = t.rules?.height || {};
      const okW = (rw.min==null || w>=rw.min) && (rw.max==null || w<=rw.max);
      const okH = (rh.min==null || h>=rh.min) && (rh.max==null || h<=rh.max);
      return okW && okH;
    }) || null;
  }

  function ensurePropertyInput(form, name, value){
    let i = form.querySelector(`input[name="${CSS.escape(name)}"]`);
    if(!i){
      i = document.createElement('input');
      i.type = 'hidden';
      i.name = name;
      form.appendChild(i);
    }
    i.value = value;
  }

  function switchVariant(variantGid){
    const form = document.querySelector('form[action*="/cart/add"]');
    if(!form) return;
    // id Hidden auf die passende Variant-ID (numerisch) setzen:
    const varId = variantGid.split('/').pop();
    const inputId = form.querySelector('input[name="id"]');
    if(inputId){ inputId.value = varId; }

    // Properties anhängen -> später im Warenkorb sichtbar
    const w = document.getElementById('mp-width')?.value;
    const h = document.getElementById('mp-height')?.value;
    ensurePropertyInput(form, 'properties[Width(cm)]', w || '');
    ensurePropertyInput(form, 'properties[Height(cm)]', h || '');
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const root = document.getElementById('mp-root');
    if(!root) return;

    let pricing = null;
    try {
      const json = root.dataset.pricingJson;
      pricing = json ? JSON.parse(json) : null;
    } catch(e){ pricing = null; }

    const width = document.getElementById('mp-width');
    const height = document.getElementById('mp-height');
    const hint = document.getElementById('mp-hint');

    function recalc(){
      const w = parseFloat(width.value);
      const h = parseFloat(height.value);
      if(!w || !h){ hint.textContent=''; return; }

      const tier = matchTier(pricing, w, h);
      if(!tier){
        hint.textContent = 'Keine passende Größe – bitte Werte anpassen.';
        return;
      }
      hint.textContent = `Stufe: ${tier.label}`;
      if(tier.variantId) switchVariant(tier.variantId);
    }

    width?.addEventListener('input', recalc);
    height?.addEventListener('input', recalc);
  });
})();
