(function(){
  var root = document.getElementById('mp-root');
  if(!root) return;

  // Daten aus dem DOM
  var data = {};
  try { data = JSON.parse(root.dataset.metafield || '{}'); } catch(e){ data = {}; }
  var widthEl = document.getElementById('mp-width');
  var heightEl = document.getElementById('mp-height');
  var priceEl = document.getElementById('mp-price');
  var addBtn = document.getElementById('mp-add');
  var errEl = document.getElementById('mp-error');

  function pickTier(w, h){
    var tiers = (data && data.tiers) || [];
    var area = w * h;
    for(var i=0;i<tiers.length;i++){
      var t = tiers[i];
      var W = (t.rules && t.rules.width)  || {};
      var H = (t.rules && t.rules.height) || {};
      var A = (t.rules && t.rules.area)   || {};
      var wOk = (W.min==null||w>=W.min) && (W.max==null||w<=W.max);
      var hOk = (H.min==null||h>=H.min) && (H.max==null||h<=H.max);
      var aOk = (A.min==null||area>=A.min) && (A.max==null||area<=A.max);
      if(wOk && hOk && aOk) return t;
    }
    return null;
  }

  // Optional vereinfachte Preis-Anzeige (nutzt Variant-Preis, falls im DOM auffindbar)
  function updatePriceDisplay(tier){
    if(!tier){ priceEl.textContent = '–'; return; }
    // Wenn dein Theme irgendwo Daten-Attribute mit Variantenpreisen hat, kannst du die hier lesen.
    // Fallback: nur Platzhalter anzeigen, Preis ist im Checkout/Cart in jedem Fall korrekt (Variantenpreis).
    priceEl.textContent = 'Preis gemäß Staffel';
  }

  function recompute(){
    var w = parseInt(widthEl.value, 10);
    var h = parseInt(heightEl.value, 10);
    if(!w || !h){ updatePriceDisplay(null); return; }
    var tier = pickTier(w, h);
    updatePriceDisplay(tier);
  }

  widthEl.addEventListener('input', recompute);
  heightEl.addEventListener('input', recompute);

  addBtn.addEventListener('click', function(){
    errEl.style.display='none';
    var w = parseInt(widthEl.value, 10);
    var h = parseInt(heightEl.value, 10);
    if(!w || !h){
      errEl.textContent='Bitte Höhe und Breite eingeben.';
      errEl.style.display='block';
      return;
    }
    var tier = pickTier(w, h) || { variantId: (data && data.fallbackVariantId) };
    if(!tier || !tier.variantId){
      errEl.textContent='Keine passende Preisstaffel gefunden.';
      errEl.style.display='block';
      return;
    }

    var formData = new FormData();
    formData.append('items[0][id]', tier.variantId);
    formData.append('items[0][quantity]', '1');
    formData.append('items[0][properties][Breite (cm)]', String(w));
    formData.append('items[0][properties][Höhe (cm)]', String(h));

    fetch('/cart/add.js', { method:'POST', body: formData })
      .then(function(res){
        if(!res.ok) throw new Error('Add to cart failed');
        // Optional: Mini-Cart öffnen oder Seite neu laden
        window.location.href = '/cart';
      })
      .catch(function(){
        errEl.textContent='Konnte nicht in den Warenkorb legen.';
        errEl.style.display='block';
      });
  });
})();
