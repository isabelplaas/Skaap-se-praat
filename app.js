/* Skaap se Praat – skerms */
'use strict';

/* ---------- Logo ---------- */

function skaapSvg(grootte, teks, borrelKleur) {
  const t = teks === undefined ? 'Mê!' : teks;
  return '<svg width="' + grootte + '" height="' + Math.round(grootte * 0.86) + '" viewBox="0 0 116 100" aria-hidden="true">' +
    '<g fill="#FFFFFF" stroke="#DADAD2" stroke-width="1"><circle cx="30" cy="62" r="13"/><circle cx="46" cy="54" r="15"/><circle cx="62" cy="58" r="14"/><circle cx="38" cy="72" r="13"/><circle cx="56" cy="72" r="13"/><circle cx="70" cy="68" r="11"/></g>' +
    '<g fill="#FFFFFF"><circle cx="46" cy="62" r="14"/><circle cx="56" cy="64" r="12"/></g>' +
    '<rect x="34" y="80" width="5" height="14" rx="2" fill="#252A27"/><rect x="58" y="80" width="5" height="14" rx="2" fill="#252A27"/>' +
    '<ellipse cx="79" cy="56" rx="10" ry="12" fill="#252A27"/><ellipse cx="72" cy="47" rx="6" ry="3" fill="#252A27" transform="rotate(-25 72 47)"/>' +
    '<circle cx="82" cy="54" r="2" fill="#fff"/>' +
    (t ? '<rect x="76" y="2" width="38" height="25" rx="10" fill="' + (borrelKleur || '#D69A2D') + '"/><path d="M85 26 L80 36 L94 26 Z" fill="' + (borrelKleur || '#D69A2D') + '"/>' +
      '<text x="95" y="20" text-anchor="middle" font-size="13" font-weight="700" fill="#252A27" font-family="system-ui,sans-serif">' + t + '</text>' : '') +
    '</svg>';
}

/* ---------- Kleinighede ---------- */

function ikoon(naam, kleur) { return '<span class="ikoon ' + (kleur || '') + '"><i class="ti ti-' + naam + '"></i></span>'; }

function statusPil(d) {
  if (d.uit === 'Dood') return '<span class="pil grys">Dood</span>';
  if (d.uit === 'Verkoop') return '<span class="pil grys">Verkoop</span>';
  if (d.uit === 'Geskenk') return '<span class="pil grys">Geskenk</span>';
  if (d.siek === 'Siek') return '<span class="pil rooi">Siek</span>';
  if (d.siek) return '<span class="pil oranje">Behandeling</span>';
  if (d.groep === 'Om te verkoop') return d.gereed === 'Gereed' ? '<span class="pil groen">Gereed</span>' : '<span class="pil oranje">Nie gereed</span>';
  if (d.vlae && d.vlae.length) return '<span class="pil oranje">Vlag</span>';
  if (d.lam) return '<span class="pil oranje">Lam</span>';
  return '';
}

function dierRy(d, ekstra) {
  const kls = d.uit ? 'uit' : d.lam ? 'lam' : '';
  const sub = [d.groep, ouderdomTeks(d)].filter(Boolean).join(' · ');
  return '<button class="lys-ry" data-a="dier" data-w="' + esc(d.n) + '">' +
    '<span class="nommer ' + kls + '">' + esc(d.n) + '</span>' +
    '<span class="hoof"><b>' + esc(d.geslag || (d.lam ? 'Lam' : 'Skaap')) + '</b>' + (ekstra ? ' ' + ekstra : '') +
    '<div class="s">' + esc(sub) + '</div></span>' + statusPil(d) + '<i class="ti ti-chevron-right"></i></button>';
}

function boodskap(teks) {
  const el = document.getElementById('boodskap');
  el.innerHTML = skaapSvg(34, '') + '<span>' + esc(teks) + '</span>';
  el.classList.add('wys');
  clearTimeout(boodskap._t);
  boodskap._t = setTimeout(function () { el.classList.remove('wys'); }, 3200);
}

function groet() {
  const u = new Date().getHours();
  return u < 12 ? 'Goeiemôre' : u < 18 ? 'Goeiemiddag' : 'Goeienaand';
}

/* ---------- Navigasie ---------- */

const App = {
  stapel: [{ v: 'tuis', p: {} }],

  huidig() { return this.stapel[this.stapel.length - 1]; },

  gaan(v, p, vervang) {
    const item = { v: v, p: p || {} };
    if (vervang) this.stapel[this.stapel.length - 1] = item;
    else { this.stapel.push(item); history.pushState({ d: this.stapel.length }, ''); }
    window.scrollTo(0, 0);
    this.herteken();
  },

  terug() {
    if (this.stapel.length > 1) history.back();
  },

  wortel(v) {
    const n = this.stapel.length - 1;
    this.stapel = [{ v: v, p: {} }];
    if (n > 0) history.go(-n);
    window.scrollTo(0, 0);
    this.herteken();
  },

  herteken() {
    const el = document.getElementById('skerm');
    const h = this.huidig();
    const skerm = Skerms[h.v] || Skerms.tuis;
    const y = window.scrollY;
    el.innerHTML = ikoneVervang(skerm(h.p));
    if (h._y !== undefined && h._herstel) window.scrollTo(0, h._y);
    else if (this._selfde === h) window.scrollTo(0, y);
    this._selfde = h;
    this.werkStatus();
    if (h.p.fokus) { const f = document.getElementById(h.p.fokus); if (f) f.focus(); h.p.fokus = null; }
  },

  werkStatus() {
    const el = document.getElementById('onder');
    if (!el) return;
    const v = this.stapel[0].v;
    const wag = Toestand.uitboks.length;
    const sein = navigator.onLine;
    const sinkIkoon = Toestand.besig ? 'refresh' : wag ? (sein ? 'cloud-upload' : 'cloud-off') : 'cloud-check';
    const sinkTeks = Toestand.besig ? 'Stuur…' : wag ? (sein ? 'Wag om te stuur' : 'Geen sein') : 'Gestoor';
    el.innerHTML = ikoneVervang('<div class="onder-binne">' +
      '<button data-a="wortel" data-w="tuis" class="' + (v === 'tuis' ? 'aan' : '') + '"><i class="ti ti-home"></i>Tuis</button>' +
      '<button data-a="wortel" data-w="lamseisoen" class="' + (v === 'lamseisoen' ? 'aan' : '') + '"><i class="ti ti-baby-carriage"></i>Lamseisoen</button>' +
      '<button data-a="wortel" data-w="kudde" class="' + (v === 'kudde' ? 'aan' : '') + '"><i class="ti ti-list"></i>Kudde</button>' +
      '<button data-a="wortel" data-w="kalender" class="' + (v === 'kalender' ? 'aan' : '') + '"><i class="ti ti-calendar"></i>Aksies</button>' +
      '<button data-a="wortel" data-w="sink" class="' + (v === 'sink' ? 'aan' : '') + (wag ? ' wag' : '') + '"><span class="kol"><i class="ti ti-' + sinkIkoon + '"></i>' +
      (wag ? '<span class="telling">' + wag + '</span>' : '') + '</span>' + sinkTeks + '</button></div>');
  },
};

window.addEventListener('popstate', function () {
  if (App.stapel.length > 1) {
    App.stapel.pop();
    const h = App.huidig();
    h._herstel = true;
    App.herteken();
    h._herstel = false;
  }
});

/* ---------- Gedeelde vorm-hulp ---------- */

function kop(titel, sub) {
  return '<div class="kop"><div class="kop-terug"><button data-a="terug" aria-label="Terug"><i class="ti ti-arrow-left"></i></button>' +
    '<div><h1>' + esc(titel) + '</h1>' + (sub ? '<div class="sub">' + esc(sub) + '</div>' : '') + '</div></div></div>';
}

function kiesKnoppies(veld, waarde, opsies, ekstraKlas) {
  return '<div class="kies">' + opsies.map(function (o) {
    const w = typeof o === 'string' ? o : o.w;
    const t = typeof o === 'string' ? o : o.t;
    const aan = Array.isArray(waarde) ? waarde.indexOf(w) >= 0 : waarde === w;
    return '<button type="button" data-a="kies" data-veld="' + veld + '" data-w="' + esc(w) + '" class="' + (aan ? 'aan ' + (ekstraKlas || '') : '') + '">' +
      (aan && Array.isArray(waarde) ? '<i class="ti ti-check"></i>' : '') + esc(t) + '</button>';
  }).join('') + '</div>';
}

function datumVeld(veld, waarde, etiket) {
  // Die kalender se formaat (mm/dd of dd/mm) kom van die toestel se taal; daarom wys ons die datum ook duidelik in woorde.
  return '<div class="veld"><label for="v-' + veld + '">' + (etiket || 'Datum') + '</label>' +
    '<input class="inv" type="date" id="v-' + veld + '" data-v="' + veld + '" data-her="1" value="' + esc(waarde || '') + '" max="' + vandag() + '">' +
    (waarde ? '<div class="hulp"><b>' + esc(langDatum(waarde)) + '</b></div>' : '') + '</div>';
}
function langDatum(s) {
  const d = naDatum(s);
  if (!d) return '';
  const dae = ['Sondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrydag', 'Saterdag'];
  return dae[d.getDay()] + ' ' + d.getDate() + ' ' + ['Januarie', 'Februarie', 'Maart', 'April', 'Mei', 'Junie', 'Julie', 'Augustus', 'September', 'Oktober', 'November', 'Desember'][d.getMonth()] + ' ' + d.getFullYear();
}

function dierVeld(veld, waarde, etiket, opsies) {
  opsies = opsies || {};
  const a = Afgelei.get();
  const d = a.diere[sleutelVan(waarde)];
  let terug = '';
  if (sleutelVan(waarde) !== '') {
    if (!d) terug = '<div class="fout">Nommer ' + esc(waarde) + ' is nie in die kudde nie.</div>';
    else terug = '<div class="hulp">' + esc([d.geslag, d.groep, ouderdomTeks(d)].filter(Boolean).join(' · ')) + (d.uit ? ' · ' + d.uit : '') + '</div>';
  }
  return '<div class="veld"><label for="v-' + veld + '">' + (etiket || 'Nommer') + '</label>' +
    '<input class="inv" id="v-' + veld + '" data-v="' + veld + '" data-her="1" inputmode="numeric" autocomplete="off" list="lys-' + veld + '" value="' + esc(waarde || '') + '" placeholder="bv. 347">' +
    '<datalist id="lys-' + veld + '">' + (opsies.lys || aktieweDiere(a)).map(function (x) { return '<option value="' + esc(x.n) + '">' + esc(x.groep) + '</option>'; }).join('') + '</datalist>' +
    terug + '</div>';
}

function foutBlok(f) { return f ? '<div class="inligting rooi"><i class="ti ti-alert-triangle"></i><span>' + esc(f) + '</span></div>' : ''; }

/* ---------- Skerms ---------- */

const Skerms = {};

/* ---------- Herinneringe (ram in / ram uit) ---------- */
// Die datums op die Ram-oortjie herhaal elke jaar; net dag en maand tel.
const HERINNER_DAE = 3;
function volgendeKeer(s, vandagD) {
  const d = naDatum(s);
  if (!d) return null;
  const x = new Date(vandagD.getFullYear(), d.getMonth(), d.getDate());
  if ((x - vandagD) / 86400000 < -1) x.setFullYear(x.getFullYear() + 1);
  return x;
}
function herinneringe(a) {
  const nou = new Date(); const v = new Date(nou.getFullYear(), nou.getMonth(), nou.getDate());
  const uit = [];
  // Teelseisoene uit die Seisoene-oortjie (die Ram-oortjie se datums as rugsteun).
  const bronne = a.seisoene.filter(function (x) { return x.tipe === 'Teel'; }).map(function (def) {
    const b = new Date(2000, def.bm, def.bd), e = new Date(2000, def.em, def.ed);
    return { 'Teel Seisoen': 'teelseisoen ' + def.naam, 'Begin Datum': datumS(b), 'Eind Datum': datumS(e) };
  });
  (bronne.length ? bronne : (a.ram || [])).forEach(function (o) {
    [['Begin Datum', 'in', 'Ramme moet in by die ooie'], ['Eind Datum', 'uit', 'Ramme moet uit by die ooie']].forEach(function (s) {
      const d = volgendeKeer(o[s[0]], v);
      if (!d) return;
      const dae = Math.round((d - v) / 86400000);
      if (dae < 0 || dae > HERINNER_DAE) return;
      const id = 'ram|' + o['Teel Seisoen'] + '|' + s[1] + '|' + d.getFullYear();
      if (Berg.lees('klaar_' + id, false)) return;
      const datumTeks = d.getDate() + ' ' + MAANDE[d.getMonth()];
      const wanneer = dae === 0 ? 'vandag' : dae === 1 ? 'môre' : 'oor ' + dae + ' dae (' + datumTeks + ')';
      const boodskap = 'Hallo, onthou asseblief: die ramme moet ' + (dae === 0 ? 'vandag' : 'op ' + datumTeks) + ' ' +
        (s[1] === 'in' ? 'by die ooie ingesit word' : 'by die ooie uitgehaal word') + ' vir die ' + o['Teel Seisoen'] + '. Dankie! 🐑';
      uit.push({ id: id, titel: s[2] + ' ' + wanneer, s: o['Teel Seisoen'] + ' · ' + datumTeks, boodskap: boodskap, dringend: dae <= 1 });
    });
  });
  return uit;
}
function herinneringRy(h) {
  return '<div class="lys-ry" style="flex-wrap:wrap;align-items:center">' + ikoon('bell', h.dringend ? 'rooi' : 'oranje') +
    '<span class="hoof"><b>' + esc(h.titel) + '</b><div class="s">' + esc(h.s) + '</div></span>' +
    '<span style="flex-basis:100%;display:flex;gap:8px;justify-content:flex-end;margin-top:8px">' +
    (isEienaar() ? '<a class="knop-klein" style="text-decoration:none;background:#25D366;color:#fff;border-color:#25D366" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(h.boodskap) + '"><i class="ti ti-message"></i> WhatsApp</a>' : '') +
    '<button class="knop-klein" data-a="herinner-klaar" data-w="' + esc(h.id) + '"><i class="ti ti-check"></i> Klaar</button></span></div>';
}

Skerms.tuis = function (p) {
  const a = Afgelei.get();
  const akt = aktieweDiere(a);
  const lammers = akt.filter(function (d) { return d.lam; }).length;
  const nieGelam = akt.filter(function (d) { return d.nieGelam; });
  const vlae = akt.filter(function (d) { return d.vlae.length; }).length;
  const omTeVerkoop = akt.filter(function (d) { return d.groep === 'Om te verkoop'; })
    .sort(function (x, y) { return (x.gereed === 'Gereed' ? 0 : 1) - (y.gereed === 'Gereed' ? 0 : 1) || getal(x.n) - getal(y.n); });
  const gereed = omTeVerkoop.filter(function (d) { return d.gereed === 'Gereed'; }).length;
  const naam = Toestand.wie ? Toestand.wie.naam : '';
  const seisoene = seisoeneOp(a);
  const jaar = vandag().slice(0, 4);
  const sterftes = a.sterftes.filter(function (o) { return String(o.datum).slice(0, 4) === jaar; });
  const doodGebore = sterftes.filter(function (o) { return o.soort === 'Dood gebore' || o.soort === 'Aborteer'; }).length;

  const aksieKnoppies = [
    ['vorm', 'lam', 'baby-carriage', 'Nuwe lam', ''],
    ['gaan', 'spuitprogram', 'vaccine', 'Spuitprogram', ''],
    ['vorm', 'siek', 'first-aid-kit', 'Siek skaap', 'rooi'],
    ['vorm', 'weeg', 'scale', 'Weeg', ''],
    ['vorm', 'nota', 'notes', 'Nota', 'oranje'],
    ['vorm', 'byvoeg', 'square-plus', 'Skaap byvoeg', ''],
    ['vorm', 'groepskuif', 'arrows-exchange', 'Skuif \'n groep', ''],
    ['vorm', 'bestelling', 'clipboard-list', 'Bestelling', 'oranje'],
    ['gaan', 'skeerblad', 'scissors', 'Skeer en wol', ''],
  ];
  if (isEienaar()) aksieKnoppies.push(['gaan', 'verkoopblad', 'cash', 'Verkoop', 'grys']);

  // Wat is nou aan die gang: seisoene, jaarlikse aksies, spuitprogramme en herinneringe.
  const nou = [];
  seisoene.forEach(function (x) {
    nou.push(x.tipe === 'Lam'
      ? '<button class="lys-ry" data-a="wortel" data-w="lamseisoen">' + ikoon('baby-carriage', 'oranje') + '<span class="hoof"><b>Lamseisoen ' + esc(x.naam) + '</b><div class="s">' + esc(seisoenSub(x)) + '</div></span><i class="ti ti-chevron-right"></i></button>'
      : '<div class="lys-ry">' + ikoon('heart', 'rooi') + '<span class="hoof"><b>Teelseisoen ' + esc(x.naam) + '</b><div class="s">' + esc(seisoenSub(x)) + '</div></span></div>');
  });
  a.aksies.filter(aksieAktief).forEach(function (o) {
    nou.push('<div class="lys-ry">' + ikoon('calendar') + '<span class="hoof"><b>' + esc(o.Aksie) + '</b><div class="s">' + esc(aksieTydperk(o)) + '</div></span></div>');
  });
  Object.keys(PROGRAM_MAANDE).forEach(function (prog) {
    const st = programStatus(a, prog);
    if (!st.totaal || (st.toestand !== 'nou' && st.toestand !== 'agter')) return;
    nou.push('<button class="lys-ry" data-a="gaan" data-w="spuitprogram" data-p="' + esc(prog) + '">' + ikoon('vaccine', st.toestand === 'agter' ? 'rooi' : 'oranje') +
      '<span class="hoof"><b>' + esc(prog) + '</b><div class="s">' + st.gedoen + ' van ' + st.totaal + ' gedoen · tot ' + kortDatum(st.siklus.einde) + '</div></span>' + programStatusPil(st) + '</button>');
  });
  herinneringe(a).forEach(function (h) { nou.push(herinneringRy(h)); });

  const groepTel = ALLE_GROEPE.map(function (g) { return [g, akt.filter(function (d) { return d.groep === g; }).length]; });

  return '<div class="kop"><div class="kop-ry">' + skaapSvg(52) +
    '<div style="min-width:0"><h1>Skaap se Praat</h1><div class="sub">' + groet() + (naam && naam !== 'Eienaar' ? ', ' + esc(naam) : '') + '! Jou kudde wag.</div></div></div>' +
    '<div class="kop-soek-ry"><form class="soek klein" data-a="soek"><i class="ti ti-search"></i><input id="soek" name="q" inputmode="numeric" maxlength="6" autocomplete="off" placeholder="Nr."><button class="knop-klein" type="submit">Soek</button></form>' +
    seisoene.map(seisoenPil).join('') + '</div></div>' +
    '<div class="inhoud">' +
    (Toestand.demo ? '<div class="inligting oranje" style="margin-bottom:12px"><i class="ti ti-flask"></i><span>' + (MOMENTOPNAME ? 'Toetsmodus met \'n kopie van jou sheet (' + esc(MOMENTOPNAME_TYD) + '). Wat jy hier verander, word nie in die sheet gestoor nie.' : 'Toetsmodus met voorbeelddata. Niks word na die sheet gestuur nie.') + '</span></div>' : '') +
    (!Toestand.demo && Toestand.besig && !Toestand.bediener ? '<div class="inligting" style="margin-bottom:12px"><i class="ti ti-refresh"></i><span>Ek haal jou kudde uit die sheet… Die eerste keer kan dit tot \'n halwe minuut vat.</span></div>' : '') +
    (!Toestand.demo && !Toestand.besig && Toestand.fout ? '<div class="inligting rooi" style="margin-bottom:12px;align-items:center"><i class="ti ti-alert-triangle"></i><span style="flex:1">' + esc(Toestand.fout) + '</span><button class="knop-klein" data-a="sinkNou">Probeer weer</button></div>' : '') +
    (!Toestand.demo && !Toestand.besig && !Toestand.fout && !Toestand.bediener ? '<div class="inligting oranje" style="margin-bottom:12px;align-items:center"><i class="ti ti-cloud-off"></i><span style="flex:1">Nog geen data van die sheet nie.</span><button class="knop-klein" data-a="sinkNou">Laai nou</button></div>' : '') +
    (Toestand.probleme.length ? '<button class="inligting rooi" data-a="wortel" data-w="sink" style="width:100%;border:0;margin-bottom:12px;text-align:left"><i class="ti ti-alert-triangle"></i><span>' + Toestand.probleme.length + ' inskrywing(s) kon nie gestoor word nie. Tik om te sien.</span></button>' : '') +
    (nou.length ? '<div class="titel nou">Nou aan die gang</div><div class="lys nou">' + nou.join('') + '</div>' : '') +
    // Skape op die plaas, met elke groep
    '<div class="kaart stat breed" style="margin-top:' + (nou.length ? '14px' : '0') + '">' +
      '<button class="bo-ry" data-a="wortel" data-w="kudde"><span class="getal">' + akt.length + '</span><span class="regs"><span class="etiket">Skape op die plaas</span>' +
      '<span style="color:var(--sukses)">' + lammers + ' lammers by ma</span><span>' + gereed + ' gereed om te verkoop' + (omTeVerkoop.length > gereed ? ' · ' + (omTeVerkoop.length - gereed) + ' nog nie' : '') + '</span></span><i class="ti ti-chevron-right"></i></button>' +
      '<div class="groepe">' + groepTel.map(function (x) {
        return '<button class="groep-ry' + (x[1] ? '' : ' leeg-groep') + '" data-a="kudde-filter" data-w="' + esc(x[0]) + '"><span>' + esc(x[0]) + '</span><b>' + x[1] + '</b><i class="ti ti-chevron-right"></i></button>';
      }).join('') + '</div></div>' +
    // Siek diere en groepe
    '<div class="titel">Siek diere <small>' + (a.ope.length ? a.ope.length + ' oop' : 'geen') + '</small></div><div class="lys">' +
      (a.ope.length ? a.ope.slice().sort(function (x, y) { return String(y.Datum).localeCompare(String(x.Datum)); }).map(function (o) {
        const sub = [o.Status, mooiDatum(o.Datum), o['Produk gespuit']].filter(Boolean).join(' · ');
        const d = a.diere[sleutelVan(o.Nommer)];
        if (sleutelVan(o.Nommer)) return '<button class="lys-ry" data-a="dier" data-w="' + esc(sleutelVan(o.Nommer)) + '"><span class="nommer" style="background:var(--rooi-lig);color:var(--rooi)">' + esc(sleutelVan(o.Nommer)) + '</span>' +
          '<span class="hoof"><b>' + esc(o['Probleem/Simptome'] || 'Siek') + '</b><div class="s">' + esc((d ? d.groep + ' · ' : '') + sub) + '</div></span>' + (d ? statusPil(d) : '') + '<i class="ti ti-chevron-right"></i></button>';
        return '<button class="lys-ry" data-a="siekgroep" data-w="' + o._r + '">' + ikoon('users', 'rooi') +
          '<span class="hoof"><b>' + esc(o.Groep || 'Groep') + '</b><div class="s">' + esc((o['Probleem/Simptome'] || '') + ' · ' + sub) + '</div></span><span class="pil rooi">Groep</span><i class="ti ti-chevron-right"></i></button>';
      }).join('') : '<div class="leeg">Geen siek diere nie. Mê!</div>') + '</div>' +
    '<div class="titel">Wat gebeur vandag?</div>' +
    '<div class="rooster aksies">' + aksieKnoppies.map(function (k) {
      return '<button class="aksie" data-a="' + k[0] + '" data-w="' + k[1] + '">' + ikoon(k[2], k[4]) + '<span class="n">' + k[3] + '</span></button>';
    }).join('') + '</div>' +
    '<div class="rooster" style="margin-top:10px">' +
      '<button class="kaart stat" data-a="gaan" data-w="sterftes" style="border:0;text-align:left;cursor:pointer"><div class="etiket">Sterftes ' + jaar + '</div><div class="getal" style="color:' + (sterftes.length ? 'var(--rooi)' : 'var(--teks)') + '">' + sterftes.length + '</div>' +
        '<div class="klein" style="color:var(--teks-2)">' + (sterftes.length - doodGebore) + ((sterftes.length - doodGebore) === 1 ? ' dier · ' : ' diere · ') + doodGebore + ' dood gebore</div></button>' +
      '<button class="kaart stat" data-a="gaan" data-w="siektes" style="border:0;text-align:left;cursor:pointer"><div class="etiket">Siekte-inligting</div><div class="getal" style="display:flex;align-items:center;gap:8px"><i class="ti ti-book" style="color:var(--groen)"></i>' + a.siektes.length + '</div>' +
        '<div class="klein" style="color:var(--teks-2)">simptome en spuitstof</div></button>' +
    '</div>' +
    (omTeVerkoop.length ? '<div class="titel">Om te verkoop <small>' + gereed + ' van ' + omTeVerkoop.length + ' gereed</small></div><div class="lys">' +
      omTeVerkoop.slice(0, 10).map(function (d) { const o = onttrekkingTot(a, d.n); return dierRy(d, o ? '<span class="pil rooi">Onttrekking tot ' + kortDatum(o) + '</span>' : ''); }).join('') + '</div>' : '') +
    (nieGelam.length ? '<div class="titel">Nie gelam in 12 maande <small>' + nieGelam.length + ' ooie · oorweeg uitskot</small></div><div class="lys">' +
      nieGelam.slice(0, 10).map(function (d) { return dierRy(d, '<span class="pil oranje">' + esc(d.nieGelam) + '</span>'); }).join('') +
      (nieGelam.length > 10 ? '<button class="lys-ry" data-a="kudde-filter" data-w="Nie gelam"><span class="hoof">Sien al ' + nieGelam.length + '</span><i class="ti ti-chevron-right"></i></button>' : '') + '</div>' : '') +
    (vlae ? '<div class="titel">Diere met \'n vlag</div><div class="lys">' + akt.filter(function (d) { return d.vlae.length; }).slice(0, 6).map(function (d) {
      return dierRy(d, '<span class="pil oranje">' + esc(d.vlae[0]) + '</span>');
    }).join('') + '</div>' : '') +
    (a.opeBestellings.length ? '<div class="titel">Bestellings <small>' + a.opeBestellings.length + ' oop</small></div><div class="lys">' +
      a.opeBestellings.slice(0, 6).map(bestellingRy).join('') +
      (a.opeBestellings.length > 6 ? '<button class="lys-ry" data-a="wortel" data-w="kalender"><span class="hoof">Sien al ' + a.opeBestellings.length + '</span><i class="ti ti-chevron-right"></i></button>' : '') + '</div>' :
      '<div class="titel">Bestellings <small>geen oop</small></div><div class="lys"><button class="lys-ry" data-a="vorm" data-w="bestelling">' +
      '<span class="ikoon oranje"><i class="ti ti-clipboard-list"></i></span><span class="hoof"><b>Nog geen bestellings nie</b><div class="s">Tik om \'n koper se bestelling aan te teken</div></span><i class="ti ti-chevron-right"></i></button></div>') +
    '</div>';
};

function bestellingRy(o) {
  return '<button class="lys-ry" ' + (o._r > 0 ? 'data-a="bestelling" data-w="' + o._r + '" data-k="' + esc(o.Naam) + '"' : '') + '>' +
    '<span class="nommer" style="background:var(--oranje-lig);color:var(--oranje-donker)">' + esc(o.Aantal || '?') + '</span>' +
    '<span class="hoof"><b>' + esc(o.Naam) + '</b><div class="s">' + esc([o.Wat, mooiDatum(o['Benodig Op'])].filter(Boolean).join(' · ')) + '</div></span>' +
    bestellingPil(o) + '<i class="ti ti-chevron-right"></i></button>';
}

function aksieInMaand(o, maand) {
  const v = naDatum(o.Van), t = naDatum(o.Tot);
  if (!v) return false;
  const mv = v.getMonth(), mt = t ? t.getMonth() : mv;
  if (mv <= mt) return maand >= mv && maand <= mt;
  return maand >= mv || maand <= mt;
}
function aksieTydperk(o) {
  return kortDatum(o.Van) + (o.Tot ? ' – ' + kortDatum(o.Tot) : '');
}

Skerms.kudde = function (p) {
  const a = Afgelei.get();
  const f = p.filter || 'Alle';
  const q = sleutelVan(p.q).toLowerCase();
  let lys = f === 'Uit' ? a.lys.filter(function (d) { return d.uit; }) : aktieweDiere(a);
  if (f === 'Siek') lys = lys.filter(function (d) { return d.siek; });
  else if (f === 'Lammers') lys = lys.filter(function (d) { return d.lam; });
  else if (f === 'Vlag') lys = lys.filter(function (d) { return d.vlae.length; });
  else if (f === 'Nie gelam') lys = lys.filter(function (d) { return d.nieGelam; });
  else if (f === 'Gereed') lys = lys.filter(function (d) { return d.gereed === 'Gereed'; });
  else if (ALLE_GROEPE.indexOf(f) >= 0) lys = lys.filter(function (d) { return d.groep === f; });
  if (q) lys = lys.filter(function (d) { return d.n.toLowerCase().indexOf(q) === 0; });
  // Ouderdom-filter (werk saam met die groep-filter hierbo)
  const oud = p.oud || 'Alle';
  const voorOud = lys;
  if (oud !== 'Alle') lys = lys.filter(function (d) { return ouderdomKlas(d) === oud; });
  const oudKlasse = ['Alle', '< 1 jaar', '1 jaar', '2 jaar', '3 jaar', '4 jaar', '5 jaar', '6+ jaar', 'Onbekend'];
  const oudTel = {};
  voorOud.forEach(function (d) { const k = ouderdomKlas(d); oudTel[k] = (oudTel[k] || 0) + 1; });
  const filters = ['Alle', 'Siek', 'Lammers', 'Vlag', 'Nie gelam', 'Gereed'].concat(ALLE_GROEPE).concat(['Uit']);
  return '<div class="kop"><div class="kop-ry"><h1>Kudde</h1><button class="knop-klein" style="margin-left:auto;background:#fff" data-a="vorm" data-w="byvoeg"><i class="ti ti-square-plus"></i> Skaap byvoeg</button></div>' +
    '<div class="soek"><i class="ti ti-search"></i><input id="kudde-q" data-a="kudde-soek" inputmode="numeric" autocomplete="off" placeholder="Soek nommer" value="' + esc(p.q || '') + '"></div></div>' +
    '<div class="inhoud"><div class="skyfies">' + filters.map(function (x) {
      return '<button class="skyf ' + (x === f ? 'aan' : '') + '" data-a="filter" data-w="' + esc(x) + '">' + esc(x === 'Uit' ? 'Dood/verkoop/geskenk' : x) + '</button>';
    }).join('') + '</div>' +
    '<div class="skyfies" style="padding-top:0"><span style="align-self:center;font-size:13px;color:var(--teks-2);flex-shrink:0">Ouderdom:</span>' + oudKlasse.filter(function (k) { return k === 'Alle' || oudTel[k] || k === oud; }).map(function (k) {
      return '<button class="skyf ' + (k === oud ? 'aan' : '') + '" data-a="oud-filter" data-w="' + esc(k) + '">' + esc(k) + (k !== 'Alle' && oudTel[k] ? ' (' + oudTel[k] + ')' : '') + '</button>';
    }).join('') + '</div>' +
    '<div class="titel" style="margin-top:4px">' + lys.length + (lys.length === 1 ? ' dier' : ' diere') + (f !== 'Alle' || oud !== 'Alle' ? ' <small>' + esc([f !== 'Alle' ? f : '', oud !== 'Alle' ? oud : ''].filter(Boolean).join(' · ')) + '</small>' : '') + '</div>' +
    '<div class="lys">' + (lys.length ? lys.slice(0, 300).map(function (d) { return dierRy(d); }).join('') : '<div class="leeg">Geen diere hier nie.</div>') + '</div></div>';
};

Skerms.dier = function (p) {
  const a = Afgelei.get();
  const d = a.diere[sleutelVan(p.n)];
  if (!d) return kop('Nie gevind nie') + '<div class="inhoud"><div class="leeg">Nommer ' + esc(p.n) + ' is nie in die kudde nie.</div>' +
    '<button class="knop" data-a="vorm" data-w="byvoeg" data-n="' + esc(p.n) + '">Voeg skaap ' + esc(p.n) + ' by</button></div>';

  const notas = notasVir(a, d.n);
  const spuit = spuitVir(a, d.n);
  const siek = siekVir(a, d);
  const weeg = weegVir(a, d.n);
  const vk = a.verkoop.filter(function (o) { return gelyk(o.Nommer, d.n); });

  const feite = [
    ['Geslag', d.geslag || '—'], ['Groep', d.groep || '—'],
    ['Geboorte', d.geboorte ? mooiDatum(d.geboorte) : '—'], ['Ouderdom', ouderdomTeks(d) || '—'],
  ];
  if (d.ma || d.pa) { feite.push(['Ma', d.ma || '—']); feite.push(['Pa', d.pa || '—']); }
  if (!d.lam && d.geslag === 'Ooi') feite.push(['Lammers', d.lammers.length]);
  if (d.verwek) feite.push(['Lammers verwek', d.verwek]);
  if (d.herkoms) feite.push(['Herkoms', d.herkoms]);
  if (weeg[0]) feite.push(['Laaste gewig', syferTeks(weeg[0]['Gewig (kg)']) + ' kg']);

  const snel = [];
  if (d.aktief) {
    snel.push(['spuit', 'vaccine', 'Spuit']);
    snel.push(['siek', 'first-aid-kit', 'Siek']);
    snel.push(['weeg', 'scale', 'Weeg']);
    snel.push(['nota', 'notes', 'Nota']);
    if (d.lam) snel.push(['speen', 'arrow-big-up-lines', 'Speen']);
    else snel.push(['skuif', 'arrows-exchange', 'Groep']);
    if (!d.lam && d.geslag === 'Ooi') snel.push(['lam', 'baby-carriage', 'Lam']);
    if (d.groep === 'Om te verkoop') snel.unshift(d.gereed === 'Gereed' ? ['nie-gereed', 'flag', 'Nie gereed'] : ['gereed', 'check', 'Gereed']);
    snel.push(['vlag', 'flag', 'Vlag']);
    if (!d.lam) snel.push(['wysig', 'pencil', 'Wysig']);
    snel.push(['uit', 'door-exit', 'Dood/Verkoop']);
  } else snel.push(['nota', 'notes', 'Nota']);

  let html = '<div class="kop"><div class="kop-terug"><button data-a="terug" aria-label="Terug"><i class="ti ti-arrow-left"></i></button>' +
    '<h1>' + esc((d.lam ? 'Lam ' : '') + d.n) + '</h1><span style="margin-left:auto">' + statusPil(d) + '</span></div>' +
    '<div class="stem" style="margin-top:10px">' + skaapSvg(64, '') + '<div class="borrel">' + esc(stemVan(a, d)) + '</div></div></div>';

  html += '<div class="inhoud"><div class="snel">' + snel.map(function (s) {
    if (s[0] === 'gereed' || s[0] === 'nie-gereed') return '<button data-a="gereed" data-w="' + (s[0] === 'gereed' ? 'Gereed' : 'Nie gereed') + '" data-n="' + esc(d.n) + '"><i class="ti ti-' + s[1] + '"></i>' + s[2] + '</button>';
    return '<button data-a="vorm" data-w="' + s[0] + '" data-n="' + esc(d.n) + '"><i class="ti ti-' + s[1] + '"></i>' + s[2] + '</button>';
  }).join('') + '</div>';

  html += '<div class="titel">Algemeen</div><div class="kaart feite">' + feite.map(function (f) {
    return '<div class="feit"><div class="e">' + esc(f[0]) + '</div><div class="w">' + esc(f[1]) + '</div></div>';
  }).join('') + '</div>';

  // Lam by die ma: merk of die ma die lam verwerp het of droog is (vlag die ooi dadelik).
  if (d.lam && d.aktief && d.ma) {
    const lr = a.lam.find(function (o) { return gelyk(o['Lam Nommer'], d.n); });
    const pr = lr ? String(lr['Ooi Probleem'] || '') : '';
    const vw = pr.indexOf('Verwerp') >= 0, dr = pr.indexOf('Droog') >= 0;
    const skakel = function (w, aan, teks) {
      return '<div class="skakel ' + (aan ? 'aan' : '') + '" data-a="ma-probleem" data-w="' + w + '" data-n="' + esc(d.n) + '"><span>' + teks + '</span><span class="sw"></span></div>';
    };
    html += '<div class="titel">Ma ' + esc(d.ma) + ' <small>die ooi word dadelik gevlag</small></div>' +
      '<div class="vorm" style="gap:8px">' + skakel('verwerp', vw, 'Ma het hierdie lam verwerp') + skakel('droog', dr, 'Ma is droog (geen melk)') + '</div>';
  }

  const ont = d.aktief ? onttrekkingTot(a, d.n) : '';
  if (ont) html += '<div class="inligting rooi" style="margin-top:10px"><i class="ti ti-alert-triangle"></i><span>Onttrekkingsperiode: nie slag of verkoop voor ' + mooiDatum(ont) + ' nie.</span></div>';
  if (d.nieGelam) html += '<div class="inligting oranje" style="margin-top:10px"><i class="ti ti-flag"></i><span>Nie gelam in die afgelope 12 maande nie (' + esc(d.nieGelam.toLowerCase()) + '). Oorweeg om haar na <b>Om te verkoop</b> te skuif.</span></div>';
  const outoVlae = d.vlae.filter(function (x) { return !(d.eieVlae || []).some(function (o) { return o.Rede === x; }); });
  if (outoVlae.length) html += '<div class="inligting oranje" style="margin-top:10px"><i class="ti ti-flag"></i><span>' + esc(outoVlae.join(', ')) + '</span></div>';
  (d.eieVlae || []).forEach(function (o) {
    html += '<div class="inligting oranje" style="margin-top:10px;align-items:center"><i class="ti ti-flag"></i><span style="flex:1"><b>' + esc(o.Rede) + '</b>' + (o.Datum ? ' · sedert ' + esc(kortDatum(o.Datum)) : '') + '</span>' +
      (o._r > 0 ? '<button class="knop-klein" data-a="vlag-ophef" data-w="' + o._r + '" data-n="' + esc(d.n) + '">Hef op</button>' : '') + '</div>';
  });

  html += afdeling('Notas', notas, function (o) {
    return '<div class="rek"><div class="bo"><span>' + esc(o.Nota) + '</span><span class="dt">' + kortDatum(o.Datum) + '</span></div></div>';
  });
  html += afdeling('Spuit', spuit, function (o) {
    return '<div class="rek"><div class="bo"><b>' + esc(o.Produk) + '</b><span class="dt">' + mooiDatum(o.Datum) + '</span></div>' +
      '<div class="s">' + esc([o.Program, o['Dosis (ml)'] !== '' && o['Dosis (ml)'] !== undefined ? syferTeks(o['Dosis (ml)']) + ' ml' : '', o.Nota].filter(Boolean).join(' · ')) + '</div></div>';
  });
  html += afdeling('Siekte', siek, function (o) {
    const oop = o.Status === 'Siek' || o.Status === 'Onder behandeling';
    return '<div class="rek"><div class="bo"><b>' + esc(o['Probleem/Simptome'] || 'Siek') + '</b><span class="dt">' + mooiDatum(o.Datum) + '</span></div>' +
      '<div class="s">' + esc([o.Status, o.Aksie, o['Produk gespuit'], sleutelVan(o.Nommer) ? '' : (o.Groep ? 'Groep: ' + o.Groep : ''),
        o['Gesond/Dood Datum'] ? (o.Status === 'Dood' ? 'Dood ' : 'Gesond ') + kortDatum(o['Gesond/Dood Datum']) : ''].filter(Boolean).join(' · ')) + '</div>' +
      (oop && o._r > 0 && sleutelVan(o.Nommer) ? '<button class="knop-klein" data-a="gesond" data-w="' + o._r + '" data-n="' + esc(d.n) + '"><i class="ti ti-heart"></i> Merk gesond</button>' : '') + '</div>';
  });
  if (!d.lam && d.geslag === 'Ooi') {
    html += afdeling('Lammers', d.lammers.slice().sort(function (x, y) { return String(y['Geboorte Datum']).localeCompare(String(x['Geboorte Datum'])); }), function (o) {
      const ln = sleutelVan(o['Lam Nommer']);
      const dood = o.Kondisie === 'Dood gebore' || o.Kondisie === 'Aborteer';
      let ou = '';
      if (!dood && o['Geboorte Datum']) {
        const lamD = a.diere[ln];
        const tot = lamD && lamD.datumUit ? naDatum(lamD.datumUit) : naDatum(vandag());
        const wk = Math.max(0, Math.floor(dae(naDatum(o['Geboorte Datum']), tot) / 7)); ou = wk === 1 ? '1 week' : wk + ' weke';
      }
      const sg = ln ? speengewig(a, ln) : '';
      return '<div class="rek"' + (ln ? ' data-a="dier" data-w="' + esc(ln) + '" style="cursor:pointer"' : '') + '><div class="bo"><b>' + (ln ? 'Lam ' + esc(ln) : esc(o.Kondisie)) + '</b><span class="dt">' + mooiDatum(o['Geboorte Datum']) + '</span></div>' +
        '<div class="s">' + esc([ln ? o.Groep : '', ln ? o.Kondisie : '', ou, sg !== '' ? 'Speen ' + syferTeks(sg) + ' kg' : '', o['Ooi Probleem'], o.Pa ? 'Pa ' + o.Pa : ''].filter(Boolean).join(' · ')) + '</div></div>';
    });
  }
  html += afdeling('Gewig', weeg, function (o) {
    return '<div class="rek"><div class="bo"><b>' + esc(syferTeks(o['Gewig (kg)'])) + ' kg</b><span class="dt">' + mooiDatum(o.Datum) + '</span></div><div class="s">' + esc(o.Rede || '') + '</div></div>';
  });
  if (isEienaar() && vk.length) {
    html += afdeling('Verkoop', vk, function (o) {
      return '<div class="rek"><div class="bo"><b>' + esc(o['Aan Wie'] || 'Verkoop') + '</b><span class="dt">' + mooiDatum(o.Date) + '</span></div>' +
        '<div class="s">' + esc([o.Prys !== '' && o.Prys !== undefined ? 'R ' + o.Prys : '', o.Gewig ? o.Gewig + ' kg' : '', o['R/kg'] ? 'R' + o['R/kg'] + '/kg' : '', o.Paid === true ? 'Betaal' : ''].filter(Boolean).join(' · ')) + '</div></div>';
    });
  }
  return html + '</div>';
};

function afdeling(titel, rye, ry) {
  return '<div class="titel">' + titel + (rye.length ? ' <small>' + rye.length + '</small>' : '') + '</div><div class="lys">' +
    (rye.length ? rye.map(ry).join('') : '<div class="leeg">Nog niks nie.</div>') + '</div>';
}

Skerms.kalender = function () {
  const a = Afgelei.get();
  const maand = new Date().getMonth();
  const aksies = a.aksies.slice().sort(function (x, y) {
    const mx = (naDatum(x.Van) || new Date(0)).getMonth(), my = (naDatum(y.Van) || new Date(0)).getMonth();
    return ((mx - maand + 12) % 12) - ((my - maand + 12) % 12);
  });
  return '<div class="kop"><div class="kop-ry"><h1>Aksies deur die jaar</h1></div></div><div class="inhoud">' +
    '<div class="titel">Bestellings <small>' + a.opeBestellings.length + ' oop</small></div><div class="lys">' +
    (a.opeBestellings.length ? a.opeBestellings.map(bestellingRy).join('') : '<div class="leeg">Geen oop bestellings nie.</div>') + '</div>' +
    '<button class="knop tweede" style="margin-top:10px" data-a="vorm" data-w="bestelling"><i class="ti ti-plus"></i> Nuwe bestelling</button>' +
    '<div class="titel">Jaarlikse aksies</div>' +
    '<div class="lys">' + (aksies.length ? aksies.map(function (o) {
      const nou = aksieInMaand(o, maand);
      return '<div class="rek"><div class="bo"><b>' + esc(o.Aksie) + '</b>' + (nou ? '<span class="pil groen">Nou</span>' : '') + '</div><div class="s">' + aksieTydperk(o) + '</div></div>';
    }).join('') : '<div class="leeg">Nog geen aksies nie.</div>') + '</div>' +
    '<div class="titel">Seisoene <small>uit die Seisoene-oortjie</small></div><div class="lys">' + a.seisoene.map(function (def) {
      const x = seisoenIn(def, Number(vandag().slice(0, 4)));
      const aktief = seisoeneOp(a).some(function (y) { return y.def === def; });
      return '<div class="rek"><div class="bo"><b>' + (def.tipe === 'Lam' ? 'Lamseisoen ' : 'Teelseisoen ') + esc(def.naam) + '</b>' + (aktief ? '<span class="pil groen">Nou</span>' : '') + '</div><div class="s">' + periodeTeks(x) + '</div></div>';
    }).join('') + '</div></div>';
};

const BEWERKING_NAME = { skaap_byvoeg: 'Skaap bygevoeg', lam: 'Nuwe lam', spuit: 'Spuit', siek: 'Siek skaap', siek_status: 'Gesond gemerk',
  weeg: 'Weeg', nota: 'Nota', bestelling: 'Bestelling', bestelling_status: 'Bestelling opgedateer', uit: 'Dood/Verkoop', verkoop: 'Verkoop', groep_skuif: 'Groep geskuif', skaap_wysig: 'Skaap gewysig' };

function bewerkingTeks(op) {
  const d = op.data || {};
  const wie = d.naam || d.nommer || d.ma || (d.groepe || []).join(', ') || d.groep || '';
  return (BEWERKING_NAME[op.tipe] || op.tipe) + (wie ? ' · ' + wie : '');
}

Skerms.sink = function () {
  const sein = navigator.onLine;
  const laaste = Toestand.laasteSink ? new Date(Toestand.laasteSink) : null;
  return '<div class="kop"><div class="kop-ry"><h1>Stoor en sein</h1></div></div><div class="inhoud">' +
    '<div class="kaart" style="display:flex;gap:12px;align-items:center">' + ikoon(sein ? 'wifi' : 'wifi-off', sein ? '' : 'oranje') +
    '<div><b>' + (Toestand.demo ? 'Toetsmodus' : sein ? 'Daar is sein' : 'Geen sein nie') + '</b><div class="s" style="font-size:13px;color:var(--teks-2)">' +
    (laaste ? 'Laaste keer met die sheet gepraat: ' + laaste.toLocaleString('af-ZA') : 'Nog nie met die sheet gepraat nie') + '</div></div></div>' +
    '<div style="margin-top:12px"><button class="knop" data-a="sinkroniseer"><i class="ti ti-refresh"></i> Stuur en laai nou</button></div>' +
    '<div class="titel">Wag om gestuur te word <small>' + Toestand.uitboks.length + '</small></div><div class="lys">' +
    (Toestand.uitboks.length ? Toestand.uitboks.map(function (o) {
      return '<div class="rek"><div class="bo"><b>' + esc(bewerkingTeks(o)) + '</b><span class="dt">' + new Date(o.tyd).toLocaleTimeString('af-ZA', { hour: '2-digit', minute: '2-digit' }) + '</span></div></div>';
    }).join('') : '<div class="leeg">Alles is gestoor in die sheet.</div>') + '</div>' +
    (Toestand.probleme.length ? '<div class="titel">Kon nie stoor nie</div><div class="lys">' + Toestand.probleme.map(function (o, i) {
      return '<div class="rek"><div class="bo"><b>' + esc(bewerkingTeks(o)) + '</b></div><div class="s" style="color:var(--rooi)">' + esc(o.fout) + '</div>' +
        '<button class="knop-klein" data-a="probleem-weg" data-w="' + i + '">Verwyder</button></div>';
    }).join('') + '</div>' : '') +
    '<div class="titel">Hierdie toestel</div><div class="kaart" style="font-size:14px;color:var(--teks-2)">' +
    'Gebruiker: ' + esc(Toestand.wie ? Toestand.wie.naam : 'onbekend') + (isEienaar() ? ' (alle toegang)' : '') + '</div></div>';
};

Skerms.welkom = function () {
  return '<div class="welkom">' + skaapSvg(140) + '<h1>Skaap se Praat</h1>' +
    '<p>Hierdie toestel is nog nie gekoppel nie. Maak die skakel oop wat jy ontvang het, dan begin die app vanself.</p>' +
    '<button class="knop tweede" data-a="demo"><i class="ti ti-flask"></i> Probeer met toetsdata</button></div>';
};

/* ---------- Gebeure ---------- */

document.addEventListener('click', function (e) {
  const el = e.target.closest('[data-a]');
  if (!el) return;
  const a = el.dataset.a, w = el.dataset.w;
  const h = App.huidig();
  switch (a) {
    case 'terug': App.terug(); break;
    case 'wortel': App.wortel(w); break;
    case 'sinkNou': sinkroniseer(); break;
    case 'herinner-klaar': Berg.skryf('klaar_' + w, true); App.herteken(); break;
    case 'dier': App.gaan('dier', { n: w }); break;
    case 'gaan': App.gaan(w, el.dataset.p ? { program: el.dataset.p } : {}); break;
    case 'siekgroep': App.gaan('siekgroep', { r: Number(w) }); break;
    case 'sp-program': h.p.program = w; h.p.gekies = {}; App.herteken(); break;
    case 'sp-kies': h.p.gekies[w] = !h.p.gekies[w]; App.herteken(); break;
    case 'sp-stoor': spuitProgramStoor(h.p); break;
    case 'ls-kies': h.p.s = w; App.herteken(); break;
    case 'st-jaar': h.p.jaar = w; App.herteken(); break;
    case 'vk-oortjie': h.p.oortjie = w; App.herteken(); break;
    case 'vlag-ophef': {
      const o = Afgelei.get().diere[el.dataset.n];
      const v = o && (o.eieVlae || []).find(function (x) { return x._r === Number(w); });
      App.gaan('vorm', { tipe: 'vlag_ophef', vorm: { ry: Number(w), nommer: el.dataset.n, rede: v ? v.Rede : '', datum: vandag() } });
      break;
    }
    case 'ma-probleem': {
      const a = Afgelei.get();
      const lr = a.lam.find(function (o) { return gelyk(o['Lam Nommer'], el.dataset.n); });
      if (!lr) break;
      const pr = String(lr['Ooi Probleem'] || '');
      let vw = pr.indexOf('Verwerp') >= 0, dr = pr.indexOf('Droog') >= 0;
      if (w === 'verwerp') vw = !vw; else dr = !dr;
      const nuut = vw && dr ? 'Verwerp lam + Droog' : vw ? 'Verwerp lam' : dr ? 'Droog (geen melk)' : '';
      voegBewerkingBy('lam_probleem', { ry: lr._r, nommer: el.dataset.n, probleem: nuut });
      const ma = sleutelVan(lr['Ma Nommer']);
      boodskap(nuut ? 'Ooi ' + ma + ' is gevlag: ' + nuut.toLowerCase() + '.' : 'Vlag vir ooi ' + ma + ' is verwyder.');
      App.herteken();
      break;
    }
    case 'siekte-wysig': App.gaan('vorm', { tipe: 'siekte', vorm: Vorms.begin('siekte', w) }); break;
    case 'vorm': App.gaan('vorm', { tipe: w, vorm: Vorms.begin(w, el.dataset.n) }); break;
    case 'filter': h.p.filter = w; App.herteken(); break;
    case 'oud-filter': h.p.oud = w; App.herteken(); break;
    case 'kudde-filter': App.wortel('kudde'); App.huidig().p.filter = w === 'siek' ? 'Siek' : w; App.herteken(); break;
    case 'kies': Vorms.kies(h.p, el.dataset.veld, w); break;
    case 'stoor': Vorms.stoor(h.p); break;
    case 'vorm-aksie': Vorms.aksie(h.p, w, el); break;
    case 'gesond': App.gaan('vorm', { tipe: 'gesond', vorm: { ry: Number(w), nommer: el.dataset.n || '', groep: el.dataset.g || '', datum: vandag() } }); break;
    case 'sinkroniseer': sinkroniseer(); break;
    case 'bestelling': App.gaan('vorm', { tipe: 'bestelling_oop', vorm: { ry: Number(w), naam: el.dataset.k, datum: vandag() } }); break;
    case 'gereed': voegBewerkingBy('gereed', { nommer: el.dataset.n, gereed: w }); boodskap(w === 'Gereed' ? el.dataset.n + ' is gereed om verkoop te word.' : el.dataset.n + ' is nog nie gereed nie.'); App.herteken(); break;
    case 'probleem-weg': Toestand.probleme.splice(Number(w), 1); stoorToestand(); App.herteken(); break;
    case 'demo': begin('demo'); break;
  }
});

document.addEventListener('submit', function (e) {
  const f = e.target;
  if (f.dataset.a === 'soek') {
    e.preventDefault();
    const q = sleutelVan(f.q.value);
    if (!q) return;
    const a = Afgelei.get();
    if (a.diere[q]) App.gaan('dier', { n: q });
    else { App.wortel('kudde'); App.huidig().p.q = q; App.herteken(); }
  }
});

document.addEventListener('input', function (e) {
  const el = e.target;
  const h = App.huidig();
  if (el.id === 'v-sp_datum') { h.p.datum = el.value; return; }
  if (el.dataset.a === 'siekte-soek') {
    h.p.q = el.value;
    clearTimeout(document._t);
    document._t = setTimeout(function () { h.p.fokus = 'siekte-q'; App.herteken(); const i = document.getElementById('siekte-q'); if (i) i.setSelectionRange(i.value.length, i.value.length); }, 300);
    return;
  }
  if (el.dataset.a === 'kudde-soek') {
    h.p.q = el.value;
    clearTimeout(document._t);
    document._t = setTimeout(function () { h.p.fokus = 'kudde-q'; App.herteken(); const i = document.getElementById('kudde-q'); if (i) { i.setSelectionRange(i.value.length, i.value.length); } }, 250);
    return;
  }
  const v = el.dataset.v;
  if (!v || !h.p.vorm) return;
  h.p.vorm[v] = el.type === 'checkbox' ? el.checked : el.value;
  h.p.fout = '';
  Vorms.verander(h.p, v, el.value);
  if (el.dataset.her) {
    clearTimeout(document._t);
    document._t = setTimeout(function () {
      const pos = el.selectionStart;
      h.p.fokus = el.id;
      App.herteken();
      const n = document.getElementById(el.id);
      if (n && n.setSelectionRange && pos !== null) { try { n.setSelectionRange(pos, pos); } catch (x) { /* datum-velde */ } }
    }, 350);
  }
});

/* ---------- Begin ---------- */

function begin(modus) {
  if (modus === 'demo') {
    Toestand.demo = true;
    Toestand.wie = { naam: 'Eienaar', rol: 'eienaar' };
    Toestand.bediener = demoData();
    Toestand.uitboks = [];
    Afgelei.ongeldig();
    App.stapel = [{ v: 'tuis', p: {} }];
    App.herteken();
    return;
  }
  App.herteken();
  sinkroniseer();
}

window.addEventListener('DOMContentLoaded', function () {
  // Sleutel uit die skakel (…#k=abc) – word een keer gestoor en dan uit die adres verwyder.
  const m = location.hash.match(/k=([A-Za-z0-9]+)/);
  if (m) {
    Toestand.sleutel = m[1];
    stoorToestand();
    history.replaceState(null, '', location.pathname + location.search);
  }
  const demo = /demo/.test(location.search) || !KONFIG.API;
  history.replaceState({ d: 1 }, '');
  if (demo && !Toestand.sleutel) { begin('demo'); }
  else if (!Toestand.sleutel) { App.stapel = [{ v: 'welkom', p: {} }]; App.herteken(); }
  else begin();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () { /* geen werker nie */ });
  }
});
