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

  // Extra tokens: {o:x} agreement ("arruinad{o:b}"), {0s:x} bare plural ("palomas").
  function fill(tpl, x, key = 'x') {
    const s = typeof x === 'string' ? x : render(x);
    const bare = typeof x === 'string' ? x.replace(/^(el |la |los |las )/, '') : render({ ...x, art: '' });
    const indef = typeof x === 'string' ? x : un(x);
    const o = typeof x === 'string' ? 'o' : (x.g === 'f' ? 'a' : 'o') + (x.pl ? 's' : '');
    return tpl.replaceAll(`{de:${key}}`, de(s)).replaceAll(`{a:${key}}`, a(s))
      .replaceAll(`{un:${key}}`, indef).replaceAll(`{dun:${key}}`, `de ${indef}`).replaceAll(`{o:${key}}`, o)
      .replaceAll(`{0s:${key}}`, typeof x === 'string' ? x : x.pl ? x.noun : plural(x.noun))
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
      .replaceAll('{de:w}', de(el)).replaceAll('{a:w}', a(el)).replaceAll('{d:w}', `de ${w}`)
      .replaceAll('{W}', upperFirst(w)).replaceAll('{w}s', /s$/.test(w) ? w : plural(w)).replaceAll('{w}', w)
      .replaceAll('{Who}', who).replaceAll('{who}', lowerFirst(who))
      .replaceAll('{where}', pick(WHERE)).replaceAll('{When}', pick(WHEN))
      .replace(/(^|\s)a el(?=\s)/g, '$1al').replace(/(^|\s)de el(?=\s)/g, '$1del'); // "a el portero" -> "al portero"
  }

  // Everyday style. [word, article, gender, type: day | event | food | thing | tech | animal | weather]
  const EVERYDAY_WORDS = [
    ['lunes', 'el', 'm', 'day'], ['domingo', 'el', 'm', 'day'], ['viernes', 'el', 'm', 'day'], ['sábado', 'el', 'm', 'day'],
    ['cumpleaños', 'el', 'm', 'day'], ['puente', 'el', 'm', 'day'],
    ['siesta', 'la', 'f', 'event'], ['reunión', 'la', 'f', 'event'], ['karaoke', 'el', 'm', 'event'], ['abrazo', 'el', 'm', 'event'],
    ['cotilleo', 'el', 'm', 'event'], ['colada', 'la', 'f', 'event'], ['atasco', 'el', 'm', 'event'], ['fiesta', 'la', 'f', 'event'],
    ['cola', 'la', 'f', 'event'], ['boda', 'la', 'f', 'event'], ['barbacoa', 'la', 'f', 'event'], ['hipo', 'el', 'm', 'event'],
    ['bostezo', 'el', 'm', 'event'], ['estornudo', 'el', 'm', 'event'], ['mudanza', 'la', 'f', 'event'], ['resaca', 'la', 'f', 'event'],
    ['bocadillo', 'el', 'm', 'food'], ['pizza', 'la', 'f', 'food'], ['café', 'el', 'm', 'food'], ['galleta', 'la', 'f', 'food'],
    ['tortilla', 'la', 'f', 'food'], ['churro', 'el', 'm', 'food'], ['tapa', 'la', 'f', 'food'], ['aperitivo', 'el', 'm', 'food'],
    ['merienda', 'la', 'f', 'food'], ['croqueta', 'la', 'f', 'food'], ['magdalena', 'la', 'f', 'food'], ['tostada', 'la', 'f', 'food'],
    ['gofre', 'el', 'm', 'food'], ['fideo', 'el', 'm', 'food'], ['paella', 'la', 'f', 'food'],
    ['sofá', 'el', 'm', 'thing'], ['calcetín', 'el', 'm', 'thing'], ['paraguas', 'el', 'm', 'thing'], ['almohada', 'la', 'f', 'thing'],
    ['nevera', 'la', 'f', 'thing'], ['autobús', 'el', 'm', 'thing'], ['manta', 'la', 'f', 'thing'], ['patinete', 'el', 'm', 'thing'],
    ['metro', 'el', 'm', 'thing'], ['armario', 'el', 'm', 'thing'], ['taza', 'la', 'f', 'thing'], ['zapatilla', 'la', 'f', 'thing'],
    ['mochila', 'la', 'f', 'thing'], ['ascensor', 'el', 'm', 'thing'], ['tetera', 'la', 'f', 'thing'], ['globo', 'el', 'm', 'thing'],
    ['selfi', 'el', 'm', 'tech'], ['batería', 'la', 'f', 'tech'], ['meme', 'el', 'm', 'tech'], ['correo', 'el', 'm', 'tech'],
    ['móvil', 'el', 'm', 'tech'], ['contraseña', 'la', 'f', 'tech'], ['cargador', 'el', 'm', 'tech'], ['portátil', 'el', 'm', 'tech'],
    ['emoji', 'el', 'm', 'tech'], ['impresora', 'la', 'f', 'tech'], ['wifi', 'el', 'm', 'tech'], ['notificación', 'la', 'f', 'tech'],
    ['gato', 'el', 'm', 'animal'], ['perro', 'el', 'm', 'animal'], ['paloma', 'la', 'f', 'animal'], ['hámster', 'el', 'm', 'animal'],
    ['pingüino', 'el', 'm', 'animal'], ['llama', 'la', 'f', 'animal'], ['ardilla', 'la', 'f', 'animal'], ['pato', 'el', 'm', 'animal'],
    ['caracol', 'el', 'm', 'animal'],
    ['nube', 'la', 'f', 'weather'], ['charco', 'el', 'm', 'weather'], ['llovizna', 'la', 'f', 'weather'], ['tormenta', 'la', 'f', 'weather'],
    ['niebla', 'la', 'f', 'weather'], ['granizo', 'el', 'm', 'weather'], ['bochorno', 'el', 'm', 'weather'],
    ['chaparrón', 'el', 'm', 'weather'], ['arcoíris', 'el', 'm', 'weather'],
  ];
  // Meanings for blends: a = the first word, b = the second (the head); a/b list the word types that fit.
  const EVERYDAY = {
    words: EVERYDAY_WORDS.map(([w, art, g, cat]) => ({ w, x: np(art, w, g), cat })),
    suffixes: [
      { form: 'ito', fem: 'ita', pos: 'n.m.', posFem: 'n.f.',
        gloss: ['una versión diminuta y entrañable {de:x}',
          { t: '{un:x} que cabe en el bolsillo', a: ['food', 'thing', 'tech', 'animal', 'weather'] }] },
      { form: 'ero', pos: 'n.m.', gloss: ['alguien que vive para {x}', 'un coleccionista apasionado de {0s:x}'] },
      { form: 'ería', pos: 'n.f.', gloss: ['una tienda dedicada solo {a:x}', 'una pequeña fábrica artesanal de {0s:x}'] },
      { form: 'ada', pos: 'n.f.', gloss: ['una fiesta enorme en honor {de:x}', 'una batalla campal a golpe de {0:x}'] },
      { form: 'ismo', pos: 'n.m.', gloss: ['la creencia de que todo mejora con {un:x}', 'un partido político que promete {un:x} para todos'] },
      { form: 'ear', pos: 'v.', gloss: ['comportarse como {un:x}', 'pasarse el día pensando en {0s:x}'] },
      { form: 'oso', pos: 'adj.', gloss: ['que tiene toda la energía {dun:x}', 'que recuerda vagamente a {un:x}'] },
      { form: 'core', pos: 'n.m.', gloss: ['una estética construida por completo en torno {a:x}', 'un género musical que solo habla {de:x}'] },
      { form: 'azo', pos: 'n.m.', gloss: ['un golpe de suerte relacionado con {x}', 'el golpe que te das con {un:x}'] },
      { form: 'nado', pos: 'n.m.', gloss: ['un tornado repentino de {0s:x}', 'el caos que llega cuando hay {0s:x} por todas partes'] },
      { form: 'landia', pos: 'n.f.', gloss: ['un lugar donde todo gira en torno {a:x}', 'el rincón de la cabeza donde vive {x}'] },
      { form: 'logía', pos: 'n.f.', gloss: ['el estudio muy serio {de:x}', 'una carrera que nadie pidió, dedicada por completo {a:x}'] },
      { form: 'tástico', pos: 'adj.', gloss: ['tan genial como {un:x} un viernes', 'lleno a rebosar de {0s:x}'] },
      { form: 'zilla', pos: 'n.m.', gloss: ['un monstruo hecho por completo de {0s:x}', '{un:x} que ha crecido demasiado'] },
      { form: 'ón', pos: 'n.m.', gloss: ['{un:x} enorme y algo exagerad{o:x}', '{un:x} tamaño familiar'] },
    ],
    prefixes: [
      { form: 'mega', gloss: ['{un:x} gigante', '{un:x} que dará que hablar durante años'] },
      { form: 'mini', gloss: ['{un:x} en miniatura',
        { t: '{un:x} tan pequeñ{o:x} que cabe en la mano', a: ['food', 'thing', 'tech', 'animal', 'weather'] }] },
      { form: 'super', gloss: ['{un:x} con superpoderes', '{un:x} fuera de serie'] },
      { form: 'anti', gloss: ['lo contrario {dun:x}', 'un producto que te protege contra {0s:x}'] },
      { form: 're', gloss: ['{un:x} otra vez', '{un:x} más que nadie había pedido'] },
      { form: 'sobre', gloss: ['demasiad{o:x} {0:x}', { t: '{un:x} que dura demasiado', a: ['event'] }] },
      { form: 'des', gloss: ['la sensación {dun:x} que desaparece', 'algo que no es en absoluto {un:x}'] },
      { form: 'semi', gloss: ['medio {0:x}, medio otra cosa', '{un:x} que solo funciona a medias'] },
    ],
    mixes: [
      '{un:b} que siempre acaba en {0:a}', 'lo que pasa cuando {a} se cruza con {b}', '{un:b} con toda la energía {dun:a}',
      'el momento en que descubres que {b} es en realidad {un:a}',
      { t: '{un:b} con {un:a} como única comida', a: ['food'], b: ['event'] },
      { t: '{un:a} que solo hace falta durante {un:b}', a: ['thing'], b: ['event'] },
      { t: '{un:b} arruinad{o:b} por {un:a}', a: ['weather'], b: ['event'] },
      { t: '{un:b} que {un:a} ha reclamado como suy{o:b}', a: ['animal'], b: ['thing'] },
      { t: '{un:b} pasad{o:b} mirando {un:a}', a: ['tech'], b: ['event'] },
      { t: 'la sensación {dun:a} en medio {dun:b}', a: ['event'], b: ['event'] },
      { t: '{un:b} que siempre huele un poco a {0:a}', a: ['food'], b: ['thing'] },
      { t: '{un:b} que siempre aparece donde debería estar {un:a}', a: ['thing'], b: ['thing'] },
      { t: '{un:b} bajo la atenta mirada {dun:a}', a: ['animal'], b: ['event'] },
      { t: '{un:b} que hay que cargar más a menudo que {un:a}', a: ['tech'], b: ['thing'] },
      { t: '{un:b} que aparece de la nada, como {un:a}', a: ['weather'] },
      { t: '{un:b} con un sospechoso sabor a {0:a}', b: ['food'] },
      { t: '{un:b} que solo tiene sentido {a}', a: ['day'] },
      { t: '{un:b} que {un:a} ya ha lamido', a: ['animal'], b: ['food'] },
      { t: '{un:b} que ha aprendido a usar {un:a}', a: ['tech'], b: ['animal'] },
      { t: '{un:b} que solo encuentras después de {un:a}', a: ['weather'], b: ['thing'] },
      { t: '{un:b} capaz de todo por {un:a}', a: ['food'], b: ['animal'] },
      { t: '{un:b} que parece durar una semana por culpa de {un:a}', b: ['day'] },
    ],
    join(word, suffix) {
      let w = word.replace(/[áéíóú](?=[ns]?$)/, c => UNACCENT[c]); // reunión -> reunion + ero
      if (/[aeiou]$/.test(w) && /^[aeiouáéíóú]/.test(suffix)) w = w.slice(0, -1);
      return w + suffix;
    },
    joinPrefix: (pre, word) => (pre.at(-1) === word[0] ? pre + word.slice(1) : pre + word), // des + siesta
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
    'ev:nado': ['{When}, un {w} azotó el pueblo y nadie fue a trabajar.', 'El parte meteorológico anuncia un {w} {where}.'],
    'ev:landia': ['{Who} vive en {W} desde hace años.', '¡Bienvenidos a {W}, donde todo el mundo se conoce!'],
    'ev:logía': ['{Who} tiene un doctorado en {w}.', 'El departamento de {w} {where} tiene un profesor y tres gatos.'],
    'ev:tástico': ['El ambiente {where} era totalmente {w}.', '{Who} dice que el nuevo menú es {w}.'],
    'ev:zilla': ['{When}, {who} creó un {w} por accidente.', 'El {w} fue visto por última vez {where}.'],
    'ev:ón': ['{Who} se pidió un {w} {where}.', 'Nada como un buen {w} para empezar la semana.'],
    'ev:pre': ['Nadie estaba preparado para {el:w} {where}.', '{Who} todavía habla {de:w} de 1987.',
      '{When}, {un:w} lo cambió todo.', 'Si alguna vez te cruzas con {un:w}, mantén la calma y retrocede despacio.',
      '{Who} jura haber visto {un:w} {where}.', 'El periódico local dedicó una página entera {a:w}.',
      'Hubo {un:w} {where}, y las fotos son increíbles.', 'Todo el mundo tiene una historia de {w} que contar.'],
    'ev:mix': ['{Who} inventó {el:w} {where}, y desde entonces no se habla de otra cosa.',
      '{When}, todo el mundo empezó a hablar {de:w}.', 'Pregunta a cualquiera {where}: todo el mundo tiene una historia de {w}.',
      'Nada estropea una tarde tranquila como {un:w} por sorpresa.',
      '{Who} jura que {el:w} es lo mejor que ha pasado {where} en años.',
      'No hay manera educada de explicarle {un:w} a tu jefe.',
      '{When}, {who} subió una foto {de:w} y se hizo viral.',
      'En todas las oficinas hay al menos {un:w}, y todo el mundo hace como si nada.',
      '{Who} colecciona {w}s desde hace años.', 'No has vivido de verdad hasta que no has probado {un:w} {where}.'],
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
