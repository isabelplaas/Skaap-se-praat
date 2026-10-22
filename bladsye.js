/* Skaap se Praat – ekstra bladsye: lamseisoen, spuitprogram, siek groep, sterftes, siektes, verkoop */
'use strict';

/* ---------- Hulp ---------- */

function mdSleutel(d) { return d.getMonth() * 100 + d.getDate(); }

// Is 'n jaarlikse aksie vandag aan die gang? (Datums herhaal elke jaar.)
function aksieAktief(o) {
  const v = naDatum(o.Van), t = naDatum(o.Tot);
  if (!v) return false;
  const nou = naDatum(vandag());
  if (!t) return v.getMonth() === nou.getMonth();
  const k = mdSleutel(nou), vk = mdSleutel(v), tk = mdSleutel(t);
  return vk <= tk ? (k >= vk && k <= tk) : (k >= vk || k <= tk);
}

function periodeTeks(x) { return kortDatum(x.begin) + ' – ' + kortDatum(x.einde); }

function seisoenSub(x) {
  const tot = daeTot(x.einde), sedert = -daeTot(x.begin);
  const lengte = dae(naDatum(x.begin), naDatum(x.einde)) + 1;
  return periodeTeks(x) + ' · dag ' + (sedert + 1) + ' van ' + lengte + (tot >= 0 ? ' · nog ' + tot + (tot === 1 ? ' dag' : ' dae') : '');
}

function seisoenPil(x) {
  if (x.tipe === 'Lam') return '<button class="seisoen-pil" data-a="wortel" data-w="lamseisoen"><i class="ti ti-baby-carriage"></i>Lamseisoen ' + esc(x.naam) + '</button>';
  return '<span class="seisoen-pil teel"><i class="ti ti-heart"></i>Teelseisoen ' + esc(x.naam) + '</span>';
}

/* ---------- Spuitprogram ---------- */

// Programme met vaste maande (0 = Jan). Speen en Buite Program het nie vaste tye nie.
const PROGRAM_MAANDE = { 'Feb Spuit Program': [1, 2], 'Aug Spuit Program': [7, 8] };

// Die produkte in 'n program, met hul teikengroepe en dosis per groep (uit die Spuit Program-oortjie).
function programItems(a, program) {
  const t = a.data['Spuit Program'];
  if (!t) return [];
  const iBesk = t.kop.indexOf('Beskrywing'), iOnt = t.kop.indexOf('Onttrekking (dae)'), iOud = t.kop.indexOf('Ouderdom');
  const uit = [];
  t.rye.forEach(function (r) {
    if (r.w[0] !== program || !String(r.w[1]).trim()) return;
    const groepe = [];
    GROEPE.forEach(function (g) {
      const k = t.kop.indexOf(g);
      if (k >= 0 && r.w[k] === true) groepe.push({ g: g, dosis: r.w[k + 1] });
    });
    uit.push({ produk: String(r.w[1]).trim(), beskrywing: iBesk >= 0 ? r.w[iBesk] : '', onttrekking: iOnt >= 0 ? r.w[iOnt] : '',
      ouderdom: iOud >= 0 ? r.w[iOud] : '', groepe: groepe });
  });
  return uit;
}

// Die relevante siklus van 'n program met vaste maande: venster plus 'n bietjie speling.
function programSiklus(program) {
  const m = PROGRAM_MAANDE[program];
  if (!m) return null;
  const nou = vandag();
  const j = Number(nou.slice(0, 4));
  const maak = function (y) {
    const begin = datumS(new Date(y, m[0], 1));
    const einde = datumS(new Date(y, m[m.length - 1] + 1, 0));
    return { begin: begin, einde: einde, van: plusDae(begin, -30), tot: plusDae(einde, 60), jaar: y };
  };
  const hierdie = maak(j);
  if (nou <= hierdie.tot) return nou >= hierdie.van ? hierdie : (maak(j - 1).tot >= nou ? maak(j - 1) : hierdie);
  return maak(j + 1);
}

// Spuit-rekords vir 'n produk en groep (nuutste eerste).
function gespuit(a, program, produk, groep) {
  return a.spuit.filter(function (o) {
    if (o.Program !== program || String(o.Produk).trim() !== produk) return false;
    return o[groep] === true || (', ' + String(o['Teiken groepe'] || '') + ',').indexOf(', ' + groep + ',') >= 0;
  }).sort(function (x, y) { return String(y.Datum).localeCompare(String(x.Datum)); });
}

function programStatus(a, program) {
  const items = programItems(a, program);
  const s = programSiklus(program);
  let totaal = 0, gedoen = 0;
  items.forEach(function (it) {
    it.groepe.forEach(function (gr) {
      totaal++;
      const r = gespuit(a, program, it.produk, gr.g)[0];
      if (r && (!s || (r.Datum >= s.van && r.Datum <= s.tot))) gedoen++;
    });
  });
  const nou = vandag();
  let toestand = 'geen';
  if (s && totaal) {
    if (gedoen >= totaal) toestand = 'klaar';
    else if (nou < s.begin) toestand = 'binnekort';
    else if (nou <= s.einde) toestand = 'nou';
    else toestand = 'agter';
  }
  return { totaal: totaal, gedoen: gedoen, siklus: s, toestand: toestand };
}

function programStatusPil(st) {
  if (!st.siklus) return '';
  if (!st.totaal) return '<span class="pil grys">Geen produkte</span>';
  if (st.toestand === 'klaar') return '<span class="pil groen">Op datum</span>';
  if (st.toestand === 'agter') return '<span class="pil rooi">Agter · ' + st.gedoen + ' van ' + st.totaal + '</span>';
  if (st.toestand === 'nou') return '<span class="pil oranje">' + st.gedoen + ' van ' + st.totaal + ' gedoen</span>';
  return '<span class="pil grys">Begin ' + kortDatum(st.siklus.begin) + '</span>';
}

Skerms.spuitprogram = function (p) {
  const a = Afgelei.get();
  if (!p.program) {
    const m = new Date().getMonth();
    p.program = m >= 1 && m <= 2 ? 'Feb Spuit Program' : m >= 7 && m <= 8 ? 'Aug Spuit Program' : 'Feb Spuit Program';
  }
  if (!p.gekies) p.gekies = {};
  if (!p.datum) p.datum = vandag();
  const prog = p.program;
  let html = kop('Spuitprogram', 'Wat moet gespuit word, en is ons op datum?') + '<div class="inhoud">' +
    '<div class="skyfies">' + PROGRAMME.map(function (x) {
      return '<button class="skyf ' + (x === prog ? 'aan' : '') + '" data-a="sp-program" data-w="' + esc(x) + '">' + esc(x.replace(' Spuit Program', '')) + '</button>';
    }).join('') + '</div>';

  if (prog === 'Buite Program') {
    const onlangs = a.spuit.filter(function (o) { return o.Program === 'Buite Program'; })
      .sort(function (x, y) { return String(y.Datum).localeCompare(String(x.Datum)); }).slice(0, 20);
    html += '<div class="inligting"><i class="ti ti-info-circle"></i><span>Behandeling buite die vaste programme, bv. vir een siek skaap of \'n groep.</span></div>' +
      '<button class="knop" style="margin-top:12px" data-a="vorm" data-w="spuit"><i class="ti ti-vaccine"></i> Spuit buite program</button>' +
      afdeling('Onlangs', onlangs, function (o) {
        return '<div class="rek"><div class="bo"><b>' + esc(o.Produk) + '</b><span class="dt">' + mooiDatum(o.Datum) + '</span></div>' +
          '<div class="s">' + esc([sleutelVan(o.Nommer) ? 'Skaap ' + o.Nommer : o['Teiken groepe'], o['Dosis (ml)'] !== '' ? syferTeks(o['Dosis (ml)']) + ' ml' : '', o.Nota].filter(Boolean).join(' · ')) + '</div></div>';
      });
    if (isEienaar()) html += '<button class="knop tweede" style="margin-top:14px" data-a="vorm" data-w="produk" data-n="Buite Program"><i class="ti ti-plus"></i> Produk / medisyne byvoeg</button>';
    return html + '</div>';
  }

  const items = programItems(a, prog);
  const st = programStatus(a, prog);
  const s = st.siklus;
  html += '<div class="kaart" style="display:flex;gap:12px;align-items:center">' + ikoon('vaccine', st.toestand === 'agter' ? 'rooi' : st.toestand === 'nou' ? 'oranje' : '') +
    '<div style="flex:1;min-width:0"><b>' + esc(prog) + '</b><div class="s" style="font-size:13px;color:var(--teks-2)">' +
    (s ? MAANDE[naDatum(s.begin).getMonth()] + ' – ' + MAANDE[naDatum(s.einde).getMonth()] + ' ' + s.jaar : 'Geen vaste tyd nie · spuit wanneer lammers gespeen word') + '</div></div>' +
    programStatusPil(st) + '</div>';

  const tel = Object.keys(p.gekies).filter(function (k) { return p.gekies[k]; }).length;
  html += '<div class="vorm" style="margin-top:14px">' + datumVeld('sp_datum', p.datum, 'Datum gespuit') + '</div>';
  html += '<div class="hulp" style="font-size:13px;color:var(--teks-2);margin:10px 2px 0">Merk elke groep wat jy gespuit het en druk <b>Stoor</b>. Groepe wat reeds gedoen is, het \'n groen regmerkie.</div>';

  if (!items.length) html += '<div class="lys" style="margin-top:12px"><div class="leeg">Nog geen produkte in hierdie program nie.</div></div>';
  items.forEach(function (it) {
    html += '<div class="titel">' + esc(it.produk) + (it.onttrekking !== '' && it.onttrekking !== undefined && Number(it.onttrekking) > 0 ? ' <small>Onttrekking ' + esc(it.onttrekking) + ' dae</small>' : '') + '</div>';
    html += '<div class="lys">';
    if (it.beskrywing || it.ouderdom) html += '<div class="rek"><div class="s">' + esc([it.beskrywing, it.ouderdom].filter(Boolean).join(' · ')) + '</div></div>';
    if (!it.groepe.length) html += '<div class="leeg">Geen teikengroepe gemerk nie.</div>';
    it.groepe.forEach(function (gr) {
      const sleutel = it.produk + '|' + gr.g;
      const laaste = gespuit(a, prog, it.produk, gr.g)[0];
      const gedoen = laaste && (!s || (laaste.Datum >= s.van && laaste.Datum <= s.tot));
      const n = inGroepe(a, [gr.g]).length;
      const ds = gr.dosis === '' || gr.dosis === undefined ? '' : syferTeks(gr.dosis);
      const sub = (ds ? ds + ' ml × ' + n + ' = ' + syferTeks(Math.round(getal(gr.dosis) * n * 10) / 10) + ' ml' : n + (n === 1 ? ' dier' : ' diere')) +
        (laaste && !gedoen ? ' · laas ' + mooiDatum(laaste.Datum) : '');
      if (gedoen && !s) { /* Speen-program: altyd weer moontlik */ }
      if (gedoen && s) {
        html += '<div class="lys-ry gedoen">' + '<span class="merk aan"><i class="ti ti-square-check"></i></span>' +
          '<span class="hoof"><b>' + esc(gr.g) + '</b><div class="s">Gedoen ' + mooiDatum(laaste.Datum) + '</div></span><span class="pil groen">Klaar</span></div>';
      } else {
        const aan = !!p.gekies[sleutel];
        html += '<button class="lys-ry" data-a="sp-kies" data-w="' + esc(sleutel) + '">' + '<span class="merk' + (aan ? ' aan' : '') + '"><i class="ti ti-' + (aan ? 'square-check' : 'square') + '"></i></span>' +
          '<span class="hoof"><b>' + esc(gr.g) + '</b><div class="s">' + esc(sub) + '</div></span>' +
          (!s && laaste ? '<span class="pil grys">' + kortDatum(laaste.Datum) + '</span>' : '') + '</button>';
      }
    });
    html += '</div>';
  });
  if (items.length) html += '<button class="knop" style="margin-top:16px" data-a="sp-stoor"' + (tel ? '' : ' disabled') + '><i class="ti ti-check"></i> Stoor' + (tel ? ' (' + tel + (tel === 1 ? ' groep' : ' groepe') + ')' : '') + '</button>';
  if (isEienaar()) html += '<button class="knop tweede" style="margin-top:10px" data-a="vorm" data-w="produk" data-n="' + esc(prog) + '"><i class="ti ti-plus"></i> Produk byvoeg aan hierdie program</button>';
  return html + '</div>';
};

function spuitProgramStoor(p) {
  const a = Afgelei.get();
  const prog = p.program;
  const items = programItems(a, prog);
  let groepe = 0, diere = 0;
  items.forEach(function (it) {
    // Groepe met dieselfde dosis word saam as een rekord gestoor.
    const perDosis = {};
    it.groepe.forEach(function (gr) {
      if (!p.gekies[it.produk + '|' + gr.g]) return;
      const k = gr.dosis === '' || gr.dosis === undefined ? '' : String(gr.dosis);
      (perDosis[k] = perDosis[k] || []).push(gr.g);
    });
    Object.keys(perDosis).forEach(function (k) {
      const gs = perDosis[k];
      const lys = inGroepe(a, gs).map(function (d) { return d.n; });
      voegBewerkingBy('spuit', { datum: p.datum || vandag(), program: prog, produk: it.produk, nommer: '', groepe: gs,
        dosis: k === '' ? '' : Number(k), nota: '', diere: lys });
      groepe += gs.length; diere += lys.length;
    });
  });
  p.gekies = {};
  boodskap(groepe ? diere + ' skape in ' + groepe + (groepe === 1 ? ' groep' : ' groepe') + ' aangeteken. Mê!' : 'Niks gemerk nie.');
  App.herteken();
}

/* ---------- Lamseisoen ---------- */

function lamRekordSeisoen(a, o) { const x = lamSeisoenVir(a, o['Geboorte Datum']); return x ? x.naam : 'Onbekend'; }

Skerms.lamseisoen = function (p) {
  const a = Afgelei.get();
  const opsies = {};
  a.lam.forEach(function (o) {
    const x = lamSeisoenVir(a, o['Geboorte Datum']);
    if (x) opsies[x.naam] = x;
  });
  const nou = seisoeneOp(a).filter(function (x) { return x.tipe === 'Lam'; })[0] || lamSeisoenVir(a, vandag());
  if (nou) opsies[nou.naam] = nou;
  const lys = Object.keys(opsies).map(function (k) { return opsies[k]; }).sort(function (x, y) { return y.begin.localeCompare(x.begin); });
  if (!p.s || !opsies[p.s]) p.s = lys.length ? lys[0].naam : '';
  const sz = opsies[p.s];
  const rye = a.lam.filter(function (o) { return sz && lamRekordSeisoen(a, o) === sz.naam; })
    .sort(function (x, y) { return String(y['Geboorte Datum']).localeCompare(String(x['Geboorte Datum'])) || getal(y['Lam Nommer']) - getal(x['Lam Nommer']); });

  const isDood = function (o) { return o.Kondisie === 'Dood gebore' || o.Kondisie === 'Aborteer'; };
  const lewend = rye.filter(function (o) { return !isDood(o); });
  const sonderNommer = lewend.filter(function (o) { return !sleutelVan(o['Lam Nommer']); }).length;
  const doodGebore = rye.filter(function (o) { return o.Kondisie === 'Dood gebore'; }).length;
  const aborsies = rye.filter(function (o) { return o.Kondisie === 'Aborteer'; }).length;
  const perMa = {};
  rye.forEach(function (o) { const m = sleutelVan(o['Ma Nommer']); if (m) perMa[m] = (perMa[m] || 0) + 1; });
  const ooie = Object.keys(perMa).length;
  const meerlinge = Object.keys(perMa).filter(function (m) { return perMa[m] >= 2; }).length;
  const tel = function (g) { return lewend.filter(function (o) { return o.Groep === g; }).length; };
  const pers = ooie ? Math.round(lewend.length / ooie * 100) : 0;
  const notas = a.seisoenNotas.filter(function (o) { return o.Seisoen === p.s; })
    .sort(function (x, y) { return String(y.Datum).localeCompare(String(x.Datum)); });

  let html = '<div class="kop"><div class="kop-ry"><h1>Lamseisoen</h1>' +
    '<button class="knop-klein" style="margin-left:auto;background:#fff" data-a="vorm" data-w="lam"><i class="ti ti-baby-carriage"></i> Nuwe lam</button></div>' +
    (sz ? '<div class="sub" style="margin-top:6px">' + esc(sz.naam) + ' · ' + periodeTeks(sz) + (nou && nou.naam === sz.naam ? ' · nou aan die gang' : '') + '</div>' : '') + '</div>';
  html += '<div class="inhoud"><div class="skyfies">' + lys.map(function (x) {
    return '<button class="skyf ' + (x.naam === p.s ? 'aan' : '') + '" data-a="ls-kies" data-w="' + esc(x.naam) + '">' + esc(x.naam) + '</button>';
  }).join('') + '</div>';

  html += '<div class="rooster drie">' +
    statTeel('Ooie gelam', ooie, meerlinge ? meerlinge + ' met tweeling+' : '') +
    statTeel('Lammers lewend', lewend.length, ooie ? pers + '% lampersentasie' : '') +
    statTeel('Dood gebore', doodGebore + aborsies, aborsies ? aborsies + ' aborsies' : '', doodGebore + aborsies ? 'var(--rooi)' : '') + '</div>';
  if (lewend.length) html += '<div class="kaart" style="margin-top:10px;font-size:14px;color:var(--teks-2)">' +
    tel('Ooi Lam by MA') + ' ooilammers · ' + tel('Hammel Lam by MA') + ' hammellammers · ' + tel('Hans Lam') + ' hanslammers' +
    (sonderNommer ? ' · <b style="color:var(--oranje-donker)">' + sonderNommer + ' nog sonder nommer</b>' : '') + '</div>';

  html += '<div class="titel">Notas oor die seisoen <small><button class="knop-klein" data-a="vorm" data-w="seisoen_nota" data-n="' + esc(p.s) + '"><i class="ti ti-plus"></i> Nota</button></small></div>' +
    '<div class="lys">' + (notas.length ? notas.map(function (o) {
      return '<div class="rek"><div class="bo"><span>' + esc(o.Nota) + '</span><span class="dt">' + kortDatum(o.Datum) + '</span></div></div>';
    }).join('') : '<div class="leeg">Nog geen notas nie. Hoe het die seisoen afgeloop?</div>') + '</div>';

  html += '<div class="titel">Geboortes <small>' + rye.length + ' rekords</small></div><div class="lys">' +
    (rye.length ? rye.map(function (o) {
      const ln = sleutelVan(o['Lam Nommer']);
      const dood = isDood(o);
      const d = ln ? a.diere[ln] : null;
      const soort = o.Groep === 'Ooi Lam by MA' ? 'Ooilam' : o.Groep === 'Hammel Lam by MA' ? 'Hammellam' : o.Groep === 'Hans Lam' ? 'Hanslam' : (o.Groep || 'Lam');
      const sub = ['Ma ' + (o['Ma Nommer'] || '?'), mooiDatum(o['Geboorte Datum']), o.Pa ? 'Pa ' + o.Pa : '', o['Ooi Probleem']].filter(Boolean).join(' · ');
      if (dood) return '<div class="lys-ry"><span class="nommer uit">—</span><span class="hoof"><b>' + esc(o.Kondisie) + '</b><div class="s">' + esc(sub) + '</div></span><span class="pil rooi">Dood</span></div>';
      if (!ln) return '<div class="lys-ry"><span class="nommer lam">?</span><span class="hoof"><b>' + esc(o.Groep ? soort : 'Lam') + '</b>' +
        (o.Kondisie && o.Kondisie !== 'Mooi' ? ' <span class="pil oranje">' + esc(o.Kondisie) + '</span>' : '') + '<div class="s">' + esc(sub) + '</div></span><span class="pil grys">Geen nommer</span></div>';
      return '<button class="lys-ry" data-a="dier" data-w="' + esc(ln) + '"><span class="nommer lam">' + esc(ln) + '</span><span class="hoof"><b>' + esc(soort) + '</b>' +
        (o.Kondisie && o.Kondisie !== 'Mooi' ? ' <span class="pil oranje">' + esc(o.Kondisie) + '</span>' : '') + '<div class="s">' + esc(sub) + '</div></span>' +
        (d ? statusPil(d) : '') + '<i class="ti ti-chevron-right"></i></button>';
    }).join('') : '<div class="leeg">Nog geen lammers in hierdie seisoen nie.</div>') + '</div>';
  return html + '</div>';
};

function statTeel(etiketT, getalT, sub, kleur) {
  return '<div class="kaart stat"><div class="etiket">' + esc(etiketT) + '</div><div class="getal"' + (kleur ? ' style="color:' + kleur + '"' : '') + '>' + getalT + '</div>' +
    (sub ? '<div class="klein" style="color:var(--teks-2)">' + esc(sub) + '</div>' : '') + '</div>';
}

/* ---------- Siek groep ---------- */

Skerms.siekgroep = function (p) {
  const a = Afgelei.get();
  const o = a.siek.find(function (x) { return x._r === Number(p.r); });
  if (!o) return kop('Siek groep') + '<div class="inhoud"><div class="leeg">Hierdie rekord is nie meer daar nie.</div></div>';
  const groep = o.Groep || 'Groep';
  const oop = o.Status === 'Siek' || o.Status === 'Onder behandeling';
  const lede = groep === 'Alle groepe' ? aktieweDiere(a) : inGroepe(a, [groep]);
  const begin = plusDae(o.Datum || vandag(), -7);
  const spuit = a.spuit.filter(function (s) {
    if (s.Bron === 'Siek diere ry ' + o._r) return true;
    if (String(s.Datum) < begin) return false;
    if (sleutelVan(s.Nommer)) return false;
    return groep === 'Alle groepe' || s[groep] === true || (', ' + String(s['Teiken groepe'] || '') + ',').indexOf(', ' + groep + ',') >= 0;
  }).sort(function (x, y) { return String(y.Datum).localeCompare(String(x.Datum)); });
  const ander = a.siek.filter(function (x) { return x._r !== o._r && !sleutelVan(x.Nommer) && x.Groep === groep; })
    .sort(function (x, y) { return String(y.Datum).localeCompare(String(x.Datum)); });

  let html = '<div class="kop"><div class="kop-terug"><button data-a="terug" aria-label="Terug"><i class="ti ti-arrow-left"></i></button>' +
    '<div><h1>' + esc(groep) + '</h1><div class="sub">Siek groep · ' + lede.length + (lede.length === 1 ? ' dier' : ' diere') + '</div></div><span style="margin-left:auto">' +
    (o.Status === 'Siek' ? '<span class="pil rooi">Siek</span>' : o.Status === 'Onder behandeling' ? '<span class="pil oranje">Behandeling</span>' : '<span class="pil groen">' + esc(o.Status || '') + '</span>') + '</span></div></div>';
  html += '<div class="inhoud"><div class="titel">Siekte</div><div class="kaart feite">' + [
    ['Probleem', o['Probleem/Simptome'] || '—'], ['Sedert', mooiDatum(o.Datum) || '—'], ['Status', o.Status || '—'], ['Wat is gedoen', o.Aksie || '—'],
    ['Produk', o['Produk gespuit'] || '—'], ['Dosis', o['Dosis (ml)'] !== '' && o['Dosis (ml)'] !== undefined ? syferTeks(o['Dosis (ml)']) + ' ml' : '—'],
  ].concat(o['Gesond/Dood Datum'] ? [[o.Status === 'Dood' ? 'Dood op' : 'Gesond op', mooiDatum(o['Gesond/Dood Datum'])]] : []).map(function (f) {
    return '<div class="feit"><div class="e">' + esc(f[0]) + '</div><div class="w">' + esc(f[1]) + '</div></div>';
  }).join('') + '</div>';
  if (oop && o._r > 0) html += '<button class="knop" style="margin-top:12px" data-a="gesond" data-w="' + o._r + '" data-g="' + esc(groep) + '"><i class="ti ti-heart"></i> Merk die groep gesond</button>';
  else if (oop) html += '<div class="inligting oranje" style="margin-top:12px"><i class="ti ti-cloud-upload"></i><span>Hierdie rekord wag nog om na die sheet gestuur te word. Jy kan dit gesond merk sodra dit gestoor is.</span></div>';
  html += afdeling('Spuit', spuit, function (s) {
    return '<div class="rek"><div class="bo"><b>' + esc(s.Produk) + '</b><span class="dt">' + mooiDatum(s.Datum) + '</span></div>' +
      '<div class="s">' + esc([s.Program, s['Dosis (ml)'] !== '' && s['Dosis (ml)'] !== undefined ? syferTeks(s['Dosis (ml)']) + ' ml' : '', s['Aantal diere'] ? s['Aantal diere'] + ' diere' : '', s.Nota].filter(Boolean).join(' · ')) + '</div></div>';
  });
  if (ander.length) html += afdeling('Vorige siektes in die groep', ander, function (x) {
    return '<button class="rek" style="display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--lyn);cursor:pointer" data-a="siekgroep" data-w="' + x._r + '"><div class="bo"><b>' + esc(x['Probleem/Simptome'] || 'Siek') + '</b><span class="dt">' + mooiDatum(x.Datum) + '</span></div><div class="s">' + esc(x.Status || '') + '</div></button>';
  });
  html += '<div class="titel">Diere in die groep <small>' + lede.length + '</small></div><div class="lys">' +
    (lede.length ? lede.slice(0, 200).map(function (d) { return dierRy(d); }).join('') : '<div class="leeg">Geen diere nie.</div>') + '</div>';
  return html + '</div>';
};

/* ---------- Sterftes ---------- */

Skerms.sterftes = function (p) {
  const a = Afgelei.get();
  const jare = {};
  a.sterftes.forEach(function (o) { if (o.datum) jare[o.datum.slice(0, 4)] = true; });
  jare[vandag().slice(0, 4)] = true;
  const lys = Object.keys(jare).sort().reverse();
  if (!p.jaar) p.jaar = vandag().slice(0, 4);
  const rye = a.sterftes.filter(function (o) { return p.jaar === 'Alle' || String(o.datum).slice(0, 4) === p.jaar; });
  const tel = function (s) { return rye.filter(function (o) { return o.soort === s; }).length; };
  let html = kop('Sterftes', 'Jongste bo') + '<div class="inhoud"><div class="skyfies">' + lys.concat(['Alle']).map(function (j) {
    return '<button class="skyf ' + (j === p.jaar ? 'aan' : '') + '" data-a="st-jaar" data-w="' + j + '">' + j + '</button>';
  }).join('') + '</div>';
  html += '<div class="rooster drie">' + statTeel('Volwasse', tel('Volwasse'), '', tel('Volwasse') ? 'var(--rooi)' : '') +
    statTeel('Lammers', tel('Lam'), 'na geboorte', tel('Lam') ? 'var(--rooi)' : '') +
    statTeel('Dood gebore', tel('Dood gebore') + tel('Aborteer'), tel('Aborteer') ? tel('Aborteer') + ' aborsies' : '', tel('Dood gebore') + tel('Aborteer') ? 'var(--rooi)' : '') + '</div>';
  html += '<div class="titel">Rekords <small>' + rye.length + '</small></div><div class="lys">' + (rye.length ? rye.map(function (o) {
    const sub = [mooiDatum(o.datum) || 'Datum onbekend', o.ma ? 'Ma ' + o.ma : o.groep, o.rede].filter(Boolean).join(' · ');
    if (o.n) return '<button class="lys-ry" data-a="dier" data-w="' + esc(o.n) + '"><span class="nommer uit">' + esc(o.n) + '</span><span class="hoof"><b>' + esc(o.soort === 'Lam' ? 'Lam' : 'Volwasse') + '</b><div class="s">' + esc(sub) + '</div></span><i class="ti ti-chevron-right"></i></button>';
    return '<div class="lys-ry"><span class="nommer uit">—</span><span class="hoof"><b>' + esc(o.soort) + '</b><div class="s">' + esc(sub) + '</div></span></div>';
  }).join('') : '<div class="leeg">Geen sterftes nie. Mê!</div>') + '</div>';
  return html + '</div>';
};

/* ---------- Siekte-inligting ---------- */

Skerms.siektes = function (p) {
  const a = Afgelei.get();
  const q = String(p.q || '').toLowerCase();
  const lys = a.siektes.filter(function (o) { return !q || [o.Siekte, o.Simptome, o.Seisoen, o['Spuitstof voorstelle']].join(' ').toLowerCase().indexOf(q) >= 0; });
  let html = '<div class="kop"><div class="kop-terug"><button data-a="terug" aria-label="Terug"><i class="ti ti-arrow-left"></i></button>' +
    '<div><h1>Siekte-inligting</h1><div class="sub">Simptome, seisoen en spuitstof</div></div></div>' +
    '<div class="soek"><i class="ti ti-search"></i><input id="siekte-q" data-a="siekte-soek" autocomplete="off" placeholder="Soek siekte of simptoom" value="' + esc(p.q || '') + '"></div></div>';
  html += '<div class="inhoud"><button class="knop tweede" data-a="vorm" data-w="siekte"><i class="ti ti-plus"></i> Nuwe siekte</button>';
  html += '<div style="display:flex;flex-direction:column;gap:10px;margin-top:14px">' + (lys.length ? lys.map(function (o) {
    const veld = function (t, w) { return w ? '<div style="margin-top:8px"><div class="e" style="font-size:12px;color:var(--teks-2)">' + t + '</div><div style="font-size:15px;white-space:pre-wrap">' + esc(w) + '</div></div>' : ''; };
    return '<div class="kaart"><div style="display:flex;align-items:center;gap:8px"><b style="font-size:17px;flex:1">' + esc(o.Siekte) + '</b>' +
      (o.Seisoen ? '<span class="pil oranje">' + esc(o.Seisoen) + '</span>' : '') +
      (o._r > 0 ? '<button class="knop-klein" data-a="siekte-wysig" data-w="' + o._r + '"><i class="ti ti-pencil"></i></button>' : '') + '</div>' +
      veld('Simptome', o.Simptome) + veld('Spuitstof voorstelle', o['Spuitstof voorstelle']) + veld('Nota', o.Nota) + '</div>';
  }).join('') : '<div class="lys"><div class="leeg">' + (q ? 'Niks gevind nie.' : 'Nog geen siektes nie. Voeg die eerste een by.') + '</div></div>') + '</div>';
  return html + '</div>';
};

/* ---------- Verkoop en skenkings (net eienaar) ---------- */

Skerms.verkoopblad = function (p) {
  const a = Afgelei.get();
  if (!isEienaar()) return kop('Verkoop') + '<div class="inhoud"><div class="leeg">Net die eienaar het toegang hiertoe.</div></div>';
  const oortjie = p.oortjie || 'Verkope';
  const jaar = vandag().slice(0, 4);
  let html = kop('Verkoop en skenkings') + '<div class="inhoud"><div class="skyfies">' + ['Verkope', 'Skenkings'].map(function (x) {
    return '<button class="skyf ' + (x === oortjie ? 'aan' : '') + '" data-a="vk-oortjie" data-w="' + x + '">' + x + '</button>';
  }).join('') + '</div>';
  if (oortjie === 'Verkope') {
    const rye = a.verkoop.slice().sort(function (x, y) { return String(y.Date).localeCompare(String(x.Date)); });
    const hierdie = rye.filter(function (o) { return String(o.Date).slice(0, 4) === jaar; });
    const som = hierdie.reduce(function (t, o) { return t + getal(o.Prys); }, 0);
    html += '<div class="rooster">' + statTeel('Verkoop in ' + jaar, hierdie.length, 'skape') + statTeel('Inkomste ' + jaar, 'R ' + Math.round(som).toLocaleString('af-ZA'), '') + '</div>';
    html += '<button class="knop" style="margin-top:12px" data-a="vorm" data-w="verkoop"><i class="ti ti-cash"></i> Nuwe verkoop</button>';
    html += '<div class="titel">Verkope <small>' + rye.length + '</small></div><div class="lys">' + (rye.length ? rye.map(function (o) {
      return '<button class="lys-ry" data-a="dier" data-w="' + esc(o.Nommer) + '"><span class="nommer uit">' + esc(o.Nommer) + '</span><span class="hoof"><b>' + esc(o['Aan Wie'] || 'Verkoop') + '</b>' +
        '<div class="s">' + esc([mooiDatum(o.Date), o.Gewig ? o.Gewig + ' kg' : '', o['R/kg'] ? 'R' + o['R/kg'] + '/kg' : ''].filter(Boolean).join(' · ')) + '</div></span>' +
        (o.Prys !== '' && o.Prys !== undefined ? '<b>R ' + esc(o.Prys) + '</b>' : '') + (o.Paid === true ? '' : ' <span class="pil oranje">Onbetaal</span>') + '</button>';
    }).join('') : '<div class="leeg">Nog geen verkope nie.</div>') + '</div>';
  } else {
    const rye = a.skenkings.slice().sort(function (x, y) { return String(y.Datum).localeCompare(String(x.Datum)); });
    html += '<div class="inligting"><i class="ti ti-gift"></i><span>Skape wat jy weggegee het. Hulle word uit die kudde gehaal, maar hul geskiedenis bly bewaar.</span></div>';
    html += '<button class="knop" style="margin-top:12px" data-a="vorm" data-w="skenking"><i class="ti ti-gift"></i> Nuwe skenking</button>';
    html += '<div class="titel">Skenkings <small>' + rye.length + '</small></div><div class="lys">' + (rye.length ? rye.map(function (o) {
      return '<button class="lys-ry" data-a="dier" data-w="' + esc(o.Nommer) + '"><span class="nommer uit">' + esc(o.Nommer) + '</span><span class="hoof"><b>' + esc(o['Aan Wie'] || 'Geskenk') + '</b>' +
        '<div class="s">' + esc([mooiDatum(o.Datum), o.Rede, o.Nota].filter(Boolean).join(' · ')) + '</div></span><i class="ti ti-chevron-right"></i></button>';
    }).join('') : '<div class="leeg">Nog geen skenkings nie.</div>') + '</div>';
  }
  return html + '</div>';
};

/* ---------- Skeer en wol ---------- */

Skerms.skeerblad = function (p) {
  const a = Afgelei.get();
  const jaar = vandag().slice(0, 4);
  const hierdie = a.skeer.filter(function (o) { return String(o.Datum).slice(0, 4) === jaar; });
  const geskeer = hierdie.reduce(function (t, o) { return t + getal(o['Aantal geskeer']); }, 0);
  const oop = a.wol.filter(function (o) { return !o['Gestuur na BKB']; });
  const kg = function (lys) { return lys.reduce(function (t, o) { return t + getal(o['Gewig (kg)']); }, 0); };
  // Totale per tipe wol: op die plaas en gestuur
  const tipes = {};
  a.wol.forEach(function (o) {
    const t = o['Tipe wol'] || 'Onbekend';
    tipes[t] = tipes[t] || { bale: 0, kg: 0, oopBale: 0, oopKg: 0 };
    tipes[t].bale++; tipes[t].kg += getal(o['Gewig (kg)']);
    if (!o['Gestuur na BKB']) { tipes[t].oopBale++; tipes[t].oopKg += getal(o['Gewig (kg)']); }
  });
  let html = kop('Skeer en wol', 'Skeerdatums, wolbale en BKB') + '<div class="inhoud">';
  html += '<div class="rooster drie">' + statTeel('Geskeer ' + jaar, geskeer, hierdie.length + (hierdie.length === 1 ? ' keer' : ' keer')) +
    statTeel('Bale op plaas', oop.length, syferTeks(kg(oop)) + ' kg') + statTeel('Wol totaal', syferTeks(kg(a.wol)), 'kg · ' + a.wol.length + ' bale') + '</div>';
  html += '<div class="rooster" style="margin-top:12px">' +
    '<button class="aksie" data-a="vorm" data-w="skeer">' + ikoon('scissors') + '<span class="n">Nuwe skeer</span></button>' +
    '<button class="aksie" data-a="vorm" data-w="wolbaal">' + ikoon('package', 'oranje') + '<span class="n">Wolbaal byvoeg</span></button></div>';
  if (oop.length) html += '<button class="knop" style="margin-top:10px" data-a="vorm" data-w="wol_stuur"><i class="ti ti-truck"></i> Stuur bale na BKB (' + oop.length + ' wag)</button>';

  html += '<div class="titel">Wol per tipe</div><div class="lys">' + (Object.keys(tipes).length ? Object.keys(tipes).sort().map(function (t) {
    const x = tipes[t];
    return '<div class="lys-ry">' + ikoon('package', 'oranje') + '<span class="hoof"><b>' + esc(t) + '</b><div class="s">' + x.bale + (x.bale === 1 ? ' baal' : ' bale') + ' · ' + syferTeks(x.kg) + ' kg totaal</div></span>' +
      (x.oopBale ? '<span class="pil oranje">' + x.oopBale + ' op plaas · ' + syferTeks(x.oopKg) + ' kg</span>' : '<span class="pil groen">Alles gestuur</span>') + '</div>';
  }).join('') : '<div class="leeg">Nog geen wolbale nie.</div>') + '</div>';

  const stuurDatums = [];
  a.wol.forEach(function (o) { const d = o['Gestuur na BKB']; if (d && stuurDatums.indexOf(d) < 0) stuurDatums.push(d); });
  stuurDatums.sort().reverse();
  if (stuurDatums.length) html += '<div class="titel">Afleweringsbewyse</div><div class="lys">' + stuurDatums.map(function (d) {
    const b = a.wol.filter(function (o) { return o['Gestuur na BKB'] === d; });
    return '<button class="lys-ry" data-a="bewys" data-w="' + esc(d) + '">' + ikoon('truck') + '<span class="hoof"><b>' + esc(mooiDatum(d)) + '</b><div class="s">' +
      b.length + (b.length === 1 ? ' baal' : ' bale') + ' · ' + syferTeks(kg(b)) + ' kg</div></span><i class="ti ti-chevron-right"></i></button>';
  }).join('') + '</div>';

  html += afdeling('Skeer', a.skeer, function (o) {
    return '<div class="rek"><div class="bo"><b>' + esc(o['Aantal geskeer'] !== '' ? o['Aantal geskeer'] + ' geskeer' : 'Geskeer') + '</b><span class="dt">' + mooiDatum(o.Datum) + '</span></div>' +
      '<div class="s">' + esc([o.Groepe, o.Nota].filter(Boolean).join(' · ')) + '</div></div>';
  });
  html += afdeling('Wolbale', a.wol, function (o) {
    return '<div class="rek"><div class="bo"><b>Baal ' + esc(o['Baal Nr'] || '?') + ' · ' + esc(o['Tipe wol']) + '</b><span class="dt">' + syferTeks(o['Gewig (kg)']) + ' kg</span></div>' +
      '<div class="s">' + esc(['Gepak ' + mooiDatum(o.Datum), o['Gestuur na BKB'] ? 'Gestuur na BKB ' + mooiDatum(o['Gestuur na BKB']) : 'Nog op die plaas', o.Nota].filter(Boolean).join(' · ')) + '</div></div>';
  });
  return html + '</div>';
};


/* ---------- Afleweringsbewys vir wolbale (druk of stoor as PDF) ---------- */
const BEWYS_VELDE = [['produsent', 'Produsent nr'], ['plaas', 'Naam / plaas'], ['bestuurder', 'Afgelewer deur (bestuurder)'], ['voertuig', 'Voertuig registrasie']];
Skerms.afleweringsbewys = function (p) {
  const a = Afgelei.get();
  const bale = a.wol.filter(function (o) {
    return p.rye && p.rye.length ? p.rye.indexOf(o._r) >= 0 : o['Gestuur na BKB'] === p.datum;
  }).sort(function (x, y) { return getal(x['Baal Nr']) - getal(y['Baal Nr']); });
  const totaal = bale.reduce(function (t, o) { return t + getal(o['Gewig (kg)']); }, 0);
  const klasse = {};
  bale.forEach(function (o) { const t = o['Tipe wol'] || '—'; klasse[t] = klasse[t] || { n: 0, kg: 0 }; klasse[t].n++; klasse[t].kg += getal(o['Gewig (kg)']); });
  const w = function (k) { return Berg.lees('bewys_' + k, ''); };
  const lyn = function (k) { return '<span class="bw-lyn" data-bewys-uit="' + k + '">' + esc(w(k) || '') + '</span>'; };

  let html = '<div class="geen-druk">' + kop('Afleweringsbewys', 'Wolbale na BKB') + '</div><div class="inhoud">';
  html += '<div class="geen-druk"><div class="inligting"><i class="ti ti-info-circle"></i><span>Vul jou besonderhede in (die app onthou dit), druk dan <b>Druk of stoor as PDF</b>. Laat BKB teken by ontvangs.</span></div>' +
    BEWYS_VELDE.map(function (f) {
      return '<div class="veld"><label for="bw-' + f[0] + '">' + f[1] + '</label><input class="inv" id="bw-' + f[0] + '" data-bewys="' + f[0] + '" autocomplete="off" value="' + esc(w(f[0])) + '"></div>';
    }).join('') +
    '<button class="knop" data-a="druk" style="margin:4px 0 8px"><i class="ti ti-printer"></i> Druk of stoor as PDF</button>' +
    '<button class="knop sekondêr" data-a="deel-bewys" style="margin-bottom:16px"><i class="ti ti-share"></i> Deel as boodskap</button></div>';

  html += '<div class="bewys">' +
    '<div class="bw-kop"><div><div class="bw-titel">AFLEWERINGSBEWYS – WOLBALE</div><div class="bw-sub">Afgelewer by BKB</div></div>' +
    '<div class="bw-dt">' + esc(langDatum(p.datum) || p.datum) + '</div></div>' +
    '<table class="bw-inf"><tr><td>Produsent nr</td><td>' + lyn('produsent') + '</td></tr><tr><td>Naam / plaas</td><td>' + lyn('plaas') + '</td></tr>' +
    '<tr><td>Afgelewer deur</td><td>' + lyn('bestuurder') + '</td></tr><tr><td>Voertuig</td><td>' + lyn('voertuig') + '</td></tr></table>' +
    '<table class="bw-tab"><thead><tr><th>Baal nr</th><th>Klas</th><th class="r">Gewig (kg)</th><th class="m">Ontvang ✓</th></tr></thead><tbody>' +
    (bale.length ? bale.map(function (o) {
      return '<tr><td>' + esc(o['Baal Nr'] || '?') + '</td><td>' + esc(o['Tipe wol'] || '') + '</td><td class="r">' + syferTeks(getal(o['Gewig (kg)'])) + '</td><td class="m"></td></tr>';
    }).join('') : '<tr><td colspan="4">Geen bale vir hierdie datum nie.</td></tr>') +
    '</tbody><tfoot><tr><td colspan="2">Totaal: ' + bale.length + (bale.length === 1 ? ' baal' : ' bale') + '</td><td class="r">' + syferTeks(totaal) + '</td><td></td></tr></tfoot></table>' +
    '<div class="bw-opsom"><b>Per klas:</b> ' + Object.keys(klasse).map(function (k) { return esc(k) + ' ' + klasse[k].n + ' (' + syferTeks(klasse[k].kg) + ' kg)'; }).join(' · ') + '</div>' +
    '<div class="bw-teken">' +
    '<div><div class="bw-th">Afgelewer deur</div><div class="bw-reel">Naam</div><div class="bw-reel">Handtekening</div><div class="bw-reel">Datum en tyd</div></div>' +
    '<div><div class="bw-th">Ontvang deur (BKB)</div><div class="bw-reel">Naam</div><div class="bw-reel">Handtekening</div><div class="bw-reel">Datum en tyd</div><div class="bw-stempel">Stempel</div></div>' +
    '</div><div class="bw-voet">Opgestel met Skaap se Praat · Opmerkings: ____________________________________________</div></div>';
  return html + '</div>';
};

function bewysTeks(p) {
  const a = Afgelei.get();
  const bale = a.wol.filter(function (o) { return p.rye && p.rye.length ? p.rye.indexOf(o._r) >= 0 : o['Gestuur na BKB'] === p.datum; })
    .sort(function (x, y) { return getal(x['Baal Nr']) - getal(y['Baal Nr']); });
  const totaal = bale.reduce(function (t, o) { return t + getal(o['Gewig (kg)']); }, 0);
  const w = function (k) { return Berg.lees('bewys_' + k, ''); };
  return ['Afleweringsbewys – wolbale na BKB', 'Datum: ' + (langDatum(p.datum) || p.datum),
    w('produsent') ? 'Produsent nr: ' + w('produsent') : '', w('plaas') ? 'Naam/plaas: ' + w('plaas') : '',
    w('bestuurder') ? 'Afgelewer deur: ' + w('bestuurder') : '', w('voertuig') ? 'Voertuig: ' + w('voertuig') : '', '']
    .filter(function (x, i) { return x !== '' || i === 6; })
    .concat(bale.map(function (o) { return 'Baal ' + (o['Baal Nr'] || '?') + ' · ' + (o['Tipe wol'] || '') + ' · ' + syferTeks(getal(o['Gewig (kg)'])) + ' kg'; }))
    .concat(['', 'Totaal: ' + bale.length + ' bale · ' + syferTeks(totaal) + ' kg']).join('\n');
}
