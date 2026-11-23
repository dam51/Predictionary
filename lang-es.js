// Spanish language pack for the Predictionary engine (load after engine.js).
'use strict';

(function registerSpanish(Predictionary) {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const lowerFirst = s => s[0].toLowerCase() + s.slice(1);
  const upperFirst = s => s[0].toUpperCase() + s.slice(1);
  const UNACCENT = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' };

  // Noun phrases are objects so adjectives can agree: { art, noun, g: 'm'|'f', pl, pre, post: [adj], compl }.
  const np = (art, noun, g, pl = false) => ({ art, noun, g, pl, pre: '', post: [], compl: '' });
  const adj = (m, f = m, inv = false) => ({ m, f, inv });

  function plural(form) {
    if (/[aeiouáéó]$/.test(form)) return form + 's';
    if (form.endsWith('z')) return form.slice(0, -1) + 'ces'; // veloz -> veloces
    const m = form.match(/([áéíóú])([ns])$/); // común -> comunes
    if (m) return form.slice(0, -2) + UNACCENT[m[1]] + m[2] + 'es';
    return form + 'es';
  }

  const agree = (a, n) => {
    const form = n.g === 'f' ? a.f : a.m;
    return n.pl && !a.inv ? form.split(' ').map((w, i) => (i === 0 ? plural(w) : w)).join(' ') : form;
  };
  const render = n => [n.art, n.pre + n.noun, ...n.post.map(a => agree(a, n)), n.compl].filter(Boolean).join(' ');

  // "de" + "el fuego" = "del fuego"; "a" + "el sol" = "al sol".
  const de = s => (s.startsWith('el ') ? `del ${s.slice(3)}` : `de ${s}`);
  const a = s => (s.startsWith('el ') ? `al ${s.slice(3)}` : `a ${s}`);

  // {un:x} "una siesta", {dun:x} "de una siesta": indefinite forms of a noun phrase.
  const un = x => `${x.pl ? (x.g === 'f' ? 'unas' : 'unos') : x.g === 'f' ? 'una' : 'un'} ${render({ ...x, art: '' })}`;

  function fill(tpl, x, key = 'x') {
    const s = typeof x === 'string' ? x : render(x);
    const bare = typeof x === 'string' ? x.replace(/^(el |la |los |las )/, '') : render({ ...x, art: '' });
    const indef = typeof x === 'string' ? x : un(x);
    return tpl.replaceAll(`{de:${key}}`, de(s)).replaceAll(`{a:${key}}`, a(s))
      .replaceAll(`{un:${key}}`, indef).replaceAll(`{dun:${key}}`, `de ${indef}`)
      .replaceAll(`{d0:${key}}`, de(bare)).replaceAll(`{0:${key}}`, bare).replaceAll(`{${key}}`, s);
  }

  const pref = (form, gloss, keys) => ({
    form, kind: 'prefix', keys: keys.split(' '), link: '',
    ...(typeof gloss === 'string' ? { hyphen: gloss, gloss: gloss.trim() } : { adj: gloss, gloss: gloss.m }),
  });
  const root = (form, link, n, ad, keys) => ({ form, kind: 'root', keys: keys.split(' '), link, np: n, adj: ad,
    gloss: render(n) });
  const suff = (form, gloss, keys, link = '') => ({ form, kind: 'suffix', gloss, keys: keys.split(' '), link });

  const MORPHEMES = [
    pref('in', 'no ', 'no sin'),
    pref('re', adj('renovado', 'renovada'), 'otra vez vuelta'),
    pref('pre', adj('precoz'), 'antes temprano'),
    pref('post', adj('tardío', 'tardía'), 'después tarde'),
    pref('anti', 'anti', 'contra'),
    pref('hiper', adj('excesivo', 'excesiva'), 'demasiado exceso'),
    pref('hipo', adj('insuficiente'), 'insuficiente falta'),
    pref('micro', adj('en miniatura', 'en miniatura', true), 'pequeño pequeña diminuto'),
    pref('mega', adj('gigante'), 'enorme gigante grande'),
    pref('neo', adj('inédito', 'inédita'), 'nuevo nueva moderno'),
    pref('pseudo', adj('falso', 'falsa'), 'falso falsa'),
    pref('auto', adj('autónomo', 'autónoma'), 'propio automático'),
    pref('tele', adj('lejano', 'lejana'), 'lejos distancia lejano'),
    pref('omni', adj('universal'), 'todo todos todas'),
    pref('trans', adj('transfronterizo', 'transfronteriza'), 'través allá'),
    pref('inter', adj('compartido', 'compartida'), 'entre'),
    pref('poli', adj('múltiple'), 'varios muchos múltiples'),
    pref('mono', adj('único', 'única'), 'solo único'),
    pref('semi', 'semi', 'medio mitad'),
    pref('meta', 'meta', 'meta'),
    pref('dis', adj('defectuoso', 'defectuosa'), 'difícil roto'),
    pref('eu', adj('benéfico', 'benéfica'), 'bueno buena agradable'),

    root('acua', '', np('el', 'agua', 'f'), adj('acuático', 'acuática'), 'agua'),
    root('hidr', 'o', np('el', 'agua', 'f'), adj('líquido', 'líquida'), 'agua'),
    root('pir', 'o', np('el', 'fuego', 'm'), adj('ígneo', 'ígnea'), 'fuego'),
    root('terr', 'o', np('la', 'tierra', 'f'), adj('terrestre'), 'tierra suelo'),
    root('aer', 'o', np('el', 'aire', 'm'), adj('aéreo', 'aérea'), 'aire'),
    root('cron', 'o', np('el', 'tiempo', 'm'), adj('temporal'), 'tiempo'),
    root('fon', 'o', np('el', 'sonido', 'm'), adj('sonoro', 'sonora'), 'sonido voz ruido'),
    root('fot', 'o', np('la', 'luz', 'f'), adj('luminoso', 'luminosa'), 'luz'),
    root('graf', 'o', np('la', 'escritura', 'f'), adj('manuscrito', 'manuscrita'), 'escritura escribir dibujo'),
    root('bibli', 'o', np('los', 'libros', 'm', true), adj('libresco', 'libresca'), 'libro'),
    root('bio', 'o', np('la', 'vida', 'f'), adj('vivo', 'viva'), 'vida vivir'),
    root('necr', 'o', np('los', 'muertos', 'm', true), adj('póstumo', 'póstuma'), 'muerte muerto'),
    root('antrop', 'o', np('los', 'humanos', 'm', true), adj('humano', 'humana'), 'humano gente persona'),
    root('dem', 'o', np('el', 'pueblo', 'm'), adj('popular'), 'pueblo multitud público'),
    root('geront', 'o', np('la', 'vejez', 'f'), adj('anciano', 'anciana'), 'viejo vieja vejez'),
    root('cardi', 'o', np('el', 'corazón', 'm'), adj('cardíaco', 'cardíaca'), 'corazón'),
    root('cefal', 'o', np('la', 'cabeza', 'f'), adj('cerebral'), 'cabeza'),
    root('ocul', 'o', np('el', 'ojo', 'm'), adj('visual'), 'ojo'),
    root('quir', 'o', np('la', 'mano', 'f'), adj('manual'), 'mano'),
    root('pod', 'o', np('el', 'pie', 'm'), adj('peatonal'), 'pie'),
    root('dent', 'i', np('los', 'dientes', 'm', true), adj('dental'), 'diente'),
    root('somn', 'i', np('el', 'sueño', 'm'), adj('somnoliento', 'somnolienta'), 'sueño dormir siesta'),
    root('noct', 'i', np('la', 'noche', 'f'), adj('nocturno', 'nocturna'), 'noche'),
    root('heli', 'o', np('el', 'sol', 'm'), adj('solar'), 'sol'),
    root('lun', 'i', np('la', 'luna', 'f'), adj('lunar'), 'luna'),
    root('astr', 'o', np('las', 'estrellas', 'f', true), adj('estelar'), 'estrella espacio'),
    root('cosm', 'o', np('el', 'universo', 'm'), adj('cósmico', 'cósmica'), 'universo mundo cosmos'),
    root('xen', 'o', np('los', 'extranjeros', 'm', true), adj('extranjero', 'extranjera'), 'extranjero forastero'),
    root('ciber', 'o', np('los', 'ordenadores', 'm', true), adj('digital'), 'ordenador computadora digital internet'),
    root('tecn', 'o', np('la', 'tecnología', 'f'), adj('tecnológico', 'tecnológica'), 'tecnología técnica máquina'),
    root('cript', 'o', np('los', 'secretos', 'm', true), adj('secreto', 'secreta'), 'secreto oculto'),
    root('cine', '', np('el', 'movimiento', 'm'), adj('inquieto', 'inquieta'), 'movimiento mover'),
    root('morf', 'o', np('la', 'forma', 'f'), adj('cambiante'), 'forma'),
    root('crom', 'o', np('el', 'color', 'm'), adj('colorido', 'colorida'), 'color'),
    root('zo', 'o', np('los', 'animales', 'm', true), adj('animal'), 'animal'),
    root('fit', 'o', np('las', 'plantas', 'f', true), adj('vegetal'), 'planta'),
    root('ictio', '', np('los', 'peces', 'm', true), adj('escamoso', 'escamosa'), 'pez peces'),
    root('ornit', 'o', np('los', 'pájaros', 'm', true), adj('alado', 'alada'), 'pájaro ave'),
    root('aracn', 'o', np('las', 'arañas', 'f', true), adj('de ocho patas', 'de ocho patas', true), 'araña'),
    root('cin', 'o', np('los', 'perros', 'm', true), adj('canino', 'canina'), 'perro'),
    root('ailur', 'o', np('los', 'gatos', 'm', true), adj('felino', 'felina'), 'gato'),
    root('gastr', 'o', np('el', 'estómago', 'm'), adj('gastronómico', 'gastronómica'), 'estómago comida comer'),
    root('eno', '', np('el', 'vino', 'm'), adj('achispado', 'achispada'), 'vino'),
    root('cafe', '', np('el', 'café', 'm'), adj('cafeinado', 'cafeinada'), 'café'),
    root('erg', 'o', np('el', 'trabajo', 'm'), adj('laborioso', 'laboriosa'), 'trabajo curro'),
    root('sin', 'o', np('las', 'reuniones', 'f', true), adj('colectivo', 'colectiva'), 'reunión juntos'),
    root('lex', 'i', np('las', 'palabras', 'f', true), adj('verbal'), 'palabra vocabulario diccionario'),
    root('mnem', 'o', np('la', 'memoria', 'f'), adj('medio olvidado', 'medio olvidada'), 'memoria recuerdo'),
    root('pecun', 'i', np('el', 'dinero', 'm'), adj('financiero', 'financiera'), 'dinero'),
    root('cris', 'o', np('el', 'oro', 'm'), adj('dorado', 'dorada'), 'oro'),
    root('taqu', 'i', np('la', 'velocidad', 'f'), adj('veloz'), 'velocidad rápido'),
    root('bradi', '', np('la', 'lentitud', 'f'), adj('lento', 'lenta'), 'lento lentitud'),
    root('clept', 'o', np('el', 'robo', 'm'), adj('robado', 'robada'), 'robo robar'),
    root('psic', 'o', np('la', 'mente', 'f'), adj('mental'), 'mente alma'),
    root('sof', 'o', np('la', 'sabiduría', 'f'), adj('sabio', 'sabia'), 'sabiduría sabio'),
    root('tox', 'i', np('el', 'veneno', 'm'), adj('tóxico', 'tóxica'), 'veneno tóxico'),
    root('hebdom', 'o', np('la', 'semana', 'f'), adj('semanal'), 'semana lunes'),

    suff('fobia', 'el miedo {a:x}', 'miedo asustado fobia', 'o'),
    suff('filia', 'la pasión por {x}', 'amor pasión amar', 'o'),
    suff('ófilo', 'un amante {de:x}', 'amante fan aficionado'),
    suff('logía', 'el estudio {de:x}', 'estudio ciencia', 'o'),
    suff('ólogo', 'un especialista en {x}', 'experto especialista'),
    suff('manía', 'una obsesión por {x}', 'obsesión locura manía', 'o'),
    suff('cracia', 'el poder ejercido por {x}', 'poder gobierno reinado', 'o'),
    suff('grafía', 'un escrito sobre {x}', 'descripción relato', 'o'),
    suff('scopio', 'un instrumento para observar {x}', 'ver observar instrumento', 'o'),
    suff('ómetro', 'un aparato que mide {x}', 'medida medir'),
    suff('cida', 'la destrucción {de:x}', 'matar asesinato', 'i'),
    suff('ívoro', 'un devorador {d0:x}', 'devorador comedor'),
    suff('algia', 'un dolor causado por {x}', 'dolor'),
    suff('itis', 'una inflamación {de:x}', 'inflamación'),
    suff('ismo', 'la doctrina {de:x}', 'creencia doctrina movimiento'),
    suff('idad', 'el carácter {de:x}', 'calidad estado'),
    suff('ificar', 'convertir en {0:x}', 'convertir volver transformar'),
    suff('trón', 'un artilugio dedicado {a:x}', 'aparato artilugio', 'o'),
    suff('ario', 'un lugar dedicado {a:x}', 'lugar sala casa'),
    suff('esfera', 'el mundo {de:x}', 'comunidad ambiente', 'o'),
    suff('ógeno', 'que produce {0:x}', 'producir causar'),
    suff('nauta', 'un viajero a través {de:x}', 'viajero explorador', 'o'),
  ];
  const PREFIXES = MORPHEMES.filter(x => x.kind === 'prefix');
  const ROOTS = MORPHEMES.filter(x => x.kind === 'root');
  const SUFFIXES = MORPHEMES.filter(x => x.kind === 'suffix');
  const POS = { fobia: 'n.f.', filia: 'n.f.', ófilo: 'n.m.', logía: 'n.f.', ólogo: 'n.m.', manía: 'n.f.',
    cracia: 'n.f.', grafía: 'n.f.', scopio: 'n.m.', ómetro: 'n.m.', cida: 'n.m.', ívoro: 'n.m.', algia: 'n.f.',
    itis: 'n.f.', ismo: 'n.m.', idad: 'n.f.', ificar: 'v.', trón: 'n.m.', ario: 'n.m.', esfera: 'n.f.',
    ógeno: 'adj.', nauta: 'n.m.', '': 'n.m.' };

  const FAMILIES = [
    ['logía', 'ólogo', 'lógico', 'lógica', 'ólogos', 'logías', 'logista'], ['fobia', 'fobo', 'fóbico', 'fobias'],
    ['filia', 'ófilo', 'fílico', 'ófilos'], ['manía', 'maníaco', 'maniaco'], ['grafía', 'ógrafo', 'gráfico'],
    ['cracia', 'crata', 'crático'], ['ismo', 'ista', 'ístico', 'ismos'], ['ómetro', 'metría', 'métrico'],
    ['scopio', 'scopia', 'scópico'], ['cida', 'cidio'], ['ívoro', 'ívora', 'ívoros'], ['algia', 'álgico'],
    ['itis', 'ítico'], ['nauta', 'náutica', 'náutico'], ['ógeno', 'génico', 'génesis', 'ógena'],
    ['ificar', 'ificación', 'ificado'], ['esfera', 'esférico'], ['ario', 'aria', 'arios'], ['trón', 'trónica'],
    ['idad', 'idades'], ['izar', 'ización', 'izado'],
  ];

  // Two roots: the last is the head, the first modifies it in one of these ways.
  const ACTIONS = [['mejora', 'f'], ['medición', 'f'], ['embotellado', 'm'], ['traducción', 'f'],
    ['domesticación', 'f'], ['reorganización', 'f'], ['reciclaje', 'm'], ['contrabando', 'm'], ['pulido', 'm'],
    ['previsión', 'f'], ['catalogación', 'f'], ['reinvención', 'f'], ['endulzamiento', 'm'], ['interrogatorio', 'm']];
  const RELATIONS = ['al servicio', 'bajo la influencia', 'a la manera', 'a cambio', 'con aroma', 'en memoria',
    'en busca', 'en el corazón', 'procedente', 'a imagen'];

  function relate(roots) {
    const head = roots[roots.length - 1];
    const n = { ...head.np, post: [] };
    if (roots.length === 1) return n;
    const mods = roots.slice(0, -1);
    const style = roots.length > 2 ? 0 : Math.floor(Math.random() * 3);
    if (style === 1) {
      const [noun, g] = pick(ACTIONS);
      return { ...np(g === 'f' ? 'la' : 'el', noun, g), post: [mods[0].adj], compl: de(render(n)) };
    }
    if (style === 2) return { ...n, compl: `${pick(RELATIONS)} ${de(render(mods[0].np))}` };
    return { ...n, post: mods.map(r => r.adj) };
  }

  function describe(pre, roots, suf) {
    const n = roots.length ? relate(roots) : np('las', 'cosas', 'f', true);
    if (pre && pre.hyphen) n.pre = pre.hyphen;
    else if (pre) n.post = [...n.post, pre.adj];
    if (suf) return [n, fill(suf.gloss, n)];
    return [n, roots.length > 1 ? `un nombre para ${render(n)}` : `algo que tiene que ver con ${render(n)}`];
  }

  // Sentence slots: {w} word, {el:w}/{El:w}/{un:w} with the word's gender, {de:w}/{a:w} contracted, {d:w} "de"
  // + bare word, {x} meaning, {de:x}/{a:x}/{0:x}, {Who}/{who}, {where}, {When}.
  const WHO = ['Mi abuela', 'El portero de noche', 'Un piloto jubilado', 'Nuestro nuevo vecino',
    'La panadera del pueblo', 'Un contable agotado', 'El farero', 'Mi dentista', 'Una estudiante de filosofía',
    'La alcaldesa', 'Un mago ambulante', 'El conserje del colegio', 'Una chef famosa', 'El casero',
    'Una astronauta de vacaciones', 'El vigilante del museo', 'Un taxista de Oporto', 'La directora del coro',
    'Mi hermano pequeño', 'Un detective medio jubilado'];
  const WHERE = ['en Lisboa', 'en las fiestas del pueblo', 'en el tren nocturno a Viena', 'en un sótano de Bilbao',
    'al fondo de la biblioteca', 'en un ferri a Tánger', 'en el vestíbulo de un hotel de Tokio',
    'en el concurso anual de pesca', 'en la cocina de la oficina', 'a mitad de una montaña',
    'en una boda en Nápoles', 'en una lavandería de Valencia'];
  const WHEN = ['El invierno pasado', 'Todos los martes', 'Desde el apagón', 'El día del cambio de hora',
    'Mucho antes de internet', 'Durante la ola de calor', 'La mañana después de la boda',
    'A la tercera semana de huelga', 'En la primavera de 1987', 'Poco después de ganar la lotería'];

  const EXAMPLES = {
    fobia: [
      '{Who} desarrolló {un:w} {where} y ahora evita todo lo relacionado con {x}.',
      '{When}, {who} por fin confesó su {w}: solo pensar en {x} le da escalofríos.',
      'No es pereza, es {w}: nada le asusta tanto como {x}.'],
    filia: [
      '{Who} confesó {un:w} de toda la vida; el desván está lleno de cosas relacionadas con {x}.',
      '{When}, {who} descubrió {el:w} y ahora organiza sus vacaciones en torno {a:x}.',
      'Todo empezó con una sola postal sobre {x}: así nació {el:w}.'],
    ófilo: [
      '{Who}, {w} de toda la vida, tiene un álbum entero dedicado {a:x}.',
      'Todos los {w}s {where} vinieron a discutir sobre {x} hasta medianoche.',
      'Solo un auténtico {w} cruzaría un continente por {x}.'],
    logía: [
      '{Who} dio una charla sorprendentemente emotiva sobre {el:w} {where}.',
      '{El:w} sigue siendo un campo pequeño: una docena de investigadores, una revista y debates sin fin sobre {x}.',
      '{When}, la universidad abrió discretamente un departamento {d:w}.'],
    ólogo: [
      '{El:w} más prestigioso {where} es, contra todo pronóstico, {who}.',
      '{When}, {un:w} de paso explicó {x} con tanta claridad que la sala se quedó en silencio.',
      'Pregúntale a {un:w} por {x} y despeja tu tarde.'],
    manía: [
      '{When}, {el:w} arrasó en el país: colas, camisetas y nada más que {x}.',
      'Los economistas atribuyeron la escasez {a:w}, una fiebre repentina por {x}.',
      '{Who} jura que no es {w}, solo un sano interés por {x}.'],
    cracia: [
      '{When}, la isla probó {el:w} y dejó que {x} lo decidiera todo.',
      'Los críticos {de:w} creen que nunca hay que confiar el presupuesto {a:x}.',
      'Bajo {el:w}, las reuniones se volvieron más cortas y más raras.'],
    grafía: [
      '{Who} pasó el invierno escribiendo una breve {w}: cuarenta páginas sobre {x}.',
      '{El:w} que escribió ganó un premio {where}, sobre todo por sus notas a pie de página.',
      'La sección de {w} de la biblioteca ocupa una sola estantería y siempre está llena.'],
    scopio: [
      '{Who} acercó el ojo {a:w} y por fin vio {x} con claridad.',
      'El museo conserva {un:w} antiguo que antes se usaba para observar {x}.',
      'Inclina un poco {el:w}: de repente, todo se ve nítido.'],
    ómetro: [
      '{Who} fabricó {un:w} casero y las mediciones son preocupantes.',
      '{When}, cada hogar recibió {un:w} para vigilar {x}.',
      'La aguja {de:w} temblaba en cuanto alguien hablaba {de:x}.'],
    cida: [
      'El giro de la novela es {un:w} lento y metódico: la destrucción progresiva {de:x}.',
      'Acusaron a {who} {de:w} tras el incidente {where}.',
      'Unos activistas exigen el fin {de:w}.'],
    ívoro: [
      '{Who}, {w} de toda la vida, solo pide {x}.',
      'El nuevo {w} del zoo lo rechaza todo excepto {x}.',
      'Como {w} convencido, le decepcionan casi todos los menús.'],
    algia: [
      '{Who} se tomó la tarde libre por {un:w}, un dolor sordo causado por {x}.',
      'El médico {where} diagnosticó {un:w} y recetó una semana lejos {de:x}.',
      '{When}, una ola {d:w} golpeó la oficina.'],
    itis: [
      'Demasiada exposición {a:x} y te arriesgas a {un:w}, avisó {who}.',
      '{When}, {who} pilló {un:w} muy persistente.',
      'No hay remedio para {el:w}, solo descanso y distancia con {x}.'],
    ismo: [
      'Los seguidores {de:w} se reúnen {where} para hablar {de:x}.',
      '{Who} se convirtió {a:w} tras una larga charla sobre {x}.',
      'En el fondo, {el:w} sostiene que todo se reduce {a:x}.'],
    idad: [
      'Aquella noche reinaba una extraña {w}, como un aroma {de:x} en el aire.',
      '{When}, una suave {w} se instaló en la ciudad.',
      'Los poetas llevan siglos intentando poner {el:w} en palabras.'],
    ificar: [
      'El ayuntamiento quiere {w} la calle mayor llenándola {de:x}.',
      '{Who} decidió {w} el cuarto de invitados; ahora todo gira en torno {a:x}.',
      'Déjale un fin de semana y lo va a {w} todo.'],
    trón: [
      '{Who} construyó {un:w} con piezas sueltas, un artilugio dedicado {a:x}.',
      '{El:w} zumbaba en un rincón {where}, ocupándose discretamente {de:x}.',
      '{When}, {el:w} se convirtió en el regalo imprescindible.'],
    ario: [
      '{El:w} que acaban de abrir {where} es el sitio ideal para {x}.',
      '{Who} pasó toda una tarde en {el:w}, en medio {de:x}.',
      'Todas las excursiones escolares terminan en {el:w}.'],
    esfera: [
      'En {el:w}, todo el mundo tiene una opinión tajante sobre {x}.',
      '{Who} es toda una celebridad en {el:w}.',
      '{When}, {el:w} se vio sacudida por un escándalo relacionado con {x}.'],
    ógeno: [
      'El proyecto resultó muy {w}: producía {0:x} allá por donde pasaba.',
      '{Who} tiene un efecto {w} en cualquier habitación.',
      'Cuidado: esa receta tiene fama de ser {w}.'],
    nauta: [
      'El primer {w} de la historia trajo relatos increíbles sobre {x}.',
      '{When}, {un:w} solitario volvió con historias sobre {x}.',
      'Hacerse {w} lleva años y un estómago de hierro.'],
    '': [
      'Nadie tenía una palabra para {x} hasta que {who} dijo «{w}» {where}, y se quedó.',
      '{When}, no se hablaba de otra cosa que {de:w} {where}.',
      '{Who} guarda un tarro {d:w} en la estantería de la cocina, por si acaso.',
      'La pieza central de la exposición era {un:w} gigante, una meditación sobre {x}.'],
  };

  const recent = [];

  function example(key, w, core, pos) {
    const all = EXAMPLES[key];
    const fresh = all.filter(t => !recent.includes(t));
    const t = pick(fresh.length ? fresh : all);
    recent.push(t);
    if (recent.length > 12) recent.shift();
    const fem = (pos || POS[key]) === 'n.f.';
    const el = `${fem ? 'la' : 'el'} ${w}`;
    const who = pick(WHO);
    return fill(t, core)
      .replaceAll('{El:w}', upperFirst(el)).replaceAll('{el:w}', el).replaceAll('{un:w}', `${fem ? 'una' : 'un'} ${w}`)
      .replaceAll('{de:w}', de(el)).replaceAll('{a:w}', a(el)).replaceAll('{d:w}', `de ${w}`).replaceAll('{w}', w)
      .replaceAll('{Who}', who).replaceAll('{who}', lowerFirst(who))
      .replaceAll('{where}', pick(WHERE)).replaceAll('{When}', pick(WHEN))
      .replace(/(^|\s)a el(?=\s)/g, '$1al').replace(/(^|\s)de el(?=\s)/g, '$1del'); // "a el portero" -> "al portero"
  }

  // Everyday style. [word, article, gender, is an event]
  const EVERYDAY_WORDS = [
    ['lunes', 'el', 'm', 1], ['siesta', 'la', 'f', 1], ['sofá', 'el', 'm'], ['reunión', 'la', 'f', 1],
    ['calcetín', 'el', 'm'], ['cola', 'la', 'f'], ['paraguas', 'el', 'm'], ['bocadillo', 'el', 'm'], ['selfi', 'el', 'm'],
    ['gato', 'el', 'm'], ['pizza', 'la', 'f'], ['café', 'el', 'm'], ['nube', 'la', 'f'], ['charco', 'el', 'm'],
    ['metro', 'el', 'm'], ['aperitivo', 'el', 'm', 1], ['almohada', 'la', 'f'], ['merienda', 'la', 'f', 1],
    ['batería', 'la', 'f'], ['meme', 'el', 'm'], ['abrazo', 'el', 'm'], ['correo', 'el', 'm'], ['llovizna', 'la', 'f', 1],
    ['domingo', 'el', 'm', 1], ['galleta', 'la', 'f'], ['karaoke', 'el', 'm', 1], ['nevera', 'la', 'f'],
    ['autobús', 'el', 'm'], ['cotilleo', 'el', 'm'], ['colada', 'la', 'f'], ['atasco', 'el', 'm', 1],
    ['tortilla', 'la', 'f'], ['churro', 'el', 'm'], ['fiesta', 'la', 'f', 1], ['playa', 'la', 'f'], ['móvil', 'el', 'm'],
    ['contraseña', 'la', 'f'], ['manta', 'la', 'f'], ['patinete', 'el', 'm'], ['tapa', 'la', 'f'],
  ];
  const EVERYDAY = {
    words: EVERYDAY_WORDS.map(([w, art, g, event]) => ({ w, x: np(art, w, g), event: !!event })),
    suffixes: [
      { form: 'ito', fem: 'ita', pos: 'n.m.', posFem: 'n.f.', gloss: 'una versión diminuta y entrañable {de:x}' },
      { form: 'ero', pos: 'n.m.', gloss: 'alguien que vive para {x}' },
      { form: 'ería', pos: 'n.f.', gloss: 'una tienda dedicada solo {a:x}' },
      { form: 'ada', pos: 'n.f.', gloss: 'una fiesta enorme en honor {de:x}' },
      { form: 'ismo', pos: 'n.m.', gloss: 'la creencia de que todo mejora con {un:x}' },
      { form: 'ear', pos: 'v.', gloss: 'comportarse como {un:x}' },
      { form: 'oso', pos: 'adj.', gloss: 'que tiene toda la energía {dun:x}' },
      { form: 'core', pos: 'n.m.', gloss: 'una estética construida por completo en torno {a:x}' },
      { form: 'azo', pos: 'n.m.', gloss: 'un golpe de suerte relacionado con {x}' },
    ],
    mixes: ['{un:b} que siempre acaba en {0:a}', '{un:b} con toda la energía {dun:a}',
      'lo que pasa cuando {a} se cruza con {b}', { t: 'la sensación {dun:a} en medio {dun:b}', event: true }],
    join(word, suffix) {
      let w = word.replace(/[áéíóú](?=[ns]?$)/, c => UNACCENT[c]); // reunión -> reunion + ero
      if (/[aeiou]$/.test(w) && /^[aeiouáéíóú]/.test(suffix)) w = w.slice(0, -1);
      return w + suffix;
    },
    mixPos: b => (b.x.g === 'f' ? 'n.f.' : 'n.m.'),
  };
  Object.assign(EXAMPLES, {
    'ev:ito': ['{Who} se regaló {un:w} {where}.', 'Nada mejor que {un:w} un domingo por la mañana.'],
    'ev:ero': ['Todos los {w}s {where} llegaron temprano.', 'En el club de {w}s {where} no cabe ni un alfiler.'],
    'ev:ería': ['Acaba de abrir una {w} diminuta {where}.', '{Who} pasa todos los sábados en la {w}.'],
    'ev:ada': ['{When}, el pueblo celebró su primera {w}.', 'La gran {w} {where} agotó las entradas en una hora.'],
    'ev:ismo': ['{Who} predica {el:w} a quien quiera escucharle.', '{When}, {el:w} se convirtió en la religión oficiosa del pueblo.'],
    'ev:ear': ['{Who} decidió {w} toda la tarde {where}.', 'El nuevo jefe quiere {w} en cada reunión.'],
    'ev:oso': ['Solo es martes, pero el ambiente en la oficina es muy {w}.', 'Hay días {w}s y días normales.'],
    'ev:core': ['{When}, {el:w} invadió todas las cafeterías {where}.', 'Su piso es {w} puro, hasta las cortinas.'],
    'ev:azo': ['{Who} tuvo {un:w} increíble {where}.', 'Todo el mundo recuerda el gran {w} de 1987.'],
    'ev:mix': ['{Who} inventó {el:w} {where}, y desde entonces no se habla de otra cosa.',
      '{When}, todo el mundo empezó a hablar {de:w}.', 'Pregunta a cualquiera {where}: todo el mundo tiene una historia de {w}.'],
  });

  // Endings for Invent words built on a real word ("pobre" + "ismo"). {b} is the real word.
  const AFFIX_SUFFIXES = [
    ['idad', 'n.f.', 'el hecho de ser {b}'], ['ismo', 'n.m.', 'una filosofía basada por completo en la idea de {b}'],
    ['ista', 'n.m.', 'un seguidor incondicional de la idea de {b}'], ['izar', 'v.', 'volver algo {b} a propósito'],
    ['izado', 'adj.', 'vuelto {b} a propósito'], ['ización', 'n.f.', 'el lento proceso que vuelve las cosas {b}'],
    ['ificar', 'v.', 'añadirle a algo un toque de {b}'], ['ero', 'n.m.', 'un vendedor ambulante de {b}'],
    ['era', 'n.f.', 'una caja para guardar {b}'], ['ería', 'n.f.', 'una fábrica de {b}'],
    ['ito', 'n.m.', 'una versión diminuta de {b}'], ['ita', 'n.f.', 'una versión diminuta de {b}'],
    ['esco', 'adj.', 'al estilo de {b}'], ['oso', 'adj.', 'lleno de {b}'], ['osa', 'adj.', 'llena de {b}'],
    ['ico', 'adj.', 'con aire de {b}'], ['al', 'adj.', 'relacionado con la idea de {b}'],
    ['mente', 'adv.', 'de manera {b}'], ['able', 'adj.', 'que podría volverse {b} fácilmente'],
    ['ible', 'adj.', 'que podría volverse {b} fácilmente'], ['aje', 'n.m.', 'una gran cantidad de {b}'],
    ['ada', 'n.f.', 'una fiesta ruidosa en torno a {b}'], ['azo', 'n.m.', 'un golpe dado con {b}'],
    ['miento', 'n.m.', 'lo que pasa cuando se abusa de {b}'], ['ción', 'n.f.', 'el arte de volver las cosas {b}'],
    ['ura', 'n.f.', 'lo que queda de {b}'], ['oide', 'adj.', 'con forma de {b}'],
    ['logía', 'n.f.', 'el estudio de {b}'], ['fobia', 'n.f.', 'el miedo a {b}'], ['manía', 'n.f.', 'una obsesión por {b}'],
    ['ear', 'v.', 'actuar a la manera de {b}'], ['ar', 'v.', 'convertir algo en {b}'],
  ].sort((x, y) => y[0].length - x[0].length);
  // {r} is the meaning of the rest of the word.
  const AFFIX_PREFIXES = [
    ['in', 'no {r}'], ['im', 'no {r}'], ['des', 'lo contrario de «{r}»'], ['re', '{r}, una vez más'],
    ['sobre', 'demasiado {r}'], ['sub', 'no lo bastante {r}'], ['pre', '{r}, antes de que se pusiera de moda'],
    ['anti', 'contra todo lo {r}'], ['super', 'extremadamente {r}'], ['contra', '{r} al revés'],
    ['co', '{r}, entre varios'], ['entre', '{r} entre amigos'], ['inter', '{r} entre vecinos'],
    ['archi', '{r} hasta el extremo'], ['neo', '{r}, versión moderna'], ['mal', '{r}, pero torcido'],
  ];

  Predictionary.LANGS.es = {
    vowels: new Set('aeiouyáéíóúü'), morphemes: MORPHEMES, prefixes: PREFIXES, roots: ROOTS,
    suffixes: SUFFIXES, pos: POS, nounPos: 'n.m.', pluralPos: 'n. pl.', families: FAMILIES,
    affixSuffixes: AFFIX_SUFFIXES, affixPrefixes: AFFIX_PREFIXES,
    compounds: ['{b} con un toque de {a}', '{b} al estilo {a}', 'el tipo de {b} que solo se encuentra cerca de {a}',
      'una especie de {b}, pero {a}'],
    fallbacks: ['todo lo que te recuerda a «{b}» sin motivo aparente',
      'el momento en que algo casi se convierte en «{b}», y al final no',
      'un primo lejano de «{b}», de la rama de la familia de la que nadie habla',
      'aquello en lo que se convierte «{b}» después de medianoche'],
    unknown: ['una palabra que todavía espera su significado', 'algo que nadie se había molestado en nombrar hasta ahora',
      'un ruido que suena a palabra y que podría llegar a serlo'],
    soundsLike: 'se parece a', blend: 'palabra combinada de {a} y {b}', minBase: 4,
    avoid: new Set('pedo culo mierda puta puto coño polla joder cabrón verga pene teta tetas'.split(' ')),
    stopwords: new Set(('el la los las lo un una unos unas de del al a y o en con sin para por que qué quien es son ' +
      'ser cosa cosas algo muy tipo como este esta estos estas su sus mi mis').split(' ')),
    stem: t => {
      const n = t.match(/([aeiou])nes$/); // reuniones -> reunión, jardines -> jardín
      if (n && t.length > 5) return t.slice(0, -4) + { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }[n[1]] + 'n';
      if (t.endsWith('ces') && t.length > 4) return t.slice(0, -3) + 'z';
      if (/[^aeiou]es$/.test(t) && t.length > 4) return t.slice(0, -2);
      return t.endsWith('s') && t.length > 3 ? t.slice(0, -1) : t;
    },
    tokens: s => s.toLowerCase().match(/[a-záéíóúüñ]+/g) || [],
    describe, example, fill, everyday: EVERYDAY,
    plural: w => (w.endsWith('ces') ? w.slice(0, -3) + 'z' : /[^aeiou]es$/.test(w) ? w.slice(0, -2)
      : /[aeiou]s$/.test(w) ? w.slice(0, -1) : ''),
    inflected: (w, v) => (w.endsWith('s') && v.has(w.slice(0, -1))) || (w.endsWith('es') && v.has(w.slice(0, -2)))
      || (w.endsWith('a') && v.has(w.slice(0, -1) + 'o')) || (w.endsWith('as') && v.has(w.slice(0, -2) + 'o')),
  };
}(typeof module !== 'undefined' ? require('./engine.js').Predictionary : Predictionary));
