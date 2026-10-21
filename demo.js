/* Skaap se Praat – voorbeelddata vir toetsmodus */
'use strict';

// 'n Kopie van die regte sheet (word deur die voorskou ingevul).
let MOMENTOPNAME = null;
let MOMENTOPNAME_TYD = '';

function demoData() {
  if (MOMENTOPNAME) return JSON.parse(JSON.stringify(MOMENTOPNAME));
  const d = leegData();
  d['Spuit Program'] = { kop: ['Program', 'Produk', 'Beskrywing', 'Onttrekking (dae)', 'Ouderdom', 'Teiken groepe',
    'Groot Ooi', 'Dosis (ml)', 'Ram', 'Dosis (ml)', 'Ooi Lam by MA', 'Dosis (ml)', 'Hammel Lam by MA', 'Dosis (ml)', 'Hans Lam', 'Dosis (ml)',
    'Gespeende Ooi Lam', 'Dosis (ml)', 'Gespeende Hammel Lam', 'Dosis (ml)'], rye: [] };
  d.Aksies = { kop: ['Van', 'Tot', 'Aksie'], rye: [] };
  d.Ram = { kop: ['Teel Seisoen', 'Begin Datum', 'Eind Datum'], rye: [] };
  let r = 2;
  const ry = function (naam, w) { d[naam].rye.push({ r: r++, w: w }); };
  const jaar = new Date().getFullYear();
  const dt = function (m, dag, j) { return (j || jaar) + '-' + String(m).padStart(2, '0') + '-' + String(dag).padStart(2, '0'); };

  // Register: Nommer, Geslag, Groep, Geboorte, Ouderdom, Lammers Totaal, History, Vlag, Status, Dood/Verkoop, Datum Uit, Herkoms, Datum Bygevoeg
  const ooie = [101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112];
  ooie.forEach(function (n, i) { ry('Register', [n, 'Ooi', 'Groot Ooi', dt(9, 1 + i, jaar - 2 - (i % 4)), '', '', false, '', '', '', '', 'Reeds op plaas', dt(1, 10, jaar - 2)]); });
  ry('Register', [201, 'Ram', 'Ram', dt(3, 5, jaar - 3), '', '', false, '', '', '', '', 'Gekoop', dt(2, 1, jaar - 2)]);
  ry('Register', [202, 'Ram', 'Ram', '', 4, '', false, '', '', '', '', 'Reeds op plaas', dt(1, 10)]);
  [301, 302, 303, 304].forEach(function (n, i) { ry('Register', [n, i % 2 ? 'Hammel' : 'Ooi', i % 2 ? 'Gespeende Hammel Lam' : 'Gespeende Ooi Lam', dt(3, 10 + i), '', '', false, '', '', '', '', 'Gebore (gespeen)', dt(6, 1)]); });
  ry('Register', [113, 'Ooi', 'Groot Ooi', '', 7, '', false, '', '', 'Dood', dt(7, 14), 'Reeds op plaas', dt(1, 10)]);
  ry('Register', [114, 'Ooi', 'Om te verkoop', '', 6, '', false, '', '', '', '', 'Reeds op plaas', dt(1, 10), 'Gereed']);
  ry('Register', [115, 'Ooi', 'Om te verkoop', '', 5, '', false, '', '', '', '', 'Reeds op plaas', dt(1, 10), 'Nie gereed']);
  ry('Register', [305, 'Hammel', 'Gespeende Hammel Lam', dt(3, 12), '', '', false, '', '', 'Verkoop', dt(8, 20), 'Gebore (gespeen)', dt(6, 1)]);

  // Lam: ID, Ma, Pa, Geboorte, Seisoen, Tipe, Lam Nommer, Groep, Kondisie, Lam Nota, Rekord Nota, Ooi Probleem
  r = 2;
  ry('Lam', ['', 109, 201, dt(3, 2, jaar - 1), 'MaartApr', '', 290, 'Ooi Lam by MA', 'Mooi', '', '', '']);
  ry('Lam', ['', 101, 201, dt(3, 10), 'MaartApr', '', 301, 'Ooi Lam by MA', 'Mooi', '', '', '']);
  ry('Lam', ['', 101, 201, dt(3, 10), 'MaartApr', '', 302, 'Hammel Lam by MA', 'Swak/Klein', '', '', '']);
  ry('Lam', ['', 102, 201, dt(3, 11), 'MaartApr', '', 303, 'Ooi Lam by MA', 'Mooi', '', '', '']);
  ry('Lam', ['', 103, 201, dt(3, 12), 'MaartApr', '', 304, 'Hammel Lam by MA', 'Mooi', '', '', 'Verwerp lam']);
  ry('Lam', ['', 104, 202, dt(3, 12), 'MaartApr', '', 305, 'Hammel Lam by MA', 'Mooi', '', '', '']);
  ry('Lam', ['', 105, 202, dt(3, 14), 'MaartApr', '', '', '', 'Dood gebore', '', 'Moeilike geboorte', '']);
  const m = new Date().getMonth() + 1;
  ry('Lam', ['', 106, 201, dt(m, 2), 'SeptOkt', '', 401, 'Ooi Lam by MA', 'Mooi', '', '', '']);
  ry('Lam', ['', 106, 201, dt(m, 2), 'SeptOkt', '', 402, 'Ooi Lam by MA', 'Mooi', '', '', '']);
  ry('Lam', ['', 107, 201, dt(m, 4), 'SeptOkt', '', 403, 'Hammel Lam by MA', 'Mooi', '', '', 'Droog (geen melk)']);
  ry('Lam', ['', 108, 202, dt(m, 6), 'SeptOkt', '', 404, 'Hans Lam', 'Swak/Klein', '', 'Ma het nie melk nie', '']);

  r = 2;
  // Spuit Program
  const sp = function (prog, prod, besk, ont, groepe, dosis) {
    const w = [prog, prod, besk, ont, '', groepe.join(', ')];
    ['Groot Ooi', 'Ram', 'Ooi Lam by MA', 'Hammel Lam by MA', 'Hans Lam', 'Gespeende Ooi Lam', 'Gespeende Hammel Lam'].forEach(function (g) {
      w.push(groepe.indexOf(g) >= 0); w.push(groepe.indexOf(g) >= 0 ? dosis : '');
    });
    ry('Spuit Program', w);
  };
  sp('Feb Spuit Program', 'Glanvac 3', 'Bloednier, tetanus, kaasagtige limfadenitis', 0, ['Groot Ooi', 'Ram', 'Gespeende Ooi Lam', 'Gespeende Hammel Lam'], 1);
  sp('Feb Spuit Program', 'Multimin', '1 ml/25 kg', '', ['Groot Ooi', 'Ram'], 3);
  sp('Aug Spuit Program', 'Multivax P', '', 21, ['Groot Ooi', 'Ram'], 2);
  sp('Aug Spuit Program', 'Bloutong A', '', 21, ['Groot Ooi', 'Ram', 'Gespeende Ooi Lam', 'Gespeende Hammel Lam'], 2);
  sp('Speen Spuit Program', 'Multimin', '', '', ['Gespeende Ooi Lam', 'Gespeende Hammel Lam'], 1);
  sp('Buite Program', 'Terramycin LA', 'Antibiotika', 28, [], '');

  r = 2;
  // Spuit Register
  const grp = function (gs) { return ['Groot Ooi', 'Ram', 'Ooi Lam by MA', 'Hammel Lam by MA', 'Hans Lam', 'Gespeende Ooi Lam', 'Gespeende Hammel Lam'].map(function (g) { return gs.indexOf(g) >= 0; }); };
  ry('Spuit Register', [dt(2, 3), 'Feb Spuit Program', 'Glanvac 3', ''].concat(grp(['Groot Ooi', 'Ram']), ['Groot Ooi, Ram', 1, 15, '101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 201, 202', 'App', '']));
  ry('Spuit Register', [dt(6, 2), 'Speen Spuit Program', 'Multimin', ''].concat(grp(['Gespeende Ooi Lam', 'Gespeende Hammel Lam']), ['Gespeende Ooi Lam, Gespeende Hammel Lam', 1, 5, '301, 302, 303, 304, 305', 'App', '']));
  ry('Spuit Register', [dt(m, 8), 'Buite Program', 'Terramycin LA', 115].concat(grp([]), ['', 5, 1, '115', 'App', 'Klouseer']));
  ry('Spuit Register', [dt(m, 3), 'Buite Program', 'Terramycin LA', 109].concat(grp([]), ['', 5, 1, '109', 'Siek diere ry 2', 'Mank']));

  r = 2;
  // Siek diere
  ry('Siek diere', [dt(m, 3), 109, '', 'Mank op linker voorpoot', 'Pote nagegaan', 'Onder behandeling', '', 'Terramycin LA', 5]);
  ry('Siek diere', [dt(m, 5), 404, '', 'Swak, drink nie', 'Bottel gegee', 'Siek', '', '', '']);
  ry('Siek diere', [dt(7, 14), 113, '', 'Bloednier', '', 'Dood', dt(7, 14), '', '']);

  r = 2;
  ry('Weeg', [dt(6, 1), 301, 24.5, 'Speen']);
  ry('Weeg', [dt(6, 1), 302, 21, 'Speen']);
  ry('Weeg', [dt(6, 1), 303, 26, 'Speen']);
  ry('Weeg', [dt(6, 1), 304, 25.5, 'Speen']);
  ry('Weeg', [dt(8, 20), 305, 38, 'Verkoop']);
  ry('Weeg', [dt(m, 1), 101, 62, 'Gewone weging']);

  r = 2;
  ry('Notas', [dt(5, 2), 101, 'Baie mak ooi, goeie ma.']);
  ry('Notas', [dt(m, 1), 101, 'Kloue geknip.']);

  r = 2;
  ry('Verkoop', [dt(8, 20), 305, 'Jan Botha', '', 1900, 38, 50, true]);

  d.Bestellings = leegData().Bestellings;
  r = 2;
  const plus = function (n) { const x = new Date(); x.setDate(x.getDate() + n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
  ry('Bestellings', [plus(-10), 'Piet van der Merwe', '082 555 1234', plus(4), 10, 'Hamels ±40 kg', 'Vir troue', 'Oop', '']);
  ry('Bestellings', [plus(-3), 'Sanna Botha', '', plus(25), 3, 'Jong ooie', '', 'Oop', '']);
  ry('Bestellings', [plus(-1), 'Kerk basaar', '', plus(60), 2, 'Slagskape', '', 'Oop', '']);
  r = 2;
  ry('Aksies', [dt(9, 1), dt(10, 15), 'Maxi Blocks by ooie']);
  ry('Aksies', [dt(12, 1), '', 'Speen lammers']);
  ry('Aksies', [dt(10, 15), dt(11, 30), 'Ram in']);
  ry('Aksies', [dt(4, 15), dt(5, 31), 'Ram in']);
  ry('Aksies', [dt(3, 1), dt(5, 15), 'Lamseisoen']);
  ry('Aksies', [dt(8, 1), dt(9, 30), 'Lamseisoen']);

  r = 2;
  ry('Seisoene', ['Lam', 'Sep', dt(8, 20), dt(11, 4), '']);
  ry('Seisoene', ['Lam', 'Maart', dt(2, 20), dt(5, 6), '']);
  ry('Seisoene', ['Teel', 'Okt', dt(10, 15), dt(12, 1), '']);
  ry('Seisoene', ['Teel', 'April', dt(4, 15), dt(5, 31), '']);
  r = 2;
  ry('Seisoen Notas', [dt(5, 10), 'Maart ' + String(jaar).slice(-2), 'Goeie seisoen, min verliese. Een moeilike geboorte by 105.']);
  r = 2;
  ry('Siektes', ['Bloednier', 'Skielike dood, krampe, kop agteroor, diarree', 'Lente; na reën as die veld vinnig groei', 'Glanvac 3, Multivax P (skraag na 4-6 weke)', 'Veral by vet lammers']);
  ry('Siektes', ['Bloutong', 'Koors, geswelde kop en lippe, blou tong, mank', 'Laat somer en herfs (muggies)', 'Bloutong A, B en C (Onderstepoort)', 'Nie op dragtige ooie in eerste helfte nie']);
  r = 2;
  ry('Skenkings', [dt(6, 15), 304, 'Kerk basaar', 'Vir die basaar', '']);
  // Siek groep
  r = d['Siek diere'].rye.length + 2;
  ry('Siek diere', [dt(m, 10), '', 'Gespeende Hammel Lam', 'Hoes en loopneus', 'Uitgesonder in kampie', 'Onder behandeling', '', 'Terramycin LA', 3]);
  r = 2;
  ry('Skeer', [dt(8, 12), 'Groot Ooi, Ram', 14, 'Skeerder Koos']);
  r = 2;
  ry('Wol', [dt(8, 12), 'AM', 162, '1', dt(8, 30), '']);
  ry('Wol', [dt(8, 12), 'BM', 158, '2', '', '']);
  ry('Wol', [dt(8, 12), 'BP', 74, '3', '', '']);
  r = 2;
  ry('Ram', ['Oktober Teel Seisoen', dt(10, 15), dt(11, 30)]);
  ry('Ram', ['April Teel Seisoen', dt(4, 15), dt(5, 31)]);
  return d;
}

/* In toetsmodus word die bewerkings net plaaslik toegepas. */
function demoSink() {
  const data = Toestand.bediener || leegData();
  Toestand.uitboks.forEach(function (op) { try { pasPlaaslikToe(data, op); } catch (e) { /* ignoreer */ } });
  Toestand.bediener = data;
  Toestand.uitboks = [];
  Toestand.laasteSink = new Date().toISOString();
  Afgelei.ongeldig();
  App.herteken();
}
