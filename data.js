/* Skaap se Praat – data, sinkronisering en berekeninge */
'use strict';

const KONFIG = {
  // Word ingevul wanneer die agterkant (Apps Script) ontplooi is.
  API: 'https://script.google.com/macros/s/AKfycbw9mTRwSXYzgMROqiY6iMU5psxco0X1gKAnVhwisUjUoTDzhTtHNA1K0_kCgvENT1I/exec',
};

const GROEPE = ['Groot Ooi', 'Ram', 'Ooi Lam by MA', 'Hammel Lam by MA', 'Hans Lam', 'Gespeende Ooi Lam', 'Gespeende Hammel Lam'];
const ALLE_GROEPE = GROEPE.concat(['Om te verkoop']);
const LAMGROEPE = ['Ooi Lam by MA', 'Hammel Lam by MA', 'Hans Lam'];
// Virtuele groepe vir spuit en siek: die Om te verkoop-groep verdeel volgens gereed of nie.
const VERKOOP_GROEPE = { 'Om te verkoop (gereed)': 'Gereed', 'Om te verkoop (nie gereed)': 'Nie gereed' };
const SPUIT_GROEPE = GROEPE.concat(Object.keys(VERKOOP_GROEPE));
const WOLTIPES = ['AM', 'BM', 'AH', 'BH', 'CL', 'BP', 'LBP', 'L Lox', 'Lox 2', 'Lox 3', 'Resort', 'L Resort', 'TDR'];
const PROGRAMME = ['Feb Spuit Program', 'Aug Spuit Program', 'Speen Spuit Program', 'Buite Program'];
const KONDISIES = ['Mooi', 'Swak/Klein', 'Dood gebore', 'Aborteer'];
const MAANDE = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Des'];

/* ---------- Berging op die toestel ---------- */

const Berg = {
  lees(k, verstek) {
    try { const v = localStorage.getItem('ssp_' + k); return v === null ? verstek : JSON.parse(v); }
    catch (e) { return verstek; }
  },
  skryf(k, v) {
    try { localStorage.setItem('ssp_' + k, JSON.stringify(v)); } catch (e) { /* vol of geblokkeer */ }
  },
};

const Toestand = {
  sleutel: Berg.lees('sleutel', ''),
  wie: Berg.lees('wie', null),
  bediener: Berg.lees('data', null),   // laaste data van die sheet
  uitboks: Berg.lees('uitboks', []),   // bewerkings wat nog gestuur moet word
  probleme: Berg.lees('probleme', []), // bewerkings wat die sheet geweier het
  laasteSink: Berg.lees('laasteSink', null),
  besig: false,
  demo: false,
  fout: '',
};

function stoorToestand() {
  if (Toestand.demo) return; // toetsdata word nooit op die toestel gestoor nie
  Berg.skryf('sleutel', Toestand.sleutel);
  Berg.skryf('wie', Toestand.wie);
  Berg.skryf('data', Toestand.bediener);
  Berg.skryf('uitboks', Toestand.uitboks);
  Berg.skryf('probleme', Toestand.probleme);
  Berg.skryf('laasteSink', Toestand.laasteSink);
}

function isEienaar() { return Toestand.wie && Toestand.wie.rol === 'eienaar'; }

/* ---------- Bewerkings (uitboks) ---------- */

function nuweId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function voegBewerkingBy(tipe, data) {
  Toestand.uitboks.push({ id: nuweId(), tipe: tipe, data: data, tyd: new Date().toISOString() });
  stoorToestand();
  Afgelei.ongeldig();
  sinkroniseer();
}

/* ---------- Sinkronisering ---------- */

// Fetch met 'n tydsbeperking: met swak sein bly 'n versoek anders vir altyd hang.
async function haal(url, opsies, ms) {
  const beheer = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const t = beheer ? setTimeout(function () { beheer.abort(); }, ms) : null;
  try {
    const r = await fetch(url, Object.assign({}, opsies || {}, beheer ? { signal: beheer.signal } : {}));
    const teks = await r.text();
    try { return JSON.parse(teks); } catch (x) {
      // Google het 'n foutbladsy (HTML) gestuur in plaas van data: wys wat daarin staan.
      const skoon = teks.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const f = new Error(skoon.slice(0, 220) || 'Onverwagte antwoord');
      f.bediener = true;
      throw f;
    }
  } finally { if (t) clearTimeout(t); }
}

let volgendePoging = null;
function probeerWeerOor(ms) {
  clearTimeout(volgendePoging);
  volgendePoging = setTimeout(function () { sinkroniseer(); }, ms);
}

async function sinkroniseer(opsioneel) {
  if (Toestand.demo) { demoSink(); return; }
  if (!KONFIG.API || !Toestand.sleutel) return;
  // 'n Vorige poging wat langer as 'n minuut hang, tel nie meer nie.
  if (Toestand.besig && Date.now() - (Toestand.besigSedert || 0) < 60000) return;
  const poging = (Toestand.poging || 0) + 1;
  Toestand.poging = poging;
  Toestand.besig = true;
  Toestand.besigSedert = Date.now();
  if (!Toestand.bediener) App.herteken(); else App.werkStatus();
  let gelukt = false;
  try {
    let antwoord;
    const ops = Toestand.uitboks.slice();
    if (ops.length) {
      antwoord = await haal(KONFIG.API, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ k: Toestand.sleutel, ops: ops }),
      }, 45000);
      if (antwoord.ok) {
        const klaar = {};
        (antwoord.resultate || []).forEach(function (res) {
          klaar[res.id] = true;
          if (!res.ok) {
            const op = ops.find(function (o) { return o.id === res.id; });
            if (op) Toestand.probleme.push(Object.assign({}, op, { fout: res.fout }));
          }
        });
        Toestand.uitboks = Toestand.uitboks.filter(function (o) { return !klaar[o.id]; });
      }
    } else {
      antwoord = await haal(KONFIG.API + '?k=' + encodeURIComponent(Toestand.sleutel), {}, 45000);
    }
    if (poging !== Toestand.poging) return; // 'n nuwer poging het reeds oorgeneem
    if (antwoord && antwoord.ok) {
      if (antwoord.data) Toestand.bediener = antwoord.data;
      Toestand.wie = antwoord.wie || Toestand.wie;
      Toestand.laasteSink = new Date().toISOString();
      Toestand.fout = '';
      gelukt = true;
    } else if (antwoord && antwoord.fout === 'sleutel') {
      Toestand.wie = null;
      Toestand.fout = 'Die sheet herken nie hierdie skakel se sleutel nie. Maak jou persoonlike skakel weer oop.';
    } else {
      Toestand.fout = 'Die sheet het \'n fout teruggestuur: ' + ((antwoord && antwoord.fout) || 'onbekend');
    }
    stoorToestand();
    Afgelei.ongeldig();
  } catch (e) {
    if (poging !== Toestand.poging) return;
    // Geen sein, swak sein of bediener onbereikbaar – probeer outomaties weer.
    Toestand.fout = e && e.bediener ? 'Die sheet het \'n fout gegee: ' + e.message
      : Toestand.uitboks.length ? 'Geen sein nie. ' + Toestand.uitboks.length + ' inskrywing(s) wag en word outomaties gestuur sodra daar sein is.'
      : 'Kon nie die sheet bereik nie. Kyk of daar sein is en probeer weer.';
  } finally {
    if (poging === Toestand.poging) {
      Toestand.besig = false;
      App.herteken();
      // Iets wat intussen bygekom het, of 'n mislukte poging: probeer weer.
      if (Toestand.uitboks.length) probeerWeerOor(gelukt ? 1500 : 20000);
    }
  }
}

// Probeer stuur sodra die toestel weer sein het, die app weer oopgemaak word, of elke 30 sekondes as iets wag.
['online', 'focus', 'pageshow'].forEach(function (g) { window.addEventListener(g, function () { if (Toestand.uitboks.length) sinkroniseer(); else if (g === 'online') sinkroniseer(); }); });
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState !== 'visible' || Toestand.demo) return;
  const laas = Toestand.laasteSink ? new Date(Toestand.laasteSink).getTime() : 0;
  if (Toestand.uitboks.length || Date.now() - laas > 120000 || Toestand.fout) sinkroniseer();
});
setInterval(function () { if (Toestand.uitboks.length) sinkroniseer(); }, 30000);

/* ---------- Hulpfunksies ---------- */

function vandag() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function naDatum(s) {
  if (!s) return null;
  const p = String(s).split('-');
  if (p.length !== 3) return null;
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}
function mooiDatum(s) {
  const d = naDatum(s);
  if (!d) return '';
  return d.getDate() + ' ' + MAANDE[d.getMonth()] + ' ' + d.getFullYear();
}
function kortDatum(s) {
  const d = naDatum(s);
  if (!d) return '';
  return d.getDate() + ' ' + MAANDE[d.getMonth()];
}
function dae(van, tot) {
  return Math.floor((tot - van) / 86400000);
}
function plusDae(s, n) {
  const d = naDatum(s);
  if (!d) return '';
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
}
function sleutelVan(n) { return n === '' || n === null || n === undefined ? '' : String(n).trim(); }
function gelyk(a, b) { return sleutelVan(a) !== '' && sleutelVan(a) === sleutelVan(b); }
function esc(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function getal(v) { const x = Number(v); return isNaN(x) ? 0 : x; }
function syferTeks(v) { if (v === '' || v === null || v === undefined) return ''; const x = Number(v); return isNaN(x) ? String(v) : String(Math.round(x * 100) / 100).replace('.', ','); }

/* ---------- Tabelle ---------- */

// Gee 'n tabel as 'n lys voorwerpe met kolomname as sleutels (plus _r = ry in die sheet).
function tabel(data, naam) {
  const t = data && data[naam];
  if (!t) return [];
  return t.rye.map(function (ry) {
    const o = { _r: ry.r };
    t.kop.forEach(function (k, i) { if (k) o[k] = ry.w[i]; });
    return o;
  });
}

function kloon(x) { return JSON.parse(JSON.stringify(x)); }

function leegData() {
  const kop = {
    Register: ['Nommer', 'Geslag', 'Groep', 'Geboorte Datum', 'Ouderdom', 'Lammers Totaal', 'History', 'Vlag', 'Status', 'Dood/Verkoop', 'Datum Uit', 'Herkoms', 'Datum Bygevoeg', 'Verkoop Gereed'],
    Lam: ['Geboorte ID', 'Ma Nommer', 'Pa', 'Geboorte Datum', 'Lam Seisoen', 'Geboorte Tipe', 'Lam Nommer', 'Groep', 'Kondisie', 'Lam Nota', 'Rekord Nota', 'Ooi Probleem'],
    'Spuit Register': ['Datum', 'Program', 'Produk', 'Nommer', 'Groot Ooi', 'Ram', 'Ooi Lam by MA', 'Hammel Lam by MA', 'Hans Lam', 'Gespeende Ooi Lam', 'Gespeende Hammel Lam', 'Teiken groepe', 'Dosis (ml)', 'Aantal diere', 'Diere gespuit', 'Bron', 'Nota'],
    'Siek diere': ['Datum', 'Nommer', 'Groep', 'Probleem/Simptome', 'Aksie', 'Status', 'Gesond/Dood Datum', 'Produk gespuit', 'Dosis (ml)'],
    Weeg: ['Datum', 'Nommer', 'Gewig (kg)', 'Rede'],
    Notas: ['Datum', 'Nommer', 'Nota'],
    Bestellings: ['Datum Bestel', 'Naam', 'Kontak', 'Benodig Op', 'Aantal', 'Wat', 'Nota', 'Status', 'Afgehandel Op'],
    Verkoop: ['Date', 'Nommer', 'Aan Wie', 'Groep outomaties', 'Prys', 'Gewig', 'R/kg', 'Paid'],
    Seisoene: ['Tipe', 'Seisoen', 'Begin', 'Einde', 'Nota'],
    'Seisoen Notas': ['Datum', 'Seisoen', 'Nota'],
    Siektes: ['Siekte', 'Simptome', 'Seisoen', 'Spuitstof voorstelle', 'Nota'],
    Skenkings: ['Datum', 'Nommer', 'Aan Wie', 'Rede', 'Nota'],
    Skeer: ['Datum', 'Groepe', 'Aantal geskeer', 'Nota'],
    Wol: ['Datum', 'Tipe wol', 'Gewig (kg)', 'Baal Nr', 'Gestuur na BKB', 'Nota'],
    Vlae: ['Datum', 'Nommer', 'Rede', 'Status', 'Opgehef Op'],
  };
  const d = {};
  Object.keys(kop).forEach(function (k) { d[k] = { kop: kop[k], rye: [] }; });
  return d;
}

function voegRyBy(data, naam, waardes) {
  if (!data[naam]) data[naam] = leegData()[naam] || { kop: Object.keys(waardes), rye: [] };
  const t = data[naam];
  const w = t.kop.map(function (k) { return k in waardes ? waardes[k] : ''; });
  // Plaaslike rye kry 'n tydelike negatiewe nommer (uniek, en dieselfde by elke herberekening).
  t.rye.push({ r: -(t.rye.length + 1), w: w, plaaslik: true });
}

function stelWaarde(data, naam, pas, waardes) {
  const t = data[naam];
  if (!t) return;
  t.rye.forEach(function (ry) {
    const o = {};
    t.kop.forEach(function (k, i) { o[k] = ry.w[i]; });
    o._r = ry.r;
    if (pas(o)) Object.keys(waardes).forEach(function (k) {
      const i = t.kop.indexOf(k);
      if (i >= 0) ry.w[i] = waardes[k];
    });
  });
}

/* Pas die bewerkings in die uitboks plaaslik toe, sodat die app dadelik
   wys wat ingesleutel is – ook sonder sein. */
function pasPlaaslikToe(data, op) {
  const d = op.data;
  switch (op.tipe) {
    case 'skaap_byvoeg':
      voegRyBy(data, 'Register', { 'Nommer': d.nommer, 'Geslag': d.geslag, 'Groep': d.groep,
        'Geboorte Datum': d.geboorte || '', 'Ouderdom': d.ouderdom || '', 'Herkoms': d.herkoms, 'Datum Bygevoeg': d.datum,
        'Verkoop Gereed': d.groep === 'Om te verkoop' ? (d.gereed || 'Nie gereed') : '' });
      break;
    case 'skaap_wysig':
      stelWaarde(data, 'Register', function (o) { return gelyk(o.Nommer, d.nommer); },
        Object.assign({ 'Geslag': d.geslag, 'Groep': d.groep, 'Geboorte Datum': d.geboorte || '', 'Ouderdom': d.geboorte ? '' : (d.ouderdom === '' ? '' : d.ouderdom) },
          d.groep === 'Om te verkoop' ? {} : { 'Verkoop Gereed': '' }));
      break;
    case 'groep_skuif':
      stelWaarde(data, 'Register', function (o) {
        return (d.nommers || [d.nommer]).some(function (n) { return gelyk(o.Nommer, n); });
      }, { 'Groep': d.groep, 'Verkoop Gereed': d.groep === 'Om te verkoop' ? (d.gereed || 'Nie gereed') : '' });
      break;
    case 'gereed':
      stelWaarde(data, 'Register', function (o) {
        return (d.nommers || [d.nommer]).some(function (n) { return gelyk(o.Nommer, n); });
      }, { 'Verkoop Gereed': d.gereed });
      break;
    case 'lam':
      (d.lammers || []).forEach(function (l, i) {
        voegRyBy(data, 'Lam', { 'Ma Nommer': d.ma, 'Pa': d.pa, 'Geboorte Datum': d.datum, 'Lam Seisoen': d.seisoen,
          'Lam Nommer': l.nommer, 'Groep': l.nommer === '' ? '' : l.groep, 'Kondisie': l.kondisie, 'Lam Nota': l.nota || '',
          'Rekord Nota': i === 0 ? (d.rekordNota || '') : '', 'Ooi Probleem': l.probleem || '' });
      });
      break;
    case 'spuit': {
      const w = { 'Datum': d.datum, 'Program': d.program, 'Produk': d.produk, 'Nommer': d.nommer || '',
        'Dosis (ml)': d.dosis, 'Bron': 'App', 'Nota': d.nota || '', 'Teiken groepe': (d.groepe || []).join(', ') };
      GROEPE.forEach(function (g) { w[g] = (d.groepe || []).indexOf(g) >= 0; });
      w['Diere gespuit'] = (d.diere || []).join(', ');
      voegRyBy(data, 'Spuit Register', w);
      break;
    }
    case 'siek':
      voegRyBy(data, 'Siek diere', { 'Datum': d.datum, 'Nommer': d.nommer || '', 'Groep': d.groep || '',
        'Probleem/Simptome': d.probleem, 'Aksie': d.aksie, 'Status': d.status, 'Produk gespuit': d.produk || '', 'Dosis (ml)': d.dosis });
      if (d.produk) {
        const w = { 'Datum': d.datum, 'Program': 'Buite Program', 'Produk': d.produk, 'Nommer': d.nommer || '',
          'Dosis (ml)': d.dosis, 'Bron': 'Siek diere', 'Nota': d.probleem, 'Diere gespuit': (d.diere || []).join(', ') };
        voegRyBy(data, 'Spuit Register', w);
      }
      break;
    case 'siek_status':
      stelWaarde(data, 'Siek diere', function (o) { return o._r === d.ry; }, { 'Status': d.status, 'Gesond/Dood Datum': d.datum });
      break;
    case 'bestelling':
      voegRyBy(data, 'Bestellings', { 'Datum Bestel': d.datum, 'Naam': d.naam, 'Kontak': d.kontak, 'Benodig Op': d.wanneer,
        'Aantal': d.aantal, 'Wat': d.wat, 'Nota': d.nota, 'Status': 'Oop' });
      break;
    case 'bestelling_status':
      stelWaarde(data, 'Bestellings', function (o) { return o._r === d.ry && d.ry; }, { 'Status': d.status, 'Afgehandel Op': d.status === 'Oop' ? '' : d.datum });
      break;
    case 'weeg':
      voegRyBy(data, 'Weeg', { 'Datum': d.datum, 'Nommer': d.nommer, 'Gewig (kg)': d.gewig, 'Rede': d.rede });
      break;
    case 'nota':
      voegRyBy(data, 'Notas', { 'Datum': d.datum, 'Nommer': d.nommer, 'Nota': d.nota });
      break;
    case 'uit': {
      const inReg = tabel(data, 'Register').some(function (o) { return gelyk(o.Nommer, d.nommer); });
      if (inReg) stelWaarde(data, 'Register', function (o) { return gelyk(o.Nommer, d.nommer); }, { 'Dood/Verkoop': d.tipe, 'Datum Uit': d.datum });
      if (d.tipe === 'Dood') voegRyBy(data, 'Siek diere', { 'Datum': d.datum, 'Nommer': d.nommer, 'Probleem/Simptome': d.rede || 'Dood', 'Status': 'Dood', 'Gesond/Dood Datum': d.datum });
      else voegRyBy(data, 'Verkoop', { 'Date': d.datum, 'Nommer': d.nommer });
      break;
    }
    case 'produk': {
      if (!data['Spuit Program']) break;
      const t = data['Spuit Program'];
      const w = t.kop.map(function () { return ''; });
      const zet = function (k, v) { const i = t.kop.indexOf(k); if (i >= 0) w[i] = v; };
      zet('Program', d.program); zet('Produk', d.produk); zet('Beskrywing', d.beskrywing || '');
      zet('Onttrekking (dae)', d.onttrekking === undefined ? '' : d.onttrekking); zet('Ouderdom', d.ouderdom || '');
      zet('Teiken groepe', (d.groepe || []).join(', '));
      t.kop.forEach(function (k, i) {
        if (GROEPE.indexOf(k) < 0) return;
        const aan = (d.groepe || []).indexOf(k) >= 0;
        w[i] = aan;
        if (t.kop[i + 1] && t.kop[i + 1].indexOf('Dosis') === 0) w[i + 1] = aan ? ((d.dosisse || {})[k] === undefined ? '' : d.dosisse[k]) : '';
      });
      t.rye.push({ r: -(t.rye.length + 1), w: w, plaaslik: true });
      break;
    }
    case 'siekte':
      if (d.ry) stelWaarde(data, 'Siektes', function (o) { return o._r === d.ry; }, { 'Siekte': d.siekte, 'Simptome': d.simptome, 'Seisoen': d.seisoen, 'Spuitstof voorstelle': d.spuitstof, 'Nota': d.nota });
      else voegRyBy(data, 'Siektes', { 'Siekte': d.siekte, 'Simptome': d.simptome, 'Seisoen': d.seisoen, 'Spuitstof voorstelle': d.spuitstof, 'Nota': d.nota });
      break;
    case 'lam_probleem':
      stelWaarde(data, 'Lam', function (o) { return gelyk(o['Lam Nommer'], d.nommer); }, { 'Ooi Probleem': d.probleem });
      break;
    case 'vlag':
      voegRyBy(data, 'Vlae', { 'Datum': d.datum, 'Nommer': d.nommer, 'Rede': d.rede, 'Status': 'Aktief' });
      break;
    case 'vlag_ophef':
      stelWaarde(data, 'Vlae', function (o) { return o._r === d.ry; }, { 'Status': 'Opgehef', 'Opgehef Op': d.datum });
      break;
    case 'skeer':
      voegRyBy(data, 'Skeer', { 'Datum': d.datum, 'Groepe': (d.groepe || []).join(', '), 'Aantal geskeer': d.aantal, 'Nota': d.nota });
      break;
    case 'wolbaal':
      voegRyBy(data, 'Wol', { 'Datum': d.datum, 'Tipe wol': d.tipe, 'Gewig (kg)': d.gewig, 'Baal Nr': d.baal, 'Gestuur na BKB': d.gestuur || '', 'Nota': d.nota });
      break;
    case 'wol_gestuur':
      stelWaarde(data, 'Wol', function (o) { return (d.rye || []).indexOf(o._r) >= 0; }, { 'Gestuur na BKB': d.datum });
      break;
    case 'seisoen_nota':
      voegRyBy(data, 'Seisoen Notas', { 'Datum': d.datum, 'Seisoen': d.seisoen, 'Nota': d.nota });
      break;
    case 'skenking':
      stelWaarde(data, 'Register', function (o) { return gelyk(o.Nommer, d.nommer); }, { 'Dood/Verkoop': 'Geskenk', 'Datum Uit': d.datum });
      voegRyBy(data, 'Skenkings', { 'Datum': d.datum, 'Nommer': d.nommer, 'Aan Wie': d.aanWie, 'Rede': d.rede, 'Nota': d.nota });
      break;
    case 'verkoop': {
      stelWaarde(data, 'Register', function (o) { return gelyk(o.Nommer, d.nommer); }, { 'Dood/Verkoop': 'Verkoop', 'Datum Uit': d.datum });
      voegRyBy(data, 'Verkoop', { 'Date': d.datum, 'Nommer': d.nommer, 'Aan Wie': d.aanWie, 'Prys': d.prys, 'Gewig': d.gewig, 'Paid': !!d.betaal });
      break;
    }
  }
}

/* ---------- Afgeleide inligting (bereken een keer per verandering) ---------- */

const Afgelei = {
  _k: null,
  ongeldig() { this._k = null; },
  get() {
    if (this._k) return this._k;
    const data = kloon(Toestand.bediener || leegData());
    Toestand.uitboks.forEach(function (op) { try { pasPlaaslikToe(data, op); } catch (e) { /* ignoreer */ } });
    this._k = bereken(data);
    return this._k;
  },
};

function bereken(data) {
  const reg = tabel(data, 'Register').filter(function (o) { return sleutelVan(o.Nommer) !== ''; });
  const lam = tabel(data, 'Lam').filter(function (o) { return sleutelVan(o['Ma Nommer']) !== '' || sleutelVan(o['Lam Nommer']) !== ''; });
  const siek = tabel(data, 'Siek diere').filter(function (o) { return o.Datum || o['Probleem/Simptome'] || o.Status; });
  const spuit = tabel(data, 'Spuit Register').filter(function (o) { return o.Datum && o.Produk; });
  const weeg = tabel(data, 'Weeg').filter(function (o) { return sleutelVan(o.Nommer) !== '' && o['Gewig (kg)'] !== ''; });
  const notas = tabel(data, 'Notas').filter(function (o) { return sleutelVan(o.Nommer) !== '' && o.Nota; });
  const verkoop = tabel(data, 'Verkoop').filter(function (o) { return sleutelVan(o.Nommer) !== ''; });
  const program = tabel(data, 'Spuit Program').filter(function (o) { return o.Produk; });
  const aksies = tabel(data, 'Aksies').filter(function (o) { return o.Aksie; });
  const ram = tabel(data, 'Ram').filter(function (o) { return o['Teel Seisoen']; });
  const bestellings = tabel(data, 'Bestellings').filter(function (o) { return o.Naam && o['Benodig Op']; });
  const ope_bestellings = bestellings.filter(function (o) { return (o.Status || 'Oop') === 'Oop'; })
    .sort(function (x, y) { return String(x['Benodig Op']).localeCompare(String(y['Benodig Op'])); });

  const skenkings = tabel(data, 'Skenkings').filter(function (o) { return sleutelVan(o.Nommer) !== ''; });
  const seisoenNotas = tabel(data, 'Seisoen Notas').filter(function (o) { return o.Seisoen && o.Nota; });
  const siektes = tabel(data, 'Siektes').filter(function (o) { return o.Siekte; })
    .sort(function (x, y) { return String(x.Siekte).localeCompare(String(y.Siekte)); });
  const seisoene = seisoenDefinisies(tabel(data, 'Seisoene'));
  const eieVlae = tabel(data, 'Vlae').filter(function (o) { return sleutelVan(o.Nommer) !== '' && o.Rede && (o.Status || 'Aktief') === 'Aktief'; })
    .sort(function (x, y) { return String(y.Datum).localeCompare(String(x.Datum)); });
  const skeer = tabel(data, 'Skeer').filter(function (o) { return o.Datum; })
    .sort(function (x, y) { return String(y.Datum).localeCompare(String(x.Datum)); });
  const wol = tabel(data, 'Wol').filter(function (o) { return o['Tipe wol'] || o['Gewig (kg)']; })
    .sort(function (x, y) { return String(y.Datum).localeCompare(String(x.Datum)) || getal(y['Baal Nr']) - getal(x['Baal Nr']); });

  const doodSet = {}, verkoopSet = {}, skenkSet = {};
  siek.forEach(function (o) { if (o.Status === 'Dood' && sleutelVan(o.Nommer)) doodSet[sleutelVan(o.Nommer)] = o['Gesond/Dood Datum'] || o.Datum; });
  verkoop.forEach(function (o) { verkoopSet[sleutelVan(o.Nommer)] = o.Date || ''; });
  skenkings.forEach(function (o) { skenkSet[sleutelVan(o.Nommer)] = o.Datum || ''; });

  const diere = {};
  const vandagD = naDatum(vandag());

  reg.forEach(function (o) {
    const n = sleutelVan(o.Nommer);
    let status = o['Dood/Verkoop'] || '';
    if (!status) {
      if (doodSet[n] !== undefined) status = 'Dood';
      else if (verkoopSet[n] !== undefined) status = 'Verkoop';
      else if (skenkSet[n] !== undefined) status = 'Geskenk';
    }
    const gb = o['Geboorte Datum'] || '';
    diere[n] = {
      n: n, lam: false, geslag: o.Geslag || '', groep: o.Groep || '', geboorte: gb,
      ouderdomJaar: gb ? Math.floor(dae(naDatum(gb), vandagD) / 365.25) : (o.Ouderdom === '' ? null : getal(o.Ouderdom)),
      uit: status === 'Dood' || status === 'Verkoop' || status === 'Geskenk' ? status : '',
      datumUit: o['Datum Uit'] || (status === 'Dood' ? doodSet[n] : status === 'Verkoop' ? verkoopSet[n] : status === 'Geskenk' ? skenkSet[n] : '') || '',
      herkoms: o.Herkoms || '', bygevoeg: o['Datum Bygevoeg'] || '', _r: o._r,
      gereed: o.Groep === 'Om te verkoop' ? (o['Verkoop Gereed'] || 'Nie gereed') : '',
    };
  });
  lam.forEach(function (o) {
    const n = sleutelVan(o['Lam Nommer']);
    if (!n) return;
    if (diere[n]) { diere[n].ma = sleutelVan(o['Ma Nommer']); diere[n].pa = sleutelVan(o.Pa); if (!diere[n].geboorte) diere[n].geboorte = o['Geboorte Datum']; return; }
    const groep = o.Groep || '';
    diere[n] = {
      n: n, lam: true, geslag: groep === 'Ooi Lam by MA' ? 'Ooi' : groep === 'Hammel Lam by MA' ? 'Hammel' : '',
      groep: groep, geboorte: o['Geboorte Datum'] || '', ma: sleutelVan(o['Ma Nommer']), pa: sleutelVan(o.Pa),
      uit: doodSet[n] !== undefined ? 'Dood' : verkoopSet[n] !== undefined ? 'Verkoop' : skenkSet[n] !== undefined ? 'Geskenk' : '',
      datumUit: doodSet[n] || verkoopSet[n] || skenkSet[n] || '', kondisie: o.Kondisie || '', seisoen: o['Lam Seisoen'] || '',
    };
  });

  // Siekte-status per dier
  const ope = siek.filter(function (o) { return o.Status === 'Siek' || o.Status === 'Onder behandeling'; });
  ope.forEach(function (o) {
    const d = diere[sleutelVan(o.Nommer)];
    if (d && !d.uit) d.siek = d.siek === 'Siek' ? 'Siek' : o.Status;
  });

  const lys = Object.keys(diere).map(function (k) { return diere[k]; });
  lys.forEach(function (d) {
    d.aktief = !d.uit;
    d.lammers = lam.filter(function (o) { return gelyk(o['Ma Nommer'], d.n); });
    d.vlae = d.lammers.filter(function (o) { return o['Ooi Probleem']; }).map(function (o) { return o['Ooi Probleem']; });
    d.eieVlae = eieVlae.filter(function (o) { return gelyk(o.Nommer, d.n); });
    d.eieVlae.forEach(function (o) { d.vlae.push(o.Rede); });
    d.verwek = lam.filter(function (o) { return gelyk(o.Pa, d.n); }).length;
    // Outomatiese vlag: volwasse ooi wat in die afgelope 12 maande nie gelam het nie.
    d.nieGelam = '';
    if (!d.lam && d.aktief && d.geslag === 'Ooi' && d.groep === 'Groot Ooi') {
      const laaste = d.lammers.map(function (o) { return String(o['Geboorte Datum'] || ''); }).sort().pop() || '';
      const sedert = d.bygevoeg || (d.geboorte ? plusDae(d.geboorte, 548) : '');
      const jaarGelede = plusDae(vandag(), -365);
      if ((!laaste || laaste < jaarGelede) && sedert && sedert <= jaarGelede) {
        d.nieGelam = laaste ? 'Laaste lam ' + MAANDE[naDatum(laaste).getMonth()] + ' ' + naDatum(laaste).getFullYear() : 'Nog nie gelam nie';
      }
    }
  });
  lys.sort(function (a, b) { return getal(a.n) - getal(b.n) || a.n.localeCompare(b.n); });

  const gebruik = {};
  reg.forEach(function (o) { gebruik[sleutelVan(o.Nommer)] = true; });
  lam.forEach(function (o) { if (sleutelVan(o['Lam Nommer'])) gebruik[sleutelVan(o['Lam Nommer'])] = true; });

  const produkte = [];
  program.forEach(function (o) { const p = String(o.Produk).trim(); if (p && produkte.indexOf(p) < 0) produkte.push(p); });
  produkte.sort();

  // Sterftes: volwasse diere en lammers wat dood is, plus doodgebore en geaborteerde lammers.
  const sterftes = [];
  lys.forEach(function (d) {
    if (d.uit !== 'Dood') return;
    const rek = siek.filter(function (o) { return o.Status === 'Dood' && gelyk(o.Nommer, d.n); })[0];
    const rede = rek && rek['Probleem/Simptome'] && rek['Probleem/Simptome'].indexOf('Dood (gemerk') !== 0 && rek['Probleem/Simptome'] !== 'Dood' ? rek['Probleem/Simptome'] : '';
    sterftes.push({ datum: d.datumUit || '', soort: d.lam ? 'Lam' : 'Volwasse', n: d.n, groep: d.groep, rede: rede });
  });
  lam.forEach(function (o) {
    if (o.Kondisie !== 'Dood gebore' && o.Kondisie !== 'Aborteer') return;
    sterftes.push({ datum: o['Geboorte Datum'] || '', soort: o.Kondisie, n: '', ma: sleutelVan(o['Ma Nommer']), rede: o['Rekord Nota'] || o['Lam Nota'] || '' });
  });
  sterftes.sort(function (x, y) { return String(y.datum).localeCompare(String(x.datum)); });

  return { data: data, diere: diere, lys: lys, lam: lam, siek: siek, ope: ope, spuit: spuit, weeg: weeg,
    notas: notas, verkoop: verkoop, bestellings: bestellings, opeBestellings: ope_bestellings, program: program, aksies: aksies, ram: ram, gebruik: gebruik, produkte: produkte,
    skenkings: skenkings, seisoenNotas: seisoenNotas, siektes: siektes, seisoene: seisoene, sterftes: sterftes, skeer: skeer, wol: wol };
}

/* ---------- Navraag-funksies ---------- */

function vryNommers(a, aantal, ekstra) {
  const uit = [];
  const gebruik = Object.assign({}, a.gebruik);
  (ekstra || []).forEach(function (n) { gebruik[sleutelVan(n)] = true; });
  for (let i = 1; uit.length < aantal && i < 100000; i++) if (!gebruik[String(i)]) uit.push(String(i));
  return uit;
}

function aktieweDiere(a) { return a.lys.filter(function (d) { return d.aktief; }); }
function inGroep(d, g) {
  if (g === 'Alle groepe') return true;
  if (VERKOOP_GROEPE[g]) return d.groep === 'Om te verkoop' && (d.gereed || 'Nie gereed') === VERKOOP_GROEPE[g];
  return d.groep === g;
}
function inGroepe(a, groepe) { return aktieweDiere(a).filter(function (d) { return groepe.some(function (g) { return inGroep(d, g); }); }); }
function ooie(a) { return aktieweDiere(a).filter(function (d) { return !d.lam && d.geslag === 'Ooi'; }); }
function ramme(a) { return aktieweDiere(a).filter(function (d) { return !d.lam && d.groep === 'Ram'; }); }

// Ouderdom in volle jare (null as onbekend)
function ouderdomJare(d) {
  if (d.geboorte && naDatum(d.geboorte)) return Math.floor(dae(naDatum(d.geboorte), naDatum(d.datumUit || vandag())) / 365.25);
  if (d.ouderdomJaar !== null && d.ouderdomJaar !== undefined && !isNaN(d.ouderdomJaar)) return d.ouderdomJaar;
  return null;
}
function ouderdomKlas(d) {
  const j = ouderdomJare(d);
  if (j === null) return 'Onbekend';
  if (j < 1) return '< 1 jaar';
  if (j >= 6) return '6+ jaar';
  return j + ' jaar';
}
function ouderdomTeks(d) {
  if (d.geboorte) {
    const dg = dae(naDatum(d.geboorte), naDatum(d.datumUit || vandag()));
    if (dg < 0) return '';
    if (dg < 7 * 26) { const w = Math.floor(dg / 7); return w === 1 ? '1 week' : w + ' weke'; }
    if (dg < 365) return Math.floor(dg / 30.4) + ' maande';
    const j = Math.floor(dg / 365.25);
    return j + ' jaar';
  }
  if (d.ouderdomJaar !== null && d.ouderdomJaar !== undefined) return d.ouderdomJaar + ' jaar';
  return '';
}

function spuitVir(a, n) {
  return a.spuit.filter(function (o) {
    if (gelyk(o.Nommer, n)) return true;
    return (', ' + String(o['Diere gespuit'] || '') + ',').indexOf(', ' + n + ',') >= 0;
  }).sort(function (x, y) { return String(y.Datum).localeCompare(String(x.Datum)); });
}
function siekVir(a, d) {
  return a.siek.filter(function (o) {
    if (gelyk(o.Nommer, d.n)) return true;
    return sleutelVan(o.Nommer) === '' && !!o.Groep && inGroep(d, o.Groep);
  }).sort(function (x, y) { return String(y.Datum).localeCompare(String(x.Datum)); });
}
function weegVir(a, n) {
  return a.weeg.filter(function (o) { return gelyk(o.Nommer, n); })
    .sort(function (x, y) { return String(y.Datum).localeCompare(String(x.Datum)); });
}
function notasVir(a, n) {
  return a.notas.filter(function (o) { return gelyk(o.Nommer, n); })
    .sort(function (x, y) { return String(y.Datum).localeCompare(String(x.Datum)); });
}
// Laaste dag van die onttrekkingsperiode na 'n spuit (leeg as daar geen aktiewe onttrekking is nie).
function onttrekkingTot(a, n) {
  const dae = {};
  a.program.forEach(function (o) {
    const p = String(o.Produk).trim();
    const x = Number(o['Onttrekking (dae)']);
    if (!isNaN(x) && x > 0 && (!(p in dae) || x > dae[p])) dae[p] = x;
  });
  let tot = '';
  spuitVir(a, n).forEach(function (o) {
    const d = dae[String(o.Produk).trim()];
    const begin = naDatum(o.Datum);
    if (!d || !begin) return;
    const einde = new Date(begin.getTime() + d * 86400000);
    const s = einde.getFullYear() + '-' + String(einde.getMonth() + 1).padStart(2, '0') + '-' + String(einde.getDate()).padStart(2, '0');
    if (s >= vandag() && s > tot) tot = s;
  });
  return tot;
}

function daeTot(s) {
  const d = naDatum(s);
  return d ? dae(naDatum(vandag()), d) : null;
}
function bestellingPil(o) {
  const n = daeTot(o['Benodig Op']);
  if (n === null) return '';
  if (n < 0) return '<span class="pil rooi">' + (-n) + (n === -1 ? ' dag' : ' dae') + ' laat</span>';
  if (n === 0) return '<span class="pil rooi">Vandag</span>';
  if (n <= 7) return '<span class="pil rooi">Oor ' + n + (n === 1 ? ' dag' : ' dae') + '</span>';
  if (n <= 30) return '<span class="pil oranje">Oor ' + n + ' dae</span>';
  return '<span class="pil groen">' + kortDatum(o['Benodig Op']) + '</span>';
}

function speengewig(a, n) {
  const s = weegVir(a, n).find(function (o) { return o.Rede === 'Speen'; });
  return s ? s['Gewig (kg)'] : '';
}

/* ---------- Seisoene (lam en teel) ----------
   Die Seisoene-oortjie se datums herhaal elke jaar: net dag en maand tel.
   'n Seisoen se naam kry die jaar van sy begin, bv. "Sep 26". */
const VERSTEK_SEISOENE = [
  { Tipe: 'Lam', Seisoen: 'Sep', Begin: '2026-08-20', Einde: '2026-11-04' },
  { Tipe: 'Lam', Seisoen: 'Maart', Begin: '2026-02-20', Einde: '2026-05-06' },
  { Tipe: 'Teel', Seisoen: 'Okt', Begin: '2026-10-15', Einde: '2026-12-01' },
  { Tipe: 'Teel', Seisoen: 'April', Begin: '2026-04-15', Einde: '2026-05-31' },
];
function seisoenDefinisies(rye) {
  const bron = rye.filter(function (o) { return o.Tipe && o.Seisoen && naDatum(o.Begin) && naDatum(o.Einde); });
  return (bron.length ? bron : VERSTEK_SEISOENE).map(function (o) {
    const b = naDatum(o.Begin), e = naDatum(o.Einde);
    return { tipe: String(o.Tipe).trim(), naam: String(o.Seisoen).trim(), bm: b.getMonth(), bd: b.getDate(), em: e.getMonth(), ed: e.getDate() };
  });
}
function datumS(x) { return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
// Een spesifieke jaar se seisoen (begin in 'jaar').
function seisoenIn(def, jaar) {
  const begin = new Date(jaar, def.bm, def.bd);
  let einde = new Date(jaar, def.em, def.ed);
  if (einde < begin) einde = new Date(jaar + 1, def.em, def.ed);
  return { tipe: def.tipe, naam: def.naam + ' ' + String(jaar).slice(-2), begin: datumS(begin), einde: datumS(einde), jaar: jaar, def: def };
}
// Seisoene wat op 'n datum aan die gang is.
function seisoeneOp(a, s) {
  const d = s || vandag();
  const j = Number(d.slice(0, 4));
  const uit = [];
  a.seisoene.forEach(function (def) {
    [j - 1, j].forEach(function (y) { const x = seisoenIn(def, y); if (x.begin <= d && d <= x.einde) uit.push(x); });
  });
  return uit;
}
// Die lamseisoen waaraan 'n geboortedatum behoort: die jongste lamseisoen wat op of voor die datum begin het.
function lamSeisoenVir(a, s) {
  if (!s || !naDatum(s)) return null;
  const j = Number(s.slice(0, 4));
  let beste = null;
  a.seisoene.filter(function (x) { return x.tipe === 'Lam'; }).forEach(function (def) {
    [j - 1, j].forEach(function (y) { const x = seisoenIn(def, y); if (x.begin <= s && (!beste || x.begin > beste.begin)) beste = x; });
  });
  return beste;
}
function seisoenVir(s) { const x = lamSeisoenVir(Afgelei.get(), s); return x ? x.naam : ''; }

/* Die skaap se eie stem */
function stemVan(a, d) {
  const dele = [];
  const soort = d.lam ? (d.geslag === 'Ooi' ? 'ooilam' : d.geslag === 'Hammel' ? 'hammellam' : 'lam')
    : d.groep === 'Ram' ? 'ram' : d.geslag === 'Hammel' ? 'hamel' : d.geslag === 'Ram' ? 'ram' : 'ooi';
  dele.push('Ek is ' + soort + ' ' + d.n + '.');
  if (d.uit === 'Dood') {
    dele.push('Ek is nie meer by die kudde nie' + (d.datumUit ? ' (oorlede ' + mooiDatum(d.datumUit) + ').' : '.'));
    return dele.join(' ');
  }
  if (d.uit === 'Verkoop') {
    dele.push('Ek is verkoop' + (d.datumUit ? ' op ' + mooiDatum(d.datumUit) : '') + '.');
    return dele.join(' ');
  }
  if (d.uit === 'Geskenk') {
    dele.push('Ek is weggegee' + (d.datumUit ? ' op ' + mooiDatum(d.datumUit) : '') + ' en bly in iemand anders se kraal.');
    return dele.join(' ');
  }
  const ou = ouderdomTeks(d);
  if (ou && d.groep) dele.push('Ek is ' + ou + ' oud en in die ' + d.groep + '-groep.');
  else if (ou) dele.push('Ek is ' + ou + ' oud.');
  else if (d.groep) dele.push('Ek is in die ' + d.groep + '-groep.');
  if (d.lam && d.ma) dele.push('My ma is ooi ' + d.ma + '.');
  if (!d.lam && d.geslag === 'Ooi') {
    const n = d.lammers.length;
    if (n) dele.push('Ek het al ' + n + (n === 1 ? ' lam' : ' lammers') + ' gehad.');
  }
  if (d.verwek) dele.push('Ek is pa van ' + d.verwek + (d.verwek === 1 ? ' lam.' : ' lammers.'));
  if (d.siek) dele.push(d.siek === 'Siek' ? 'Ek voel nie lekker nie.' : 'Ek word tans behandel.');
  if (d.nieGelam) dele.push('Ek het in die afgelope jaar nie gelam nie.');
  const sp = spuitVir(a, d.n)[0];
  if (sp) dele.push('My laaste spuit was ' + sp.Produk + ' op ' + mooiDatum(sp.Datum) + '.');
  const w = weegVir(a, d.n)[0];
  if (w) dele.push('Ek het ' + syferTeks(w['Gewig (kg)']) + ' kg geweeg op ' + kortDatum(w.Datum) + '.');
  return dele.join(' ');
}
