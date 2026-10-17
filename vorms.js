/* Skaap se Praat – vorms */
'use strict';

function syfer(v) {
  if (v === '' || v === null || v === undefined) return '';
  const x = Number(String(v).replace(',', '.').trim());
  return isNaN(x) ? NaN : x;
}

function getalVeld(veld, waarde, etiket, eenheid, plekhouer) {
  return '<div class="veld"><label for="v-' + veld + '">' + etiket + (eenheid ? ' (' + eenheid + ')' : '') + '</label>' +
    '<input class="inv" id="v-' + veld + '" data-v="' + veld + '" inputmode="decimal" autocomplete="off" value="' + esc(waarde === undefined ? '' : waarde) + '" placeholder="' + esc(plekhouer || '') + '"></div>';
}
function teksVeld(veld, waarde, etiket, plekhouer, groot) {
  return '<div class="veld"><label for="v-' + veld + '">' + etiket + '</label>' +
    (groot ? '<textarea class="inv" id="v-' + veld + '" data-v="' + veld + '" placeholder="' + esc(plekhouer || '') + '">' + esc(waarde || '') + '</textarea>'
      : '<input class="inv" id="v-' + veld + '" data-v="' + veld + '" autocomplete="off" value="' + esc(waarde || '') + '" placeholder="' + esc(plekhouer || '') + '">') + '</div>';
}
function keuseVeld(veld, waarde, etiket, opsies, leeg) {
  return '<div class="veld"><label for="v-' + veld + '">' + etiket + '</label><select class="inv" id="v-' + veld + '" data-v="' + veld + '" data-her="1">' +
    (leeg !== undefined ? '<option value="">' + esc(leeg) + '</option>' : '') +
    opsies.map(function (o) { const w = typeof o === 'string' ? o : o.w, t = typeof o === 'string' ? o : o.t;
      return '<option value="' + esc(w) + '"' + (w === waarde ? ' selected' : '') + '>' + esc(t) + '</option>'; }).join('') + '</select></div>';
}
function skakelVeld(veld, aan, teks) {
  return '<div class="skakel ' + (aan ? 'aan' : '') + '" data-a="kies" data-veld="' + veld + '" data-w="__wissel">' +
    '<span>' + esc(teks) + '</span><span class="sw"></span></div>';
}
function etiket(t) { return '<div class="veld"><span class="etiket">' + t + '</span>'; }

/* Spuit Program-ry (rou, want die "Dosis (ml)"-kolomme het almal dieselfde naam) */
function programInligting(a, program, produk) {
  const t = a.data['Spuit Program'];
  if (!t) return null;
  const ry = t.rye.find(function (r) { return r.w[0] === program && String(r.w[1]).trim() === produk; });
  if (!ry) return null;
  const groepe = [], dosisse = {};
  GROEPE.forEach(function (g) {
    const k = t.kop.indexOf(g);
    if (k >= 0 && ry.w[k] === true) { groepe.push(g); dosisse[g] = ry.w[k + 1]; }
  });
  return { groepe: groepe, dosisse: dosisse, beskrywing: ry.w[t.kop.indexOf('Beskrywing')] || '', onttrekking: ry.w[t.kop.indexOf('Onttrekking (dae)')] };
}
function produkteVir(a, program) {
  if (!program || program === 'Buite Program') return a.produkte;
  const lys = [];
  a.program.forEach(function (o) { const p = String(o.Produk).trim(); if (o.Program === program && lys.indexOf(p) < 0) lys.push(p); });
  return lys;
}

const VORM_TITELS = { byvoeg: 'Skaap byvoeg', lam: 'Nuwe lam', spuit: 'Spuit', siek: 'Siek skaap', weeg: 'Weeg', nota: 'Nota',
  uit: 'Dood of verkoop', verkoop: 'Verkoop', skuif: 'Skuif na ander groep', speen: 'Speen lam', gesond: 'Merk gesond',
  groepskuif: 'Skuif \'n groep', bestelling: 'Nuwe bestelling', bestelling_oop: 'Bestelling',
  produk: 'Produk byvoeg', siekte: 'Siekte-inligting', seisoen_nota: 'Nota oor die seisoen', skenking: 'Skenking' };

// Die gewone volgende groep vir elke groep.
const VOLGENDE_GROEP = { 'Ooi Lam by MA': 'Gespeende Ooi Lam', 'Hammel Lam by MA': 'Gespeende Hammel Lam',
  'Gespeende Ooi Lam': 'Groot Ooi', 'Hans Lam': '' };
function geslagVirGroep(g) {
  if (g === 'Groot Ooi' || g === 'Gespeende Ooi Lam' || g === 'Ooi Lam by MA') return 'Ooi';
  if (g === 'Gespeende Hammel Lam' || g === 'Hammel Lam by MA') return 'Hammel';
  if (g === 'Ram') return 'Ram';
  return '';
}
function lede(a, groep) { return aktieweDiere(a).filter(function (d) { return d.groep === groep; }); }

// Lamseisoen-name rondom vandag (en die huidige keuse).
function lamSeisoenOpsies(a, huidig) {
  const j = Number(vandag().slice(0, 4));
  const lys = [];
  a.seisoene.filter(function (x) { return x.tipe === 'Lam'; }).forEach(function (def) {
    [j - 1, j].forEach(function (y) { lys.push(seisoenIn(def, y)); });
  });
  lys.sort(function (x, y) { return y.begin.localeCompare(x.begin); });
  const name = lys.map(function (x) { return x.naam; });
  if (huidig && name.indexOf(huidig) < 0) name.unshift(huidig);
  return name;
}

const Vorms = {
  begin(tipe, n) {
    const a = Afgelei.get();
    const d = n ? a.diere[sleutelVan(n)] : null;
    const v = { datum: vandag() };
    switch (tipe) {
      case 'byvoeg': return Object.assign(v, { nommer: n || vryNommers(a, 1)[0], geslag: 'Ooi', groep: 'Groot Ooi', herkoms: 'Reeds op plaas', geboorte: '', ouderdom: '' });
      case 'lam': return Object.assign(v, { ma: d && !d.lam ? d.n : '', pa: '', seisoen: seisoenVir(vandag()), aantal: 1,
        l0_kondisie: 'Mooi', l0_groep: 'Ooi Lam by MA', droog: false, rekordNota: '' });
      case 'spuit': return Object.assign(v, { program: '', produk: '', wie: d ? 'Een dier' : 'Groep', groepe: [], nommer: d ? d.n : '', dosis: '', nota: '' });
      case 'siek': return Object.assign(v, { wie: 'Een dier', nommer: d ? d.n : '', groep: '', probleem: '', aksie: '', status: 'Siek', produk: '', dosis: '' });
      case 'weeg': return Object.assign(v, { nommer: d ? d.n : '', gewig: '', rede: d && d.lam ? 'Speen' : 'Gewone weging', reeks: !d });
      case 'nota': return Object.assign(v, { nommer: d ? d.n : '', nota: '' });
      case 'uit': return Object.assign(v, { nommer: d ? d.n : '', tipe: 'Dood', rede: '', aanWie: '', prys: '', gewig: '', betaal: false });
      case 'verkoop': return Object.assign(v, { tipe: 'Verkoop', nommer: d ? d.n : '', aanWie: '', prys: '', gewig: '', betaal: false });
      case 'skuif': return Object.assign(v, { nommer: d ? d.n : '', groep: d ? d.groep : '', rede: '', gereed: d && d.gereed ? d.gereed : 'Nie gereed' });
      case 'bestelling': return Object.assign(v, { naam: '', kontak: '', wanneer: '', aantal: '', wat: '', nota: '' });
      case 'groepskuif': return Object.assign(v, { van: '', na: '', gekies: [], gereed: 'Nie gereed' });
      case 'produk': return Object.assign(v, { program: n || 'Feb Spuit Program', produk: '', beskrywing: '', onttrekking: '', ouderdom: '', groepe: [] });
      case 'siekte': {
        const o = n ? a.siektes.find(function (x) { return x._r === Number(n); }) : null;
        return Object.assign(v, { ry: o ? o._r : 0, siekte: o ? o.Siekte : '', simptome: o ? o.Simptome || '' : '', seisoen: o ? o.Seisoen || '' : '',
          spuitstof: o ? o['Spuitstof voorstelle'] || '' : '', nota: o ? o.Nota || '' : '' });
      }
      case 'seisoen_nota': return Object.assign(v, { seisoen: n || '', nota: '' });
      case 'skenking': return Object.assign(v, { nommer: d ? d.n : '', aanWie: '', rede: '', nota: '' });
      case 'speen': return Object.assign(v, { nommer: d ? d.n : '',
        geslag: d && d.geslag ? d.geslag : 'Ooi',
        groep: d && d.geslag === 'Hammel' ? 'Gespeende Hammel Lam' : 'Gespeende Ooi Lam', gewig: '' });
    }
    return v;
  },

  kies(p, veld, w) {
    const v = p.vorm;
    if (w === '__wissel') v[veld] = !v[veld];
    else if (Array.isArray(v[veld])) {
      const i = v[veld].indexOf(w);
      if (i >= 0) v[veld].splice(i, 1); else v[veld].push(w);
    } else v[veld] = w;
    p.fout = '';
    // Afhanklike velde
    if (p.tipe === 'byvoeg' && veld === 'geslag') v.groep = w === 'Ram' ? 'Ram' : w === 'Hammel' ? 'Gespeende Hammel Lam' : 'Groot Ooi';
    if (p.tipe === 'speen' && veld === 'geslag') v.groep = w === 'Hammel' ? 'Gespeende Hammel Lam' : w === 'Ram' ? 'Ram' : 'Gespeende Ooi Lam';
    if (p.tipe === 'spuit' && veld === 'program') { v.produk = ''; }
    this.verander(p, veld, w);
    if (p.tipe === 'uit' && veld === 'tipe' && w === 'Verkoop') { /* velde verskyn */ }
    App.herteken();
  },

  // Velde wat ander velde beïnvloed (ook vanaf keuselyste).
  verander(p, veld, w) {
    const v = p.vorm;
    if (p.tipe === 'lam' && veld === 'datum') v.seisoen = seisoenVir(w) || v.seisoen;
    if (p.tipe === 'groepskuif' && veld === 'van') {
      v.na = VOLGENDE_GROEP[w] || '';
      v.gekies = lede(Afgelei.get(), w).map(function (d) { return d.n; });
    }
  },

  aksie(p, w) {
    const v = p.vorm;
    if (w === 'meer' && v.aantal < 3) { v.aantal++; v['l' + (v.aantal - 1) + '_kondisie'] = 'Mooi'; v['l' + (v.aantal - 1) + '_groep'] = 'Ooi Lam by MA'; }
    if (w === 'minder' && v.aantal > 1) v.aantal--;
    if (w === 'almal') v.gekies = lede(Afgelei.get(), v.van).map(function (d) { return d.n; });
    if (w === 'geen') v.gekies = [];
    App.herteken();
  },

  stoor(p) {
    const f = this.kontroleer(p);
    if (f) { p.fout = f; App.herteken(); window.scrollTo(0, 0); return; }
    this.stuur(p);
  },

  kontroleer(p) {
    const a = Afgelei.get();
    const v = p.vorm;
    const bestaan = function (n) { return !!a.diere[sleutelVan(n)]; };
    if (!v.datum && p.tipe !== 'skuif') return 'Kies \'n datum.';
    switch (p.tipe) {
      case 'byvoeg':
        if (!sleutelVan(v.nommer)) return 'Tik die skaap se nommer in.';
        if (a.gebruik[sleutelVan(v.nommer)]) return 'Nommer ' + v.nommer + ' word reeds gebruik. Kies \'n ander nommer.';
        if (!v.groep) return 'Kies \'n groep.';
        if (v.ouderdom !== '' && isNaN(syfer(v.ouderdom))) return 'Ouderdom moet \'n getal wees.';
        return '';
      case 'lam': {
        if (!sleutelVan(v.ma)) return 'Kies die ma.';
        const ma = a.diere[sleutelVan(v.ma)];
        if (!ma || ma.lam || ma.geslag !== 'Ooi') return 'Nommer ' + v.ma + ' is nie \'n ooi in die Register nie.';
        if (v.pa && !bestaan(v.pa)) return 'Pa ' + v.pa + ' is nie in die kudde nie.';
        const gesien = {};
        for (let i = 0; i < v.aantal; i++) {
          const k = v['l' + i + '_kondisie'];
          if (k === 'Dood gebore' || k === 'Aborteer') continue;
          const n = sleutelVan(v['l' + i + '_nommer']);
          if (!n) return 'Lam ' + (i + 1) + ' het nog nie \'n nommer nie.';
          if (a.gebruik[n] || gesien[n]) return 'Nommer ' + n + ' word reeds gebruik.';
          gesien[n] = true;
          if (!v['l' + i + '_groep']) return 'Kies lam ' + (i + 1) + ' se groep.';
        }
        return '';
      }
      case 'spuit':
        if (!v.program) return 'Kies die program.';
        if (!v.produk) return 'Kies die produk.';
        if (v.wie === 'Een dier' && !bestaan(v.nommer)) return 'Kies \'n dier wat in die kudde is.';
        if (v.wie === 'Groep' && !v.groepe.length) return 'Merk ten minste een groep.';
        if (v.dosis !== '' && isNaN(syfer(v.dosis))) return 'Dosis moet \'n getal wees.';
        return '';
      case 'siek':
        if (v.wie === 'Een dier' && !bestaan(v.nommer)) return 'Kies \'n dier wat in die kudde is.';
        if (v.wie === 'Groep' && !v.groep) return 'Kies die groep.';
        if (!v.probleem.trim()) return 'Beskryf die probleem of simptome.';
        if (v.dosis !== '' && isNaN(syfer(v.dosis))) return 'Dosis moet \'n getal wees.';
        return '';
      case 'weeg':
        if (!bestaan(v.nommer)) return 'Kies \'n dier wat in die kudde is.';
        if (!(syfer(v.gewig) > 0)) return 'Tik die gewig in kg in.';
        return '';
      case 'nota':
        if (!bestaan(v.nommer)) return 'Kies \'n dier wat in die kudde is.';
        if (!v.nota.trim()) return 'Skryf die nota.';
        return '';
      case 'uit': case 'verkoop':
        if (!bestaan(v.nommer)) return 'Kies \'n dier wat in die kudde is.';
        if (a.diere[sleutelVan(v.nommer)].uit) return 'Hierdie dier is reeds as ' + a.diere[sleutelVan(v.nommer)].uit.toLowerCase() + ' gemerk.';
        if (v.prys !== '' && isNaN(syfer(v.prys))) return 'Prys moet \'n getal wees.';
        if (v.gewig !== '' && isNaN(syfer(v.gewig))) return 'Gewig moet \'n getal wees.';
        return '';
      case 'skuif':
        if (!v.groep) return 'Kies die nuwe groep.';
        return '';
      case 'bestelling':
        if (!v.naam.trim()) return 'Tik die koper se naam in.';
        if (!v.wanneer) return 'Kies wanneer die koper die skape wil hê.';
        if (v.aantal !== '' && !(syfer(v.aantal) > 0)) return 'Aantal moet \'n getal wees.';
        return '';
      case 'bestelling_oop':
        return '';
      case 'groepskuif':
        if (!v.van) return 'Kies die groep wat moet skuif.';
        if (!v.na) return 'Kies die nuwe groep.';
        if (v.na === v.van) return 'Die nuwe groep is dieselfde as die huidige groep.';
        if (!v.gekies.length) return 'Merk ten minste een dier.';
        return '';
      case 'speen':
        if (v.gewig !== '' && !(syfer(v.gewig) > 0)) return 'Gewig moet \'n getal wees.';
        return '';
      case 'produk': {
        if (!v.program) return 'Kies die program.';
        const naam = v.produk.trim();
        if (!naam) return 'Tik die produk se naam in.';
        if (a.program.some(function (o) { return o.Program === v.program && String(o.Produk).trim().toLowerCase() === naam.toLowerCase(); })) return naam + ' is reeds in die ' + v.program + '.';
        if (v.onttrekking !== '' && isNaN(syfer(v.onttrekking))) return 'Onttrekking moet \'n getal (dae) wees.';
        for (let i = 0; i < v.groepe.length; i++) { const x = v['d_' + GROEPE.indexOf(v.groepe[i])]; if (x !== undefined && x !== '' && isNaN(syfer(x))) return 'Dosis vir ' + v.groepe[i] + ' moet \'n getal wees.'; }
        return '';
      }
      case 'siekte':
        if (!v.siekte.trim()) return 'Tik die siekte se naam in.';
        return '';
      case 'seisoen_nota':
        if (!v.nota.trim()) return 'Skryf die nota.';
        return '';
      case 'skenking':
        if (!bestaan(v.nommer)) return 'Kies \'n dier wat in die kudde is.';
        if (a.diere[sleutelVan(v.nommer)].uit) return 'Hierdie dier is reeds as ' + a.diere[sleutelVan(v.nommer)].uit.toLowerCase() + ' gemerk.';
        if (!v.aanWie.trim()) return 'Aan wie is die skaap geskenk?';
        return '';
    }
    return '';
  },

  stuur(p) {
    const a = Afgelei.get();
    const v = p.vorm;
    const n = sleutelVan(v.nommer);
    switch (p.tipe) {
      case 'byvoeg':
        voegBewerkingBy('skaap_byvoeg', { nommer: n, geslag: v.geslag, groep: v.groep, geboorte: v.geboorte || '',
          ouderdom: v.geboorte ? '' : (v.ouderdom === '' ? '' : syfer(v.ouderdom)), herkoms: v.herkoms, datum: v.datum });
        boodskap('Hallo! Ek is ' + n + ' en ek is nou in die Register.');
        App.gaan('dier', { n: n }, true);
        return;
      case 'lam': {
        const lammers = [];
        let droogGebruik = !v.droog;
        for (let i = 0; i < v.aantal; i++) {
          const k = v['l' + i + '_kondisie'];
          const dood = k === 'Dood gebore' || k === 'Aborteer';
          let probleem = v['l' + i + '_verwerp'] && !dood ? 'Verwerp lam' : '';
          if (!probleem && !droogGebruik) { probleem = 'Droog (geen melk)'; droogGebruik = true; }
          lammers.push({ nommer: dood ? '' : sleutelVan(v['l' + i + '_nommer']), groep: dood ? '' : v['l' + i + '_groep'], kondisie: k, nota: v['l' + i + '_nota'] || '', probleem: probleem });
        }
        if (!droogGebruik && lammers.length) lammers[0].probleem = lammers[0].probleem ? lammers[0].probleem : 'Droog (geen melk)';
        voegBewerkingBy('lam', { ma: sleutelVan(v.ma), pa: sleutelVan(v.pa), datum: v.datum, seisoen: v.seisoen, rekordNota: v.rekordNota, lammers: lammers });
        const lewend = lammers.filter(function (l) { return l.nommer; }).length;
        boodskap(lewend ? 'Welkom klein lammetjie' + (lewend > 1 ? 's' : '') + '! Ooi ' + v.ma + ' is trots.' : 'Aangeteken. Sterkte vir ooi ' + v.ma + '.');
        App.terug();
        return;
      }
      case 'spuit': {
        const diere = v.wie === 'Een dier' ? [n] : inGroepe(a, v.groepe).map(function (d) { return d.n; });
        voegBewerkingBy('spuit', { datum: v.datum, program: v.program, produk: v.produk, nommer: v.wie === 'Een dier' ? n : '',
          groepe: v.wie === 'Groep' ? v.groepe.slice() : [], dosis: syfer(v.dosis), nota: v.nota, diere: diere });
        boodskap(v.wie === 'Een dier' ? 'Dankie, my spuit is aangeteken!' : diere.length + ' skape gespuit en aangeteken. Mê!');
        App.terug();
        return;
      }
      case 'siek': {
        const diere = v.wie === 'Een dier' ? [n] : (v.groep === 'Alle groepe' ? aktieweDiere(a) : inGroepe(a, [v.groep])).map(function (d) { return d.n; });
        voegBewerkingBy('siek', { datum: v.datum, nommer: v.wie === 'Een dier' ? n : '', groep: v.wie === 'Groep' ? v.groep : '',
          probleem: v.probleem.trim(), aksie: v.aksie, status: v.status, produk: v.produk, dosis: syfer(v.dosis), diere: v.produk ? diere : [] });
        boodskap(v.wie === 'Een dier' ? 'Dankie dat jy na my kyk.' : 'Aangeteken vir ' + v.groep + '.');
        App.terug();
        return;
      }
      case 'weeg':
        voegBewerkingBy('weeg', { datum: v.datum, nommer: n, gewig: syfer(v.gewig), rede: v.rede });
        boodskap(n + ': ' + syferTeks(syfer(v.gewig)) + ' kg aangeteken.');
        if (v.reeks) { v.nommer = ''; v.gewig = ''; p.fokus = 'v-nommer'; App.herteken(); }
        else App.terug();
        return;
      case 'nota':
        voegBewerkingBy('nota', { datum: v.datum, nommer: n, nota: v.nota.trim() });
        boodskap('Nota gestoor. Ek sal dit onthou!');
        App.terug();
        return;
      case 'uit': case 'verkoop':
        if (v.tipe === 'Geskenk') {
          voegBewerkingBy('skenking', { datum: v.datum, nommer: n, aanWie: v.aanWie.trim(), rede: (v.rede || '').trim(), nota: '' });
          boodskap('Totsiens! ' + n + ' gaan na ' + (v.aanWie.trim() || 'sy nuwe huis') + '.');
          App.terug();
          return;
        }
        if (v.tipe === 'Verkoop') {
          voegBewerkingBy('verkoop', { datum: v.datum, nommer: n, aanWie: v.aanWie, prys: syfer(v.prys), gewig: syfer(v.gewig), betaal: !!v.betaal });
          boodskap('Totsiens! ' + n + ' is as verkoop aangeteken.');
        } else {
          voegBewerkingBy('uit', { nommer: n, tipe: 'Dood', datum: v.datum, rede: v.rede });
          boodskap(n + ' is as dood aangeteken. Haar/sy geskiedenis bly bewaar.');
        }
        App.terug();
        return;
      case 'skuif':
        voegBewerkingBy('groep_skuif', { nommer: n, groep: v.groep, gereed: v.groep === 'Om te verkoop' ? v.gereed : '' });
        if (v.rede && v.rede.trim()) voegBewerkingBy('nota', { datum: v.datum, nommer: n, nota: 'Na ' + v.groep + ' geskuif: ' + v.rede.trim() });
        boodskap(v.groep === 'Om te verkoop' ? n + ' staan nou in die ry om verkoop te word.' : n + ' is nou in ' + v.groep + '.');
        App.terug();
        return;
      case 'bestelling':
        voegBewerkingBy('bestelling', { datum: v.datum, naam: v.naam.trim(), kontak: v.kontak.trim(), wanneer: v.wanneer,
          aantal: v.aantal === '' ? '' : syfer(v.aantal), wat: v.wat.trim(), nota: v.nota.trim() });
        boodskap('Bestelling vir ' + v.naam.trim() + ' aangeteken. Ons sal nie vergeet nie!');
        App.terug();
        return;
      case 'bestelling_oop':
        voegBewerkingBy('bestelling_status', { ry: v.ry, naam: v.naam, status: v.status || 'Afgehandel', datum: v.datum });
        boodskap(v.status === 'Gekanselleer' ? 'Bestelling gekanselleer.' : 'Bestelling afgehandel. Mê!');
        App.terug();
        return;
      case 'groepskuif': {
        const gekies = v.gekies.map(function (x) { return a.diere[x]; }).filter(Boolean);
        const lammers = gekies.filter(function (d) { return d.lam; });
        const ander = gekies.filter(function (d) { return !d.lam; });
        // Lammers by die ma word gespeen: hulle skuif na die Register met dieselfde nommer en geskiedenis.
        lammers.forEach(function (d) {
          voegBewerkingBy('skaap_byvoeg', { nommer: d.n, geslag: geslagVirGroep(v.na) || d.geslag || 'Ooi', groep: v.na,
            geboorte: d.geboorte || '', ouderdom: '', herkoms: 'Gebore (gespeen)', datum: v.datum, vanLam: true, gereed: v.na === 'Om te verkoop' ? v.gereed : '' });
        });
        if (ander.length) voegBewerkingBy('groep_skuif', { nommers: ander.map(function (d) { return d.n; }), groep: v.na, gereed: v.na === 'Om te verkoop' ? v.gereed : '' });
        boodskap(gekies.length + (gekies.length === 1 ? ' skaap is' : ' skape is') + ' na ' + v.na + ' geskuif. Mê!');
        App.terug();
        return;
      }
      case 'speen': {
        const d = a.diere[n];
        voegBewerkingBy('skaap_byvoeg', { nommer: n, geslag: v.geslag, groep: v.groep, geboorte: d ? d.geboorte : '', ouderdom: '',
          herkoms: 'Gebore (gespeen)', datum: v.datum, vanLam: true });
        if (syfer(v.gewig) > 0) voegBewerkingBy('weeg', { datum: v.datum, nommer: n, gewig: syfer(v.gewig), rede: 'Speen' });
        boodskap('Ek is groot genoeg! ' + n + ' is gespeen.');
        App.terug();
        return;
      }
      case 'gesond': {
        const o = a.siek.find(function (x) { return x._r === v.ry; });
        voegBewerkingBy('siek_status', { ry: v.ry, nommer: o ? o.Nommer : v.nommer, groep: o ? o.Groep : '', status: 'Gesond', datum: v.datum });
        boodskap(o && !sleutelVan(o.Nommer) ? 'Hoera, die hele ' + (o.Groep || 'groep') + ' voel weer beter!' : 'Hoera, ek voel weer beter!');
        App.terug();
        return;
      }
      case 'produk': {
        const dosisse = {};
        v.groepe.forEach(function (g) { const x = v['d_' + GROEPE.indexOf(g)]; dosisse[g] = x === undefined || x === '' ? '' : syfer(x); });
        voegBewerkingBy('produk', { program: v.program, produk: v.produk.trim(), beskrywing: v.beskrywing.trim(),
          onttrekking: v.onttrekking === '' ? '' : syfer(v.onttrekking), ouderdom: v.ouderdom.trim(), groepe: v.groepe.slice(), dosisse: dosisse });
        boodskap(v.produk.trim() + ' is by die ' + v.program + ' gevoeg.');
        App.terug();
        return;
      }
      case 'siekte':
        voegBewerkingBy('siekte', { ry: v.ry || 0, siekte: v.siekte.trim(), simptome: v.simptome.trim(), seisoen: v.seisoen.trim(), spuitstof: v.spuitstof.trim(), nota: v.nota.trim() });
        boodskap(v.ry ? 'Siekte-inligting opgedateer.' : v.siekte.trim() + ' is gestoor.');
        App.terug();
        return;
      case 'seisoen_nota':
        voegBewerkingBy('seisoen_nota', { datum: v.datum, seisoen: v.seisoen, nota: v.nota.trim() });
        boodskap('Nota by lamseisoen ' + v.seisoen + ' gestoor.');
        App.terug();
        return;
      case 'skenking':
        voegBewerkingBy('skenking', { datum: v.datum, nommer: n, aanWie: v.aanWie.trim(), rede: v.rede.trim(), nota: v.nota.trim() });
        boodskap('Totsiens! ' + n + ' gaan na ' + v.aanWie.trim() + '.');
        App.terug();
        return;
    }
  },
};

Skerms.vorm = function (p) {
  const a = Afgelei.get();
  const v = p.vorm;
  const t = p.tipe;
  let lyf = '';

  switch (t) {
    case 'byvoeg':
      lyf += '<div class="inligting"><i class="ti ti-info-circle"></i><span>Vir \'n skaap wat reeds op die plaas is of aangekoop is. Nuwe lammers gaan by <b>Nuwe lam</b>.</span></div>';
      lyf += '<div class="veld"><label for="v-nommer">Nommer op die plaatjie</label><input class="inv" id="v-nommer" data-v="nommer" data-her="1" inputmode="numeric" autocomplete="off" value="' + esc(v.nommer) + '">' +
        (a.gebruik[sleutelVan(v.nommer)] ? '<div class="fout">Hierdie nommer word reeds gebruik.</div>' : '<div class="hulp">Volgende vrye nommer: ' + vryNommers(a, 1)[0] + '</div>') + '</div>';
      lyf += etiket('Geslag') + kiesKnoppies('geslag', v.geslag, ['Ooi', 'Ram', 'Hammel']) + '</div>';
      lyf += keuseVeld('groep', v.groep, 'Groep', ALLE_GROEPE);
      lyf += etiket('Herkoms') + kiesKnoppies('herkoms', v.herkoms, ['Reeds op plaas', 'Gekoop']) + '</div>';
      lyf += datumVeld('datum', v.datum, v.herkoms === 'Gekoop' ? 'Datum gekoop' : 'Datum bygevoeg');
      lyf += datumVeld('geboorte', v.geboorte, 'Geboortedatum (as jy dit weet)');
      if (!v.geboorte) lyf += getalVeld('ouderdom', v.ouderdom, 'Of geskatte ouderdom', 'jaar', 'bv. 3');
      break;

    case 'lam': {
      lyf += dierVeld('ma', v.ma, 'Ma (ooi)', { lys: ooie(a) });
      lyf += '<div class="veld"><label for="v-pa">Pa (ram)</label><select class="inv" id="v-pa" data-v="pa"><option value="">Onbekend</option>' +
        ramme(a).map(function (r) { return '<option value="' + esc(r.n) + '"' + (r.n === v.pa ? ' selected' : '') + '>Ram ' + esc(r.n) + '</option>'; }).join('') + '</select></div>';
      lyf += '<div class="twee">' + datumVeld('datum', v.datum, 'Geboortedatum') + keuseVeld('seisoen', v.seisoen, 'Lamseisoen', lamSeisoenOpsies(a, v.seisoen)) + '</div>';
      lyf += etiket('Hoeveel lammers?') + '<div class="stapper"><button type="button" data-a="vorm-aksie" data-w="minder">−</button><span>' + v.aantal + '</span>' +
        '<button type="button" data-a="vorm-aksie" data-w="meer">+</button><span style="font-size:15px;font-weight:400;color:var(--teks-2)">' + ['', 'Enkel', 'Tweeling', 'Drieling'][v.aantal] + '</span></div></div>';
      const toegeken = [];
      for (let i = 0; i < v.aantal; i++) {
        const k = v['l' + i + '_kondisie'] || 'Mooi';
        const dood = k === 'Dood gebore' || k === 'Aborteer';
        if (!dood && (v['l' + i + '_nommer'] === undefined || v['l' + i + '_nommer'] === '')) {
          v['l' + i + '_nommer'] = vryNommers(a, 1, toegeken.concat(Object.keys(v).filter(function (x) { return /_nommer$/.test(x); }).map(function (x) { return v[x]; })))[0];
        }
        if (!dood) toegeken.push(v['l' + i + '_nommer']);
        lyf += '<div class="lamkaart"><h3><i class="ti ti-baby-carriage" style="color:var(--groen)"></i>Lam ' + (i + 1) + '</h3>' +
          etiket('Kondisie') + kiesKnoppies('l' + i + '_kondisie', k, KONDISIES) + '</div>' +
          (dood ? '<div class="inligting oranje"><i class="ti ti-info-circle"></i><span>Geen nommer word toegeken nie.</span></div>' :
            '<div class="veld"><label for="v-l' + i + '_nommer">Nommer</label><input class="inv" id="v-l' + i + '_nommer" data-v="l' + i + '_nommer" data-her="1" inputmode="numeric" value="' + esc(v['l' + i + '_nommer']) + '">' +
            (a.gebruik[sleutelVan(v['l' + i + '_nommer'])] ? '<div class="fout">Hierdie nommer word reeds gebruik.</div>' : '<div class="hulp">Voorgestel: die kleinste vrye nommer. Jy kan dit verander.</div>') + '</div>' +
            etiket('Groep') + kiesKnoppies('l' + i + '_groep', v['l' + i + '_groep'], [{ w: 'Ooi Lam by MA', t: 'Ooilam' }, { w: 'Hammel Lam by MA', t: 'Hammellam' }, { w: 'Hans Lam', t: 'Hanslam' }]) + '</div>' +
            skakelVeld('l' + i + '_verwerp', v['l' + i + '_verwerp'], 'Ma het hierdie lam verwerp')) +
          teksVeld('l' + i + '_nota', v['l' + i + '_nota'], 'Nota oor hierdie lam', 'Opsioneel') + '</div>';
      }
      lyf += skakelVeld('droog', v.droog, 'Ma is droog (geen melk)');
      lyf += teksVeld('rekordNota', v.rekordNota, 'Nota oor die geboorte', 'bv. moeilike geboorte', true);
      break;
    }

    case 'spuit': {
      lyf += datumVeld('datum', v.datum);
      lyf += etiket('Program') + kiesKnoppies('program', v.program, PROGRAMME) + '</div>';
      const prods = produkteVir(a, v.program);
      lyf += keuseVeld('produk', v.produk, 'Produk', prods, prods.length ? 'Kies produk' : 'Geen produkte in hierdie program');
      const inf = v.produk ? programInligting(a, v.program, v.produk) : null;
      if (inf && !p._voorafGedoen && v.produk) {
        p._voorafGedoen = v.produk;
        if (v.wie === 'Groep' && !v.groepe.length) v.groepe = inf.groepe.slice();
        const ds = inf.groepe.map(function (g) { return inf.dosisse[g]; }).filter(function (x) { return x !== '' && x !== undefined; });
        if (v.dosis === '' && ds.length && ds.every(function (x) { return x === ds[0]; })) v.dosis = ds[0];
      }
      if (p._voorafGedoen && p._voorafGedoen !== v.produk) p._voorafGedoen = null;
      if (inf && (inf.beskrywing || inf.onttrekking)) lyf += '<div class="inligting"><i class="ti ti-info-circle"></i><span>' +
        esc([inf.beskrywing, inf.onttrekking !== '' && inf.onttrekking !== undefined ? 'Onttrekking: ' + inf.onttrekking + ' dae' : ''].filter(Boolean).join(' · ')) + '</span></div>';
      lyf += etiket('Wie word gespuit?') + kiesKnoppies('wie', v.wie, ['Groep', 'Een dier']) + '</div>';
      if (v.wie === 'Een dier') lyf += dierVeld('nommer', v.nommer);
      else {
        const tel = inGroepe(a, v.groepe).length;
        lyf += etiket('Groepe') + kiesKnoppies('groepe', v.groepe, GROEPE) +
          '<div class="hulp">' + tel + (tel === 1 ? ' dier' : ' diere') + ' in die gemerkte groepe' + (inf ? ' · vooraf gemerk uit die spuitprogram' : '') + '</div></div>';
      }
      lyf += getalVeld('dosis', v.dosis, 'Dosis per dier', 'ml', inf && inf.groepe.length ? inf.groepe.map(function (g) { return g + ': ' + (inf.dosisse[g] || '?'); }).join(', ') : '');
      if (v.wie === 'Groep' && syfer(v.dosis) > 0) lyf += '<div class="hulp" style="margin-top:-8px">Totaal: ' + Math.round(syfer(v.dosis) * inGroepe(a, v.groepe).length * 10) / 10 + ' ml</div>';
      lyf += teksVeld('nota', v.nota, 'Nota', 'Opsioneel');
      break;
    }

    case 'siek':
      lyf += datumVeld('datum', v.datum);
      lyf += etiket('Wie is siek?') + kiesKnoppies('wie', v.wie, ['Een dier', 'Groep']) + '</div>';
      lyf += v.wie === 'Een dier' ? dierVeld('nommer', v.nommer) : keuseVeld('groep', v.groep, 'Groep', ['Alle groepe'].concat(GROEPE), 'Kies groep');
      lyf += teksVeld('probleem', v.probleem, 'Probleem of simptome', 'bv. hoes, mank, eet nie', true);
      lyf += teksVeld('aksie', v.aksie, 'Wat is gedoen?', 'bv. geïsoleer, veearts gebel');
      lyf += etiket('Status') + kiesKnoppies('status', v.status, ['Siek', 'Onder behandeling']) + '</div>';
      lyf += keuseVeld('produk', v.produk, 'Produk gespuit', a.produkte, 'Niks gespuit nie');
      if (v.produk) lyf += getalVeld('dosis', v.dosis, 'Dosis', 'ml') + '<div class="hulp" style="margin-top:-8px">Word outomaties in die Spuit Register aangeteken.</div>';
      break;

    case 'weeg':
      lyf += '<div class="twee">' + datumVeld('datum', v.datum) + keuseVeld('rede', v.rede, 'Rede', ['Gewone weging', 'Geboorte', 'Speen', 'Verkoop']) + '</div>';
      lyf += dierVeld('nommer', v.nommer, 'Nommer', { lys: aktieweDiere(a) });
      lyf += getalVeld('gewig', v.gewig, 'Gewig', 'kg', 'bv. 32,5');
      lyf += skakelVeld('reeks', v.reeks, 'Bly op hierdie skerm vir die volgende skaap');
      break;

    case 'nota':
      lyf += datumVeld('datum', v.datum);
      lyf += dierVeld('nommer', v.nommer, 'Nommer', { lys: a.lys });
      lyf += teksVeld('nota', v.nota, 'Nota', 'Wat wil jy onthou?', true);
      break;

    case 'uit': case 'verkoop':
      lyf += dierVeld('nommer', v.nommer);
      if (isEienaar() && t === 'uit') lyf += etiket('Wat het gebeur?') + kiesKnoppies('tipe', v.tipe, ['Dood', 'Verkoop', 'Geskenk'], 'rooi') + '</div>';
      lyf += datumVeld('datum', v.datum);
      if (v.tipe === 'Dood') lyf += teksVeld('rede', v.rede, 'Oorsaak (as bekend)', 'bv. bloednier, jakkals');
      else if (v.tipe === 'Geskenk') {
        lyf += teksVeld('aanWie', v.aanWie, 'Aan wie geskenk?', 'bv. buurman, kerk');
        lyf += teksVeld('rede', v.rede, 'Rede (opsioneel)', 'bv. vir die kerkbasaar');
      } else {
        lyf += teksVeld('aanWie', v.aanWie, 'Aan wie verkoop?', 'Koper se naam');
        lyf += '<div class="twee">' + getalVeld('prys', v.prys, 'Prys', 'R') + getalVeld('gewig', v.gewig, 'Gewig', 'kg') + '</div>';
        if (syfer(v.prys) > 0 && syfer(v.gewig) > 0) lyf += '<div class="hulp" style="margin-top:-8px">R ' + (Math.round(syfer(v.prys) / syfer(v.gewig) * 100) / 100) + ' per kg</div>';
        lyf += skakelVeld('betaal', v.betaal, 'Reeds betaal');
      }
      { const ont = v.tipe === 'Verkoop' && a.diere[sleutelVan(v.nommer)] ? onttrekkingTot(a, sleutelVan(v.nommer)) : '';
        if (ont) lyf += '<div class="inligting rooi"><i class="ti ti-alert-triangle"></i><span>Let op: hierdie dier is nog in sy onttrekkingsperiode tot ' + mooiDatum(ont) + '.</span></div>'; }
      lyf += '<div class="inligting"><i class="ti ti-shield-check"></i><span>Die dier se geskiedenis bly bewaar; net sy status verander.</span></div>';
      break;

    case 'skuif':
      lyf += '<div class="inligting"><i class="ti ti-info-circle"></i><span>Skaap ' + esc(v.nommer) + ' is tans in <b>' + esc((a.diere[v.nommer] || {}).groep || '—') + '</b>.</span></div>';
      lyf += keuseVeld('groep', v.groep, 'Nuwe groep', ALLE_GROEPE);
      lyf += (v.groep === 'Om te verkoop' ? etiket('Gereed om te verkoop?') + kiesKnoppies('gereed', v.gereed, ['Gereed', 'Nie gereed']) + '</div>' : '');
      lyf += teksVeld('rede', v.rede, 'Rede (word as nota gestoor)', v.groep === 'Om te verkoop' ? 'bv. 2 keer nie gelam nie' : 'Opsioneel');
      break;

    case 'bestelling':
      lyf += '<div class="inligting oranje"><i class="ti ti-clipboard-list"></i><span>Die bestelling wys op die tuisskerm tot dit afgehandel is, sodat die skape nie per ongeluk veiling toe gaan nie.</span></div>';
      lyf += teksVeld('naam', v.naam, 'Koper se naam', 'bv. Piet van der Merwe');
      lyf += teksVeld('kontak', v.kontak, 'Telefoon (opsioneel)', 'bv. 082 123 4567');
      lyf += '<div class="veld"><label for="v-wanneer">Wanneer wil hulle dit hê?</label><input class="inv" type="date" id="v-wanneer" data-v="wanneer" value="' + esc(v.wanneer) + '" min="' + vandag() + '"></div>';
      lyf += '<div class="twee">' + getalVeld('aantal', v.aantal, 'Aantal skape', '', 'bv. 10') + datumVeld('datum', v.datum, 'Datum bestel') + '</div>';
      lyf += teksVeld('wat', v.wat, 'Wat soek hulle?', 'bv. hamels ±40 kg, jong ooie');
      lyf += teksVeld('nota', v.nota, 'Nota', 'Opsioneel', true);
      break;

    case 'bestelling_oop': {
      const o = a.bestellings.find(function (x) { return x._r === v.ry; }) || {};
      lyf += '<div class="kaart feite">' + [['Koper', o.Naam], ['Telefoon', o.Kontak || '—'], ['Benodig op', mooiDatum(o['Benodig Op'])], ['Aantal', o.Aantal || '—'],
        ['Wat', o.Wat || '—'], ['Bestel op', mooiDatum(o['Datum Bestel']) || '—']].map(function (f) {
        return '<div class="feit"><div class="e">' + esc(f[0]) + '</div><div class="w">' + esc(f[1]) + '</div></div>'; }).join('') + '</div>';
      if (o.Nota) lyf += '<div class="kaart">' + esc(o.Nota) + '</div>';
      if (!v.status) v.status = 'Afgehandel';
      lyf += etiket('Wat het gebeur?') + kiesKnoppies('status', v.status, ['Afgehandel', 'Gekanselleer']) + '</div>';
      lyf += datumVeld('datum', v.datum, v.status === 'Gekanselleer' ? 'Gekanselleer op' : 'Afgehandel op');
      break;
    }

    case 'groepskuif': {
      lyf += datumVeld('datum', v.datum);
      lyf += keuseVeld('van', v.van, 'Watter groep skuif?', ALLE_GROEPE.map(function (g) { return { w: g, t: g + ' (' + lede(a, g).length + ')' }; }), 'Kies groep');
      if (v.van) {
        lyf += keuseVeld('na', v.na, 'Na watter groep?', ALLE_GROEPE.filter(function (g) { return g !== v.van; }), 'Kies nuwe groep');
        if (v.na === 'Om te verkoop') lyf += etiket('Gereed om te verkoop?') + kiesKnoppies('gereed', v.gereed, ['Gereed', 'Nie gereed']) + '</div>';
        const lys = lede(a, v.van);
        lyf += '<div class="veld"><span class="etiket">Diere wat skuif (' + v.gekies.length + ' van ' + lys.length + ')</span>' +
          '<div style="display:flex;gap:8px;margin-bottom:8px"><button type="button" class="knop-klein" data-a="vorm-aksie" data-w="almal">Almal</button>' +
          '<button type="button" class="knop-klein" data-a="vorm-aksie" data-w="geen">Geen</button></div>' +
          (lys.length ? kiesKnoppies('gekies', v.gekies, lys.map(function (d) { return { w: d.n, t: d.n }; })) : '<div class="hulp">Daar is geen diere in hierdie groep nie.</div>') +
          '<div class="hulp">Tik op \'n nommer om dit uit te laat.</div></div>';
        if (LAMGROEPE.indexOf(v.van) >= 0) lyf += '<div class="inligting"><i class="ti ti-info-circle"></i><span>Hierdie lammers word gespeen: hulle skuif na die Register met dieselfde nommer, geboortedatum en geskiedenis. Weeg hulle by <b>Weeg</b> met die rede <b>Speen</b> vir die speengewig.</span></div>';
      }
      break;
    }

    case 'speen':
      lyf += '<div class="inligting"><i class="ti ti-info-circle"></i><span>Lam ' + esc(v.nommer) + ' skuif na die Register. Sy nommer, geboortedatum en geskiedenis bly dieselfde.</span></div>';
      lyf += datumVeld('datum', v.datum, 'Speendatum');
      lyf += etiket('Geslag') + kiesKnoppies('geslag', v.geslag, ['Ooi', 'Hammel', 'Ram']) + '</div>';
      lyf += keuseVeld('groep', v.groep, 'Nuwe groep', GROEPE);
      lyf += getalVeld('gewig', v.gewig, 'Speengewig', 'kg', 'Opsioneel');
      break;

    case 'gesond':
      lyf += '<div class="inligting"><i class="ti ti-heart"></i><span>' + (sleutelVan(v.nommer) ? 'Skaap ' + esc(v.nommer) + ' is weer gesond.' : 'Die hele ' + esc(v.groep || 'groep') + ' is weer gesond.') + '</span></div>';
      lyf += datumVeld('datum', v.datum, 'Gesond sedert');
      break;

    case 'produk': {
      lyf += '<div class="inligting"><i class="ti ti-info-circle"></i><span>Die produk word by die <b>Spuit Program</b>-oortjie gevoeg, met die groepe en dosis wat jy hier merk.</span></div>';
      lyf += etiket('Program') + kiesKnoppies('program', v.program, PROGRAMME) + '</div>';
      lyf += teksVeld('produk', v.produk, 'Produk / medisyne', 'bv. Multivax P');
      lyf += teksVeld('beskrywing', v.beskrywing, 'Beskrywing', 'bv. teen bloednier, 1 ml/25 kg');
      lyf += '<div class="twee">' + getalVeld('onttrekking', v.onttrekking, 'Onttrekking', 'dae', 'bv. 21') + teksVeld('ouderdom', v.ouderdom, 'Ouderdom', 'bv. vanaf speen') + '</div>';
      lyf += etiket('Teikengroepe') + kiesKnoppies('groepe', v.groepe, GROEPE) + '</div>';
      v.groepe.forEach(function (g) { lyf += getalVeld('d_' + GROEPE.indexOf(g), v['d_' + GROEPE.indexOf(g)], 'Dosis vir ' + g, 'ml', 'bv. 2'); });
      break;
    }

    case 'siekte':
      lyf += teksVeld('siekte', v.siekte, 'Siekte', 'bv. Bloednier');
      lyf += teksVeld('simptome', v.simptome, 'Simptome', 'bv. skielike dood, krampe, opgeblaas', true);
      lyf += teksVeld('seisoen', v.seisoen, 'Wanneer kom dit voor?', 'bv. lente, na reën, by speen');
      lyf += teksVeld('spuitstof', v.spuitstof, 'Spuitstof voorstelle', 'bv. Glanvac 3, Multivax P', true);
      lyf += teksVeld('nota', v.nota, 'Nota', 'Opsioneel', true);
      break;

    case 'seisoen_nota':
      lyf += '<div class="inligting"><i class="ti ti-baby-carriage"></i><span>Nota oor lamseisoen <b>' + esc(v.seisoen) + '</b>.</span></div>';
      lyf += datumVeld('datum', v.datum);
      lyf += teksVeld('nota', v.nota, 'Nota', 'bv. Baie tweelinge, koue nagte in Sep', true);
      break;

    case 'skenking':
      lyf += '<div class="inligting"><i class="ti ti-gift"></i><span>Die skaap word as <b>Geskenk</b> uit die kudde gehaal. Sy geskiedenis bly bewaar.</span></div>';
      lyf += dierVeld('nommer', v.nommer);
      lyf += datumVeld('datum', v.datum);
      lyf += teksVeld('aanWie', v.aanWie, 'Aan wie geskenk?', 'bv. buurman, kerk');
      lyf += teksVeld('rede', v.rede, 'Rede', 'bv. vir die kerkbasaar');
      lyf += teksVeld('nota', v.nota, 'Nota', 'Opsioneel');
      break;
  }

  const knopTeks = t === 'weeg' && v.reeks ? 'Stoor en volgende' : t === 'bestelling_oop' ? 'Stoor' : 'Stoor';
  return kop(VORM_TITELS[t] || 'Vorm', t === 'bestelling_oop' ? v.naam : v.nommer && ['byvoeg', 'lam', 'weeg'].indexOf(t) < 0 ? 'Skaap ' + v.nommer : '') +
    '<div class="inhoud"><div class="vorm">' + foutBlok(p.fout) + lyf +
    '<button class="knop" data-a="stoor"><i class="ti ti-check"></i> ' + knopTeks + '</button></div></div>';
};
