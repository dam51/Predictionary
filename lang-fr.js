// French language pack for the Predictionary engine (load after engine.js).
'use strict';

(function registerFrench(Predictionary) {
  const ELIDE = /^[aeiouyàâäéèêëîïôöùûüœæh]/i;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const lowerFirst = s => s[0].toLowerCase() + s.slice(1);
  const upperFirst = s => s[0].toUpperCase() + s.slice(1);

  // Noun phrases are objects so adjectives can agree: { art, noun, g: 'm'|'f', pl, pre, post: [adj], compl }.
  const np = (art, noun, g, pl = false) => ({ art, noun, g, pl, pre: '', post: [], compl: '' });
  const adj = (m, f = m, inv = false) => ({ m, f, inv });

  function agree(a, n) {
    let form = n.g === 'f' ? a.f : a.m;
    if (!n.pl || a.inv || /[sx]$/.test(form)) return form;
    if (n.g === 'm' && form.endsWith('al')) return form.slice(0, -2) + 'aux'; // cérébral -> cérébraux
    return form + (form.endsWith('eau') ? 'x' : 's');
  }

  function render(n) {
    const body = [n.pre + n.noun, ...n.post.map(a => agree(a, n)), n.compl].filter(Boolean).join(' ');
    if (!n.art) return body;
    if (n.art === 'les') return `les ${body}`;
    return ELIDE.test(body) ? `l'${body}` : `${n.art} ${body}`;
  }

  // "de" + "le feu" = "du feu"; "à" + "les chats" = "aux chats"; bare words just elide ("d'or").
  const de = s => (s.startsWith('le ') ? `du ${s.slice(3)}` : s.startsWith('les ') ? `des ${s.slice(4)}`
    : ELIDE.test(s) ? `d'${s}` : `de ${s}`);
  const a = s => (s.startsWith('le ') ? `au ${s.slice(3)}` : s.startsWith('les ') ? `aux ${s.slice(4)}` : `à ${s}`);

  // {un:x} "une sieste", {dun:x} "d'une sieste": indefinite forms of a noun phrase.
  const un = x => `${x.pl ? 'des' : x.g === 'f' ? 'une' : 'un'} ${render({ ...x, art: '' })}`;
  const nounPlural = n => (/[sxz]$/.test(n) ? n : /(eau|eu)$/.test(n) ? `${n}x` : /al$/.test(n) ? `${n.slice(0, -2)}aux` : `${n}s`);

  // Extra tokens: {e:x} agreement ("gâché{e:b}"), {qun:x} "qu'un chat", {0s:x} bare plural "pigeons".
  function fill(tpl, x, key = 'x') {
    const s = typeof x === 'string' ? x : render(x);
    const bare = typeof x === 'string' ? x.replace(/^(le |la |les |l')/, '') : render({ ...x, art: '' });
    const indef = typeof x === 'string' ? x : un(x);
    const e = typeof x === 'string' ? '' : (x.g === 'f' ? 'e' : '') + (x.pl ? 's' : '');
    return tpl.replaceAll(`{de:${key}}`, de(s)).replaceAll(`{a:${key}}`, a(s))
      .replaceAll(`{un:${key}}`, indef).replaceAll(`{dun:${key}}`, x.pl ? `de ${bare}` : de(indef))
      .replaceAll(`{qun:${key}}`, x.pl ? `que ${indef}` : `qu'${indef}`).replaceAll(`{e:${key}}`, e)
      .replaceAll(`{0s:${key}}`, typeof x === 'string' ? x : nounPlural(x.noun))
      .replaceAll(`{d0:${key}}`, de(bare)).replaceAll(`{0:${key}}`, bare).replaceAll(`{${key}}`, s)
      .replace(/(^|\s)([Qq]u|[Dd])e (?=[aeiouàâéèêîôûœ])/gi, "$1$2'");
  }

  const pref = (form, gloss, keys) => ({
    form, kind: 'prefix', keys: keys.split(' '), link: '',
    ...(typeof gloss === 'string' ? { hyphen: gloss, gloss } : { adj: gloss, gloss: gloss.m }),
  });
  const root = (form, link, n, ad, keys) => ({ form, kind: 'root', keys: keys.split(' '), link, np: n, adj: ad,
    gloss: render(n) });
  const suff = (form, gloss, keys, link = '') => ({ form, kind: 'suffix', gloss, keys: keys.split(' '), link });

  const MORPHEMES = [
    pref('in', 'non-', 'non pas'),
    pref('re', adj('renouvelé', 'renouvelée'), 'encore retour'),
    pref('pré', adj('précoce'), 'avant tôt'),
    pref('post', adj('tardif', 'tardive'), 'après tard'),
    pref('anti', 'anti-', 'contre'),
    pref('hyper', adj('excessif', 'excessive'), 'trop excès'),
    pref('hypo', adj('insuffisant', 'insuffisante'), 'insuffisant manque'),
    pref('micro', adj('miniature'), 'petit petite minuscule'),
    pref('méga', adj('géant', 'géante'), 'énorme géant grand grande'),
    pref('néo', adj('inédit', 'inédite'), 'nouveau nouvelle moderne'),
    pref('pseudo', adj('factice'), 'faux fausse'),
    pref('auto', adj('autonome'), 'soi automatique'),
    pref('télé', adj('lointain', 'lointaine'), 'loin distance lointain'),
    pref('omni', adj('universel', 'universelle'), 'tout tous toutes'),
    pref('trans', adj('transfrontalier', 'transfrontalière'), 'travers delà'),
    pref('inter', adj('partagé', 'partagée'), 'entre parmi'),
    pref('mé', adj('erroné', 'erronée'), 'mal erreur'),
    pref('poly', adj('multiple'), 'plusieurs multiples nombreux'),
    pref('mono', adj('unique'), 'seul unique'),
    pref('semi', 'demi-', 'moitié demi'),
    pref('méta', 'méta-', 'méta'),
    pref('dys', adj('défaillant', 'défaillante'), 'difficile cassé'),
    pref('eu', adj('bienfaisant', 'bienfaisante'), 'bon bonne agréable'),

    root('aqua', 'o', np('la', 'eau', 'f'), adj('aquatique'), 'eau'),
    root('hydr', 'o', np('la', 'eau', 'f'), adj('liquide'), 'eau'),
    root('pyr', 'o', np('le', 'feu', 'm'), adj('igné', 'ignée'), 'feu'),
    root('terr', 'o', np('la', 'terre', 'f'), adj('terrestre'), 'terre sol'),
    root('aér', 'o', np('le', 'air', 'm'), adj('aérien', 'aérienne'), 'air'),
    root('chron', 'o', np('le', 'temps', 'm'), adj('temporel', 'temporelle'), 'temps'),
    root('phon', 'o', np('le', 'son', 'm'), adj('sonore'), 'son voix bruit'),
    root('phot', 'o', np('la', 'lumière', 'f'), adj('lumineux', 'lumineuse'), 'lumière'),
    root('graph', 'o', np('la', 'écriture', 'f'), adj('manuscrit', 'manuscrite'), 'écriture écrire dessin'),
    root('bibli', 'o', np('les', 'livres', 'm', true), adj('livresque'), 'livre'),
    root('bio', 'o', np('la', 'vie', 'f'), adj('vivant', 'vivante'), 'vie vivant'),
    root('nécr', 'o', np('les', 'morts', 'm', true), adj('posthume'), 'mort'),
    root('anthrop', 'o', np('les', 'humains', 'm', true), adj('humain', 'humaine'), 'humain gens personne'),
    root('dém', 'o', np('le', 'peuple', 'm'), adj('populaire'), 'peuple foule public'),
    root('gér', 'o', np('la', 'vieillesse', 'f'), adj('âgé', 'âgée'), 'vieux vieille vieillesse âgé'),
    root('cardi', 'o', np('le', 'cœur', 'm'), adj('cardiaque'), 'cœur coeur'),
    root('céphal', 'o', np('la', 'tête', 'f'), adj('cérébral', 'cérébrale'), 'tête'),
    root('ocul', 'o', np('le', 'œil', 'm'), adj('visuel', 'visuelle'), 'œil oeil yeux'),
    root('chir', 'o', np('la', 'main', 'f'), adj('manuel', 'manuelle'), 'main'),
    root('pod', 'o', np('le', 'pied', 'm'), adj('pédestre'), 'pied'),
    root('dent', 'i', np('les', 'dents', 'f', true), adj('dentaire'), 'dent'),
    root('somn', 'i', np('le', 'sommeil', 'm'), adj('somnolent', 'somnolente'), 'sommeil dormir sieste'),
    root('noct', 'i', np('la', 'nuit', 'f'), adj('nocturne'), 'nuit'),
    root('héli', 'o', np('le', 'soleil', 'm'), adj('solaire'), 'soleil'),
    root('lun', 'i', np('la', 'lune', 'f'), adj('lunaire'), 'lune'),
    root('astr', 'o', np('les', 'étoiles', 'f', true), adj('stellaire'), 'étoile espace'),
    root('cosm', 'o', np('le', 'univers', 'm'), adj('cosmique'), 'univers monde cosmos'),
    root('xén', 'o', np('les', 'étrangers', 'm', true), adj('étranger', 'étrangère'), 'étranger'),
    root('cyber', 'o', np('les', 'ordinateurs', 'm', true), adj('numérique'), 'ordinateur numérique internet'),
    root('techn', 'o', np('la', 'technologie', 'f'), adj('technologique'), 'technologie technique machine'),
    root('crypt', 'o', np('les', 'secrets', 'm', true), adj('secret', 'secrète'), 'secret caché'),
    root('ciné', 'o', np('le', 'mouvement', 'm'), adj('agité', 'agitée'), 'mouvement bouger'),
    root('morph', 'o', np('la', 'forme', 'f'), adj('changeant', 'changeante'), 'forme'),
    root('chrom', 'o', np('la', 'couleur', 'f'), adj('coloré', 'colorée'), 'couleur'),
    root('zo', 'o', np('les', 'animaux', 'm', true), adj('animal', 'animale'), 'animal'),
    root('phyt', 'o', np('les', 'plantes', 'f', true), adj('végétal', 'végétale'), 'plante'),
    root('ichty', 'o', np('les', 'poissons', 'm', true), adj('écailleux', 'écailleuse'), 'poisson'),
    root('ornith', 'o', np('les', 'oiseaux', 'm', true), adj('ailé', 'ailée'), 'oiseau'),
    root('arachn', 'o', np('les', 'araignées', 'f', true), adj('à huit pattes', 'à huit pattes', true), 'araignée'),
    root('cyn', 'o', np('les', 'chiens', 'm', true), adj('canin', 'canine'), 'chien'),
    root('ailur', 'o', np('les', 'chats', 'm', true), adj('félin', 'féline'), 'chat'),
    root('gastr', 'o', np('le', 'estomac', 'm'), adj('gastronomique'), 'estomac nourriture manger'),
    root('œn', 'o', np('le', 'vin', 'm'), adj('aviné', 'avinée'), 'vin'),
    root('café', 'i', np('le', 'café', 'm'), adj('caféiné', 'caféinée'), 'café'),
    root('erg', 'o', np('le', 'travail', 'm'), adj('laborieux', 'laborieuse'), 'travail boulot'),
    root('syn', 'o', np('les', 'réunions', 'f', true), adj('collectif', 'collective'), 'réunion ensemble'),
    root('lex', 'i', np('les', 'mots', 'm', true), adj('verbal', 'verbale'), 'mot vocabulaire dictionnaire'),
    root('mném', 'o', np('la', 'mémoire', 'f'), adj('à moitié oublié', 'à moitié oubliée'), 'mémoire souvenir'),
    root('pécun', 'i', np('le', 'argent', 'm'), adj('financier', 'financière'), 'argent'),
    root('chrys', 'o', np('le', 'or', 'm'), adj('doré', 'dorée'), 'or'),
    root('tach', 'y', np('la', 'vitesse', 'f'), adj('rapide'), 'vitesse rapide'),
    root('brady', 'o', np('la', 'lenteur', 'f'), adj('lent', 'lente'), 'lent lenteur'),
    root('klept', 'o', np('le', 'vol', 'm'), adj('volé', 'volée'), 'vol voler'),
    root('psych', 'o', np('le', 'esprit', 'm'), adj('mental', 'mentale'), 'esprit mental âme'),
    root('soph', 'o', np('la', 'sagesse', 'f'), adj('sage'), 'sagesse sage'),
    root('tox', 'i', np('le', 'poison', 'm'), adj('toxique'), 'poison toxique'),
    root('hebdom', 'o', np('la', 'semaine', 'f'), adj('hebdomadaire'), 'semaine lundi'),
    root('ergast', 'o', np('le', 'bureau', 'm'), adj('de bureau', 'de bureau', true), 'bureau'),

    suff('phobie', 'la peur {de:x}', 'peur effrayé phobie', 'o'),
    suff('philie', "l'amour {de:x}", 'amour aimer', 'o'),
    suff('phile', 'un amoureux {de:x}', 'amoureux fan passionné', 'o'),
    suff('logie', "l'étude {de:x}", 'étude science', 'o'),
    suff('logue', 'un spécialiste {de:x}', 'expert spécialiste', 'o'),
    suff('manie', 'une obsession pour {x}', 'obsession folie manie', 'o'),
    suff('cratie', 'le pouvoir exercé par {x}', 'pouvoir gouvernement règne', 'o'),
    suff('graphie', 'un écrit sur {x}', 'description récit', 'o'),
    suff('scope', 'un instrument pour observer {x}', 'voir observer instrument', 'o'),
    suff('mètre', 'un appareil qui mesure {x}', 'mesure mesurer', 'o'),
    suff('cide', 'la destruction {de:x}', 'tuer meurtre', 'i'),
    suff('vore', 'un mangeur {d0:x}', 'mangeur', 'i'),
    suff('algie', 'une douleur causée par {x}', 'douleur mal'),
    suff('ite', 'une inflammation {de:x}', 'inflammation'),
    suff('isme', 'la doctrine {de:x}', 'croyance doctrine mouvement'),
    suff('ité', 'le caractère {de:x}', 'qualité état'),
    suff('ifier', 'transformer en {0:x}', 'transformer devenir rendre'),
    suff('tron', 'un gadget dédié {a:x}', 'appareil gadget', 'o'),
    suff('arium', 'un lieu consacré {a:x}', 'lieu salle maison'),
    suff('sphère', 'le monde {de:x}', 'communauté milieu', 'o'),
    suff('gène', 'qui produit {de:x}', 'produire causer', 'o'),
    suff('naute', 'un voyageur à travers {x}', 'voyageur explorateur', 'o'),
  ];
  const PREFIXES = MORPHEMES.filter(x => x.kind === 'prefix');
  const ROOTS = MORPHEMES.filter(x => x.kind === 'root');
  const SUFFIXES = MORPHEMES.filter(x => x.kind === 'suffix');
  const POS = { phobie: 'n.f.', philie: 'n.f.', phile: 'n.m.', logie: 'n.f.', logue: 'n.m.', manie: 'n.f.',
    cratie: 'n.f.', graphie: 'n.f.', scope: 'n.m.', mètre: 'n.m.', cide: 'n.m.', vore: 'n.m.', algie: 'n.f.',
    ite: 'n.f.', isme: 'n.m.', ité: 'n.f.', ifier: 'v.', tron: 'n.m.', arium: 'n.m.', sphère: 'n.f.',
    gène: 'adj.', naute: 'n.m.', '': 'n.m.' };

  const FAMILIES = [
    ['logie', 'logue', 'logique', 'logues', 'logies', 'logiste'], ['phobie', 'phobe', 'phobique', 'phobes', 'phobies'],
    ['philie', 'phile', 'philique', 'philes'], ['manie', 'maniaque', 'mane', 'manes'],
    ['graphie', 'graphe', 'graphique', 'graphes'], ['cratie', 'crate', 'cratique'], ['isme', 'iste', 'istique', 'ismes'],
    ['mètre', 'métrie', 'métrique', 'mètres'], ['scope', 'scopie', 'scopique'], ['cide', 'cides'], ['vore', 'vores'],
    ['algie', 'algique'], ['ite', 'itique'], ['naute', 'nautique', 'nautes'], ['gène', 'génique', 'genèse', 'génie'],
    ['ifier', 'ification', 'ifié', 'ifiée'], ['sphère', 'sphérique'], ['arium', 'ariums'], ['tron', 'tronique'],
    ['ité', 'ités'], ['iser', 'isation', 'isé', 'isée'],
  ];

  // Two roots: the last is the head, the first modifies it in one of these ways.
  const ACTIONS = [['amélioration', 'f'], ['mesure', 'f'], ['mise en bouteille', 'f'], ['traduction', 'f'],
    ['domestication', 'f'], ['réorganisation', 'f'], ['recyclage', 'm'], ['contrebande', 'f'], ['polissage', 'm'],
    ['prévision', 'f'], ['catalogage', 'm'], ['réinvention', 'f'], ['adoucissement', 'm'], ['interrogatoire', 'm']];
  const RELATIONS = ['au service', "sous l'influence", 'à la manière', 'en échange', 'au parfum', 'en mémoire',
    'à la recherche', 'au cœur', 'en provenance', "à l'image"];

  function relate(roots) {
    const head = roots[roots.length - 1];
    const n = { ...head.np, post: [] };
    if (roots.length === 1) return n;
    const mods = roots.slice(0, -1);
    const style = roots.length > 2 ? 0 : Math.floor(Math.random() * 3);
    if (style === 1) {
      const [noun, g] = pick(ACTIONS);
      return { ...np(g === 'f' ? 'la' : 'le', noun, g), post: [mods[0].adj], compl: de(render(n)) };
    }
    if (style === 2) return { ...n, compl: `${pick(RELATIONS)} ${de(render(mods[0].np))}` };
    return { ...n, post: mods.map(r => r.adj) };
  }

  function describe(pre, roots, suf) {
    const n = roots.length ? relate(roots) : np('les', 'choses', 'f', true);
    if (pre && pre.hyphen) n.pre = pre.hyphen;
    else if (pre) n.post = [...n.post, pre.adj];
    if (suf) return [n, fill(suf.gloss, n)];
    return [n, roots.length > 1 ? `un nom pour ${render(n)}` : `quelque chose qui a trait ${a(render(n))}`];
  }

  // Sentence slots: {w} word, {le:w}/{Le:w}/{un:w} with the word's gender, {de:w}/{a:w} contracted, {d:w} "de"
  // + bare word, {x} meaning, {de:x}/{a:x}, {Who}/{who}, {where}, {When}.
  const WHO = ['Ma grand-mère', 'Le gardien de nuit', 'Un pilote à la retraite', 'Notre nouveau voisin',
    'Le boulanger du village', 'Un comptable épuisé', 'Le gardien du phare', 'Mon dentiste',
    'Une étudiante en philosophie', 'Le maire', 'Un magicien ambulant', "Le concierge de l'école",
    'Une cheffe étoilée', 'Le propriétaire', 'Une astronaute en congé', 'Le gardien du musée',
    'Un chauffeur de taxi de Porto', 'La cheffe de chœur', 'Mon petit frère', 'Un détective à moitié retraité',
    'La factrice', 'Un témoin de mariage nerveux', 'Mon prof de yoga', 'Le champion du quiz du jeudi',
    "Un maître-nageur qui s'ennuie", 'La dame du 42', 'Une infirmière débutante', "Le réceptionniste de l'hôtel",
    'Mon cousin de Brest', 'Une violoniste en plein décalage horaire'];
  const WHERE = ['à Lisbonne', 'à la fête du village', 'dans le train de nuit pour Vienne', 'dans une cave à Lille',
    'au fond de la bibliothèque', 'sur un ferry pour Tanger', "dans le hall d'un hôtel à Tokyo",
    'au concours de pêche annuel', 'dans la cuisine du bureau', "à mi-hauteur d'une montagne",
    'à un mariage à Naples', 'dans une laverie de Marseille', "sur une aire d'autoroute", 'dans la file de la poste',
    'en camping dans le Morvan', 'dans une jardinerie près de Tours', "à l'arrière d'un taxi",
    'au pot de Noël du bureau', 'sur un toit à Madrid', 'dans un vide-grenier'];
  const WHEN = ["L'hiver dernier", 'Tous les mardis', 'Depuis la panne de courant', "Le jour du changement d'heure",
    'Bien avant Internet', 'Pendant la canicule', 'Le lendemain du mariage', 'À la troisième semaine de grève',
    'Au printemps 1987', 'Peu après avoir gagné au loto', 'En pleine réunion', 'Le premier jour des soldes',
    'Juste avant minuit', 'Après le troisième café', 'Un jour férié pluvieux', 'La semaine où la chaudière a lâché'];
  const ADULTS = { who: WHO, where: WHERE, when: WHEN };
  const KIDS = {
    who: ['Ma petite sœur', 'Notre maîtresse', 'Papi', 'Le nouveau de la classe', 'Un tout petit pirate',
      'Mon meilleur copain', 'La dame de la cantine', 'Un géant tout endormi', 'La petite souris', 'Mon grand frère',
      'Le chauffeur du car', 'Un dragon timide', 'Mamie', 'La directrice', 'Un gentil robot', 'Ma cousine Léa',
      "La bibliothécaire de l'école", 'Un lapin très courageux'],
    where: ['au parc', 'dans la cour de récré', 'chez Mamie', 'dans le car scolaire', 'à la plage', 'sous le lit',
      'dans la cabane', 'au zoo', 'dans un château', 'à la piscine', 'dans le jardin', "à la kermesse de l'école",
      'dans le bac à sable', 'sur un bateau pirate', 'à la fête foraine', 'dans la classe'],
    when: ["Hier après l'école", "Le dernier jour d'école", "À l'heure du coucher", 'Tous les samedis matin',
      'Pendant les grandes vacances', 'Un jour de neige', 'Un beau matin', 'Le jour de mon anniversaire',
      'Juste après la cantine', 'À la récré', 'Pendant la sortie scolaire', 'Un dimanche pluvieux'],
  };

  const EXAMPLES = {
    phobie: [
      '{Who} a développé {un:w} {where} et évite désormais tout ce qui touche {a:x}.',
      '{When}, {who} a enfin avoué {un:w} : rien que penser {a:x} lui donne des sueurs froides.',
      "Ce n'est pas de la paresse, c'est de {le:w} : rien ne le terrifie autant que {x}."],
    philie: [
      '{Who} a avoué {un:w} de longue date ; le grenier déborde de tout ce qui concerne {x}.',
      '{When}, {who} a découvert {le:w} et organise désormais ses vacances autour {de:x}.',
      'Tout a commencé innocemment, par une seule carte postale sur {x} : {le:w} était née.'],
    phile: [
      '{Who}, {w} de la première heure, tient un album entier consacré {a:x}.',
      'Tous les {w}s {where} sont venus débattre {de:x} jusqu\'à minuit.',
      'Seul un vrai {w} traverserait un continent pour {x}.'],
    logie: [
      '{Who} a donné une conférence étonnamment émouvante sur {le:w} {where}.',
      '{Le:w} reste un petit domaine : une douzaine de chercheurs, une revue et des débats sans fin sur {x}.',
      "{When}, l'université a discrètement ouvert un département {d:w}."],
    logue: [
      '{Le:w} le plus réputé {where} est, contre toute attente, {who}.',
      "{When}, {un:w} de passage a expliqué {x} si clairement que la salle s'est tue.",
      "Demandez à {un:w} de vous parler {de:x} et prévoyez votre après-midi."],
    manie: [
      "{When}, {le:w} a déferlé sur le pays : files d'attente, t-shirts, et rien d'autre que {x}.",
      'Les économistes ont attribué la pénurie {a:w}, un engouement soudain pour {x}.',
      "{Who} jure que ce n'est pas de {le:w}, juste un intérêt sain pour {x}."],
    cratie: [
      "{When}, l'île a testé {le:w}, laissant {x} tout décider.",
      "Les critiques {de:w} estiment qu'il ne faut jamais confier le budget {a:x}.",
      'Sous {le:w}, les réunions sont devenues plus courtes et plus étranges.'],
    graphie: [
      "{Who} a passé l'hiver à écrire une courte {w} : quarante pages sur {x}.",
      "{Le:w} qu'elle a écrite a remporté un prix {where}, surtout pour ses notes de bas de page.",
      'Le rayon {w} de la bibliothèque fait une étagère et il est toujours plein.'],
    scope: [
      '{Who} a collé un œil contre {le:w} et a enfin vu {x} clairement.',
      'Le musée conserve {un:w} ancien, autrefois utilisé pour observer {x}.',
      'Inclinez légèrement {le:w} : soudain, tout devient net.'],
    mètre: [
      '{Who} a fabriqué {un:w} maison, et les mesures ont de quoi inquiéter.',
      '{When}, chaque foyer a reçu {un:w} pour surveiller {x}.',
      "L'aiguille {de:w} tremblait dès qu'on parlait {de:x}."],
    cide: [
      'Le rebondissement du roman est {un:w} lent et méthodique : la destruction progressive {de:x}.',
      "On a soupçonné {who} {de:w} après l'incident {where}.",
      'Des militants réclament la fin {de:w}.'],
    vore: [
      '{Who}, {w} depuis toujours, ne commande que {x}.',
      'Le nouveau {w} du zoo refuse tout sauf {x}.',
      'En tant que {w}, elle trouve la plupart des menus décevants.'],
    algie: [
      "{Who} a pris son après-midi pour cause {d:w}, une douleur sourde due {a:x}.",
      'Le médecin {where} a diagnostiqué {un:w} et prescrit une semaine loin {de:x}.',
      '{When}, une vague {d:w} a frappé le bureau.'],
    ite: [
      'Trop exposé {a:x}, on risque {le:w}, a prévenu {who}.',
      '{When}, {who} a attrapé {un:w} tenace.',
      "Il n'existe aucun remède contre {le:w}, seulement du repos et de la distance avec {x}."],
    isme: [
      'Les adeptes {de:w} se retrouvent {where} pour parler {de:x}.',
      '{Who} a adhéré {a:w} après une longue discussion sur {x}.',
      'Au fond, {le:w} affirme que tout se ramène {a:x}.'],
    ité: [
      'Il régnait une étrange {w} ce soir-là, comme un parfum {de:x} dans l\'air.',
      "{When}, une douce {w} s'est installée sur la ville.",
      'Les poètes tentent depuis des siècles de mettre {le:w} en mots.'],
    ifier: [
      'La mairie compte {w} la grand-rue en la remplissant {de:x}.',
      "{Who} a décidé {d:w} la chambre d'amis ; tout y tourne désormais autour {de:x}.",
      'Laissez-lui un week-end et elle va tout {w}.'],
    tron: [
      '{Who} a construit {un:w} avec des pièces détachées, un gadget dédié {a:x}.',
      "{Le:w} ronronnait dans un coin {where}, s'occupant discrètement {de:x}.",
      '{When}, {le:w} est devenu le cadeau incontournable.'],
    arium: [
      "{Le:w} qui vient d'ouvrir {where} est l'endroit idéal pour {x}.",
      '{Who} a passé tout un après-midi dans {le:w}, au milieu {de:x}.',
      'Toutes les sorties scolaires finissent {a:w}.'],
    sphère: [
      'Dans {le:w}, tout le monde a un avis tranché sur {x}.',
      '{Who} est une petite célébrité dans {le:w}.',
      '{When}, {le:w} a été secouée par un scandale lié {a:x}.'],
    gène: [
      "Le projet s'est révélé très {w} : il produisait {de:x} partout où il passait.",
      "{Who} a un effet {w} sur n'importe quelle pièce.",
      'Attention : cette recette est réputée {w}.'],
    naute: [
      "Le premier {w} de l'histoire a rapporté des récits incroyables sur {x}.",
      '{When}, {un:w} solitaire est revenu avec des histoires sur {x}.',
      'Devenir {w} demande des années et un estomac solide.'],
    '': [
      "Personne n'avait de mot pour {x} avant que {who} dise « {w} » {where}, et c'est resté.",
      '{When}, on ne parlait que {de:w} {where}.',
      "{Who} garde un bocal {d:w} sur l'étagère de la cuisine, au cas où.",
      "La pièce maîtresse de l'exposition était {un:w} géant, une méditation sur {x}."],
  };

  const recent = [];

  function example(key, w, core, pos) {
    const all = EXAMPLES[key];
    const fresh = all.filter(t => !recent.includes(t));
    const t = pick(fresh.length ? fresh : all);
    recent.push(t);
    if (recent.length > 12) recent.shift();
    const fem = (pos || POS[key]) === 'n.f.';
    const le = ELIDE.test(w) ? `l'${w}` : `${fem ? 'la' : 'le'} ${w}`;
    const S = key.startsWith('ch:') ? KIDS : ADULTS;
    const who = pick(S.who);
    return fill(t, core)
      .replaceAll('{Le:w}', upperFirst(le)).replaceAll('{le:w}', le).replaceAll('{un:w}', `${fem ? 'une' : 'un'} ${w}`)
      .replaceAll('{de:w}', de(le)).replaceAll('{a:w}', a(le)).replaceAll('{d:w}', de(w))
      .replaceAll('{W}', upperFirst(w)).replaceAll('{w}s', nounPlural(w)).replaceAll('{w}', w)
      .replaceAll('{Who}', who).replaceAll('{who}', lowerFirst(who))
      .replaceAll('{where}', pick(S.where)).replaceAll('{When}', pick(S.when))
      .replace(/(^|\s)([Qq]u|[Dd])e (?=[aeiouàâéèêîôûœ])/gi, "$1$2'"); // "que un pilote" -> "qu'un pilote"
  }

  // Everyday style. [word, article, gender, type: day | event | food | thing | tech | animal | weather]
  const EVERYDAY_WORDS = [
    ['lundi', 'le', 'm', 'day'], ['dimanche', 'le', 'm', 'day'], ['vendredi', 'le', 'm', 'day'], ['mercredi', 'le', 'm', 'day'],
    ['anniversaire', 'le', 'm', 'day'], ['réveillon', 'le', 'm', 'day'],
    ['sieste', 'la', 'f', 'event'], ['réunion', 'la', 'f', 'event'], ['apéro', 'le', 'm', 'event'], ['karaoké', 'le', 'm', 'event'],
    ['câlin', 'le', 'm', 'event'], ['grève', 'la', 'f', 'event'], ['bouchon', 'le', 'm', 'event'], ['boulot', 'le', 'm', 'event'],
    ['lessive', 'la', 'f', 'event'], ['potin', 'le', 'm', 'event'], ['mariage', 'le', 'm', 'event'], ['barbecue', 'le', 'm', 'event'],
    ['hoquet', 'le', 'm', 'event'], ['bâillement', 'le', 'm', 'event'], ['ménage', 'le', 'm', 'event'], ['goûter', 'le', 'm', 'event'],
    ['sandwich', 'le', 'm', 'food'], ['pizza', 'la', 'f', 'food'], ['café', 'le', 'm', 'food'], ['croissant', 'le', 'm', 'food'],
    ['biscuit', 'le', 'm', 'food'], ['raclette', 'la', 'f', 'food'], ['baguette', 'la', 'f', 'food'], ['crêpe', 'la', 'f', 'food'],
    ['gaufre', 'la', 'f', 'food'], ['tartine', 'la', 'f', 'food'], ['nouille', 'la', 'f', 'food'], ['fromage', 'le', 'm', 'food'],
    ['chocolat', 'le', 'm', 'food'], ['éclair', 'le', 'm', 'food'], ['cornichon', 'le', 'm', 'food'],
    ['canapé', 'le', 'm', 'thing'], ['chaussette', 'la', 'f', 'thing'], ['parapluie', 'le', 'm', 'thing'], ['oreiller', 'le', 'm', 'thing'],
    ['frigo', 'le', 'm', 'thing'], ['bus', 'le', 'm', 'thing'], ['plaid', 'le', 'm', 'thing'], ['trottinette', 'la', 'f', 'thing'],
    ['métro', 'le', 'm', 'thing'], ['armoire', 'la', 'f', 'thing'], ['chausson', 'le', 'm', 'thing'], ['mug', 'le', 'm', 'thing'],
    ['cartable', 'le', 'm', 'thing'], ['ascenseur', 'le', 'm', 'thing'], ['bouilloire', 'la', 'f', 'thing'], ['ballon', 'le', 'm', 'thing'],
    ['playlist', 'la', 'f', 'tech'], ['selfie', 'le', 'm', 'tech'], ['batterie', 'la', 'f', 'tech'], ['podcast', 'le', 'm', 'tech'],
    ['mème', 'le', 'm', 'tech'], ['tableur', 'le', 'm', 'tech'], ['courriel', 'le', 'm', 'tech'], ['chargeur', 'le', 'm', 'tech'],
    ['émoji', 'le', 'm', 'tech'], ['imprimante', 'la', 'f', 'tech'], ['ordi', 'le', 'm', 'tech'], ['notif', 'la', 'f', 'tech'],
    ['wifi', 'le', 'm', 'tech'],
    ['chat', 'le', 'm', 'animal'], ['chien', 'le', 'm', 'animal'], ['pigeon', 'le', 'm', 'animal'], ['hamster', 'le', 'm', 'animal'],
    ['pingouin', 'le', 'm', 'animal'], ['lama', 'le', 'm', 'animal'], ['écureuil', 'le', 'm', 'animal'], ['canard', 'le', 'm', 'animal'],
    ['escargot', 'le', 'm', 'animal'],
    ['nuage', 'le', 'm', 'weather'], ['flaque', 'la', 'f', 'weather'], ['bruine', 'la', 'f', 'weather'], ['orage', 'le', 'm', 'weather'],
    ['brouillard', 'le', 'm', 'weather'], ['flocon', 'le', 'm', 'weather'], ['canicule', 'la', 'f', 'weather'],
    ['grêle', 'la', 'f', 'weather'], ['averse', 'la', 'f', 'weather'],
  ];
  // Meanings for blends: a = the first word, b = the second (the head); a/b list the word types that fit.
  const PHYSICAL = ['food', 'thing', 'tech', 'animal', 'weather'];
  const EVERYDAY = {
    words: EVERYDAY_WORDS.map(([w, art, g, cat]) => ({ w, x: np(art, w, g), cat })),
    suffixes: [
      { form: 'esque', pos: 'adj.', gloss: ["qui a toute l'énergie {dun:x}", 'qui rappelle vaguement {un:x}',
        'un peu trop attaché {a:x}', "qui a envie {dun:x} sans oser le dire"] },
      { form: 'ette', pos: 'n.f.', gloss: ['une toute petite version {dun:x}', { t: '{un:x} qui tient dans la poche', a: PHYSICAL },
        '{un:x} pour débutants', { t: "{un:x} si petit{e:x} qu'on peut le perdre dans le canapé", a: PHYSICAL }] },
      { form: 'ade', pos: 'n.f.', gloss: ["une grande fête en l'honneur {de:x}", 'une bataille rangée à coups {d0:x}',
        'un défilé de {0s:x} dans la grand-rue', "une semaine où l'on voit des {0s:x} partout"] },
      { form: 'iste', pos: 'n.m.', gloss: ["quelqu'un qui ne vit que pour {x}", 'un collectionneur passionné {d0:x}',
        'l\'ami qui ramène toutes les conversations {a:x}', 'une légende locale dans le monde {de:x}'] },
      { form: 'ifier', pos: 'v.', gloss: ["transformer n'importe quoi en {0:x}", 'ajouter un peu trop {d0:x} à quelque chose',
        'tout expliquer à grand renfort de {0s:x}', 'remplacer discrètement quelque chose par {un:x}'] },
      { form: 'erie', pos: 'n.f.', gloss: ['une boutique entièrement consacrée {a:x}', 'une petite fabrique artisanale {d0:x}',
        'une pièce secrète remplie de {0s:x}', "un musée consacré à l'histoire {de:x}"] },
      { form: 'core', pos: 'n.m.', gloss: ['une esthétique entièrement construite autour {de:x}', 'un genre musical qui ne parle que {de:x}',
        'une tendance mode inspirée {de:x}', 'tout un art de vivre fondé sur {x}'] },
      { form: 'ouille', pos: 'n.f.', gloss: ['un petit coup de mou causé par {x}', "l'état de fatigue qui suit {un:x}",
        "la flemme totale qu'on ressent devant {un:x}", 'un coup de blues lié {a:x}'] },
      { form: 'isme', pos: 'n.m.', gloss: ['la conviction que tout va mieux avec {un:x}', 'un parti politique qui promet {un:x} pour tous',
        'la manie de juger les gens à leurs {0s:x}', 'une école de pensée née autour {dun:x} et qui a mal tourné'] },
      { form: 'nado', pos: 'n.f.', gloss: ['une tornade soudaine de {0s:x}', 'la pagaille qui arrive quand il y a beaucoup trop de {0s:x}',
        'un tourbillon de {0s:x} qui arrive sans prévenir', "la météo que personne ne voulait : des {0s:x} tout l'après-midi"] },
      { form: 'ville', pos: 'n.f.', gloss: ['une ville où tout tourne autour {de:x}', "le petit coin de la tête où l'on pense {a:x}",
        "un parc d'attractions où chaque manège parle {de:x}", 'un petit village où tout le monde possède {un:x}'] },
      { form: 'logie', pos: 'n.f.', gloss: ["l'étude très sérieuse {de:x}", "un diplôme que personne n'a demandé, entièrement consacré {a:x}",
        'la science de trouver {un:x} parfait{e:x}', "l'art de parler {de:x} pendant des heures"] },
      { form: 'tastique', pos: 'adj.', gloss: ['aussi génial que {un:x} un vendredi', 'débordant de {0s:x}',
        "encore mieux {qun:x}, et ce n'est pas peu dire", 'rayonnant de la joie {dun:x}'] },
      { form: 'zilla', pos: 'n.m.', gloss: ['un monstre entièrement fait de {0s:x}', '{un:x} qui a beaucoup trop grandi',
        "quelqu'un qui devient terrifiant quand on le prive {de:x}", '{un:x} géant{e:x} qui piétine la ville'] },
    ],
    prefixes: [
      { form: 'méga', gloss: ['{un:x} géant{e:x}', "{un:x} dont on parlera encore dans dix ans",
        '{un:x} qui a son propre code postal', '{un:x} avec le volume à fond'] },
      { form: 'mini', gloss: ['{un:x} en miniature', { t: '{un:x} assez petit{e:x} pour tenir dans la main', a: PHYSICAL },
        '{un:x} pour les gens pressés', { t: "{un:x} à la taille d'un hamster", a: ['food', 'thing', 'tech'] }] },
      { form: 'sur', gloss: ['beaucoup trop {d0:x}', { t: '{un:x} qui a duré beaucoup trop longtemps', a: ['event'] },
        "l'impression d'avoir eu {un:x} de trop", 'un amour excessif pour les {0s:x}'] },
      { form: 'anti', gloss: ["l'exact opposé {dun:x}", 'un produit qui protège des {0s:x}',
        'un club pour ceux qui ne supportent pas les {0s:x}', 'un spray qui éloigne les {0s:x}'] },
      { form: 're', gloss: ['{un:x}, une fois de plus', "{un:x} de plus, que personne n'avait demandé{e:x}",
        "{un:x} dont on croyait s'être débarrassé", "{un:x} d'autrefois, ramené{e:x} à la vie"] },
      { form: 'super', gloss: ['{un:x} avec des super-pouvoirs', '{un:x} hors du commun', '{un:x} qui sauve la situation',
        '{un:x} avec une cape'] },
      { form: 'dé', gloss: ['la sensation {dun:x} qui disparaît', "tout ce qui n'est vraiment pas {un:x}",
        "{un:x} qui n'a jamais vraiment eu lieu", "{un:x} qui se défait dès qu'on a le dos tourné"] },
      { form: 'demi', gloss: ['moitié {0:x}, moitié autre chose', "{un:x} qui ne marche qu'à moitié",
        "{un:x} dont on ne se souvient qu'à moitié", "{un:x} qui n'arrive pas à se décider"] },
      { form: 'ultra', gloss: ['la version la plus extrême {dun:x}', '{un:x} puissance dix'] },
      { form: 'pré', gloss: ['le moment juste avant {un:x}', "{un:x} pour s'échauffer avant le grand jour"] },
      { form: 'post', gloss: ['tout ce qui reste après {un:x}', "le calme étrange juste après {un:x}"] },
      { form: 'micro', gloss: ["{un:x} qu'on ne voit qu'à la loupe", 'la plus petite quantité possible {de:x}'] },
    ],
    mixes: [
      '{un:b} qui finit toujours en {0:a}', 'ce qui se passe quand {a} croise {b}', "{un:b} avec toute l'énergie {dun:a}",
      "le moment où l'on comprend que {b} est en fait {un:a}",
      { t: '{un:b} avec {un:a} pour seul repas', a: ['food'], b: ['event'] },
      { t: "{un:a} dont on n'a besoin que pendant {un:b}", a: ['thing'], b: ['event'] },
      { t: '{un:b} gâché{e:b} par {un:a}', a: ['weather'], b: ['event'] },
      { t: '{un:b} dont {un:a} a pris possession', a: ['animal'], b: ['thing'] },
      { t: '{un:b} passé{e:b} les yeux rivés sur {un:a}', a: ['tech'], b: ['event'] },
      { t: "l'impression {dun:a} au beau milieu {dun:b}", a: ['event'], b: ['event'] },
      { t: '{un:b} qui sent toujours un peu {a}', a: ['food'], b: ['thing'] },
      { t: "{un:b} qu'on retrouve toujours à la place {dun:a}", a: ['thing'], b: ['thing'] },
      { t: '{un:b} sous le regard {dun:a}', a: ['animal'], b: ['event'] },
      { t: "{un:b} qu'il faut recharger plus souvent {qun:a}", a: ['tech'], b: ['thing'] },
      { t: '{un:b} qui surgit de nulle part, comme {un:a}', a: ['weather'] },
      { t: "{un:b} qui a un drôle de goût {d0:a}", b: ['food'] },
      { t: "{un:b} qui n'a de sens que {a}", a: ['day'] },
      { t: '{un:b} {qun:a} a déjà léché{e:b}', a: ['animal'], b: ['food'] },
      { t: '{un:b} qui a appris à se servir {dun:a}', a: ['tech'], b: ['animal'] },
      { t: "{un:b} qu'on ne retrouve qu'après {un:a}", a: ['weather'], b: ['thing'] },
      { t: '{un:b} prêt{e:b} à tout pour {un:a}', a: ['food'], b: ['animal'] },
      { t: '{un:b} qui semble durer une semaine à cause {dun:a}', b: ['day'] },
      { t: "{un:b} où chacun doit apporter {un:a}", a: ['food', 'thing'], b: ['event'] },
      { t: '{un:b} interrompu{e:b} par {un:a} au pire moment', a: ['animal', 'tech', 'weather'], b: ['event'] },
      { t: "{un:b} qui ne marche que si l'on tient {un:a}", a: ['thing', 'food'], b: ['tech'] },
      { t: '{un:b} qui a exactement la forme {dun:a}', a: ['animal', 'food', 'thing'], b: ['food', 'thing'] },
      { t: "{un:b} {qun:a} n'arrête pas de voler", a: ['animal'], b: ['food', 'thing', 'tech'] },
      { t: "{un:b} qu'on ne trouve que {a}", a: ['day'], b: ['food'] },
      { t: "{un:b} qui se met à jouer de la musique dès qu'arrive {un:a}", a: ['weather', 'event'], b: ['thing', 'tech'] },
      { t: "{un:b} qu'on n'aurait jamais dû inviter {a:a}", a: ['event'], b: ['animal'] },
      { t: "{un:b} qui sent {a} sans qu'on sache pourquoi", a: ['food', 'weather'], b: ['tech', 'thing'] },
      { t: "l'envie soudaine {dun:a} en plein milieu {dun:b}", a: ['food'], b: ['event'] },
      { t: '{un:b} secrètement dirigé{e:b} par des {0s:a}', a: ['animal'], b: ['event', 'thing', 'tech'] },
      { t: '{un:b} que seul{e:a} {un:a} pourrait comprendre', a: ['animal'] },
      { t: '{un:b} avec la capacité de concentration {dun:a}', a: ['animal'], b: ['event', 'tech'] },
      { t: '{un:b} toujours accompagné{e:b} {dun:a}', a: ['weather'], b: ['animal', 'thing', 'event'] },
    ],
    join: (word, suffix) => (/[aeiouy]$/.test(word) && /^[aeiouy]/.test(suffix) ? word.slice(0, -1) : word) + suffix,
    joinPrefix: (pre, word) => (pre === 're' && /^[aeiouyéè]/.test(word) ? `ré${word}` : pre + word),
    mixPos: b => (b.x.g === 'f' ? 'n.f.' : 'n.m.'),
  };
  Object.assign(EXAMPLES, {
    'ev:esque': ["On n'est que mardi, mais tout le bureau a l'air très {w}.", "{Who} devient un peu {w} dès qu'il pleut.",
      "Il y a une ambiance très {w} {where} aujourd'hui.", '{When}, tout le monde est devenu un peu {w}.',
      'Avant dix heures, {who} est encore trop {w}.'],
    'ev:ette': ["{Who} s'est offert {un:w} {where}.", 'Rien ne vaut {un:w} le dimanche matin.',
      '{When}, {who} a ramené {un:w} à la maison.', "{Le:w}, c'est ce qu'il y a de plus mignon {where}.",
      'Tout le monde voulait tenir {le:w}.'],
    'ev:ade': ['{When}, la ville a organisé sa toute première {w}.', 'La grande {w} {where} a affiché complet en une heure.',
      '{Who} prépare {le:w} de cette année depuis janvier.', "Les places pour {le:w} s'arrachent.",
      "Personne ne sait comment {le:w} a commencé, mais personne ne veut qu'elle s'arrête."],
    'ev:iste': ["{Who} se revendique {w} et ne s'en cache pas.", 'Tous les {w}s {where} sont arrivés en avance.',
      "Demandez à n'importe quel {w} : il vous en parlera pendant une heure.", 'Il y a toujours un {w} à chaque fête.',
      'Les {w}s se retrouvent {where} tous les jeudis.'],
    'ev:ifier': ['{Who} a décidé de tout {w} {where}.', 'Le nouveau chef veut {w} chaque réunion.',
      'Donnez-lui dix minutes et {who} va tout {w}.', '{When}, une start-up a promis {d:w} toute la ville.',
      'Par pitié, ne venez pas {w} le discours du mariage.'],
    'ev:erie': ["Une minuscule {w} vient d'ouvrir {where}.", '{Who} passe tous ses samedis {a:w}.',
      'La vieille {w} {where} existe depuis 1952.', '{When}, {le:w} a été en rupture de stock pour la première fois.',
      'Il y a encore la queue devant {le:w}.'],
    'ev:core': ['{When}, {le:w} a envahi tous les cafés {where}.', "Son appartement, c'est du {w} pur jus, jusqu'aux rideaux.",
      "Chez {who}, c'est {w} intégral, et ça lui va bien.", 'Le look {w} est dans tous les magazines ce printemps.',
      'On reconnaît un fan de {w} {where} à des kilomètres.'],
    'ev:ouille': ['{Who} a eu une sacrée {w} {where}.', "Rien de tel qu'une sieste pour soigner une {w}.",
      "{When}, toute l'équipe a eu {le:w}.", '{Who} traîne {le:w} depuis ce matin.',
      'Une bonne {w}, ça se soigne avec un plaid.'],
    'ev:isme': ["{Who} prêche {le:w} à qui veut l'entendre.", '{When}, {le:w} est devenu la religion officieuse de la ville.',
      "L'essor {de:w} a été lent mais inéluctable.", '{Who} a donné une conférence sur {le:w} {where}, et la salle était comble.',
      'Les détracteurs {de:w} sont toujours invités et ne viennent jamais.'],
    'ev:nado': ["{When}, une {w} s'est abattue sur la ville et personne n'est allé travailler.", 'La météo annonce une {w} {where}.',
      '{Who} a filmé {le:w} depuis la fenêtre.', "Personne n'a vu venir {le:w}.", 'Après {le:w}, il a fallu ranger toute la rue.'],
    'ev:ville': ['{Who} vit à {W} depuis des années.', 'Bienvenue à {W}, où tout le monde se connaît.',
      'Le bus pour {W} part toutes les heures {where}.', '{When}, {who} a enfin déménagé à {W}.',
      'Personne ne quitte {W} sans un souvenir.'],
    'ev:logie': ['{Who} a un doctorat en {w}.', 'Le département de {w} {where} compte un professeur et trois chats.',
      '{When}, {le:w} a enfin été reconnue comme une vraie science.', 'Le premier congrès de {w} a eu lieu {where}.',
      'Personne ne comprend {le:w} comme {who}.'],
    'ev:tastique': ['La fête {where} était absolument {w}.', '{Who} trouve le nouveau menu complètement {w}.',
      '{When}, tout semblait un peu {w}.', "Ce n'était pas juste bien, c'était {w}.", 'Leur nouvelle chanson est vraiment {w}.'],
    'ev:zilla': ['{When}, {who} a créé un {w} par accident.', 'Le {w} a été aperçu pour la dernière fois {where}.',
      'Fermez les portes : {le:w} est de retour.', "{Who} jure que {le:w} est inoffensif si l'on reste calme.",
      "Chaque ville a son histoire de {w}, et la nôtre s'est passée {where}."],
    'ev:pre': ["Personne n'était prêt pour {le:w} {where}.", '{Who} parle encore {de:w} de 1987.',
      '{When}, {un:w} a tout changé.', 'Si vous croisez {un:w}, restez calme et reculez lentement.',
      '{Who} jure avoir vu {un:w} {where}.', 'Le journal local a consacré une page entière {a:w}.',
      'Il y a eu {un:w} {where}, et les photos sont incroyables.', 'Tout le monde a une histoire de {w} à raconter.',
      '{Who} rêve de {un:w} depuis des années.', "{Le:w} est de retour, et cette fois c'est personnel.",
      "{Le:w}, ça ne s'oublie pas.", '{When}, {le:w} a fait la une du journal télévisé.',
      "{Le:w}, ce n'est pas pour les âmes sensibles.", "Dans le doute, c'est la faute {de:w}."],
    'ev:mix': ["{Who} a inventé {le:w} {where}, et depuis, plus personne ne s'en passe.",
      "{When}, tout le monde s'est mis à parler {de:w}.", "Demandez à n'importe qui {where} : tout le monde a une histoire de {w}.",
      'Rien ne gâche un après-midi tranquille comme {un:w} surprise.',
      '{Who} jure que {le:w} est ce qui est arrivé de mieux {where} depuis des années.',
      "Il n'existe aucune façon polie d'expliquer {un:w} à son patron.",
      "{When}, {who} a posté une photo {de:w} et elle a fait le tour d'Internet.",
      "Dans chaque bureau, il y a au moins {un:w}, et tout le monde fait semblant de ne rien remarquer.",
      "{Who} collectionne les {w}s depuis l'enfance.", "Vous n'avez rien vécu tant que vous n'avez pas connu {un:w} {where}.",
      'Je ne comptais pas parler {de:w}, mais nous y voilà.', '{Who} met tout sur le dos {de:w}.',
      '{When}, {who} a découvert {le:w}.', 'Plus personne ne parle {de:w} {where}.',
      "{Le:w}, c'est soit génial, soit une terrible erreur.", 'Quelque part {where}, il y a {un:w} en ce moment même.',
      '{Who} a écrit une chanson entière sur {le:w}.', 'Il y a {un:w} dans tous les albums photo de famille.'],
  });

  // Children style. [word, article, gender, type: event | food | thing | animal | weather | character]
  const CHILDREN_WORDS = [
    ['coucher', 'le', 'm', 'event'], ['bain', 'le', 'm', 'event'], ['récré', 'la', 'f', 'event'], ['goûter', 'le', 'm', 'event'],
    ['anniversaire', 'le', 'm', 'event'], ['chatouille', 'la', 'f', 'event'], ['boum', 'la', 'f', 'event'],
    ['kermesse', 'la', 'f', 'event'], ['bisou', 'le', 'm', 'event'], ['pique-nique', 'le', 'm', 'event'],
    ['gâteau', 'le', 'm', 'food'], ['bonbon', 'le', 'm', 'food'], ['crêpe', 'la', 'f', 'food'], ['glace', 'la', 'f', 'food'],
    ['banane', 'la', 'f', 'food'], ['carotte', 'la', 'f', 'food'], ['sucette', 'la', 'f', 'food'], ['chocolat', 'le', 'm', 'food'],
    ['compote', 'la', 'f', 'food'], ['brocoli', 'le', 'm', 'food'], ['saucisse', 'la', 'f', 'food'], ['tartine', 'la', 'f', 'food'],
    ['frite', 'la', 'f', 'food'], ['yaourt', 'le', 'm', 'food'], ['cookie', 'le', 'm', 'food'],
    ['crayon', 'le', 'm', 'thing'], ['cartable', 'le', 'm', 'thing'], ['doudou', 'le', 'm', 'thing'], ['toboggan', 'le', 'm', 'thing'],
    ['balançoire', 'la', 'f', 'thing'], ['trampoline', 'le', 'm', 'thing'], ['seau', 'le', 'm', 'thing'], ['chaussette', 'la', 'f', 'thing'],
    ['oreiller', 'le', 'm', 'thing'], ['vélo', 'le', 'm', 'thing'], ['ballon', 'le', 'm', 'thing'], ['bulle', 'la', 'f', 'thing'],
    ['puzzle', 'le', 'm', 'thing'], ['tambour', 'le', 'm', 'thing'], ['trottinette', 'la', 'f', 'thing'], ['pyjama', 'le', 'm', 'thing'],
    ['toupie', 'la', 'f', 'thing'],
    ['chiot', 'le', 'm', 'animal'], ['chaton', 'le', 'm', 'animal'], ['dinosaure', 'le', 'm', 'animal'], ['licorne', 'la', 'f', 'animal'],
    ['dragon', 'le', 'm', 'animal'], ['singe', 'le', 'm', 'animal'], ['grenouille', 'la', 'f', 'animal'], ['pingouin', 'le', 'm', 'animal'],
    ['pieuvre', 'la', 'f', 'animal'], ['lapin', 'le', 'm', 'animal'], ['hamster', 'le', 'm', 'animal'], ['girafe', 'la', 'f', 'animal'],
    ['requin', 'le', 'm', 'animal'], ['tortue', 'la', 'f', 'animal'], ['éléphant', 'le', 'm', 'animal'], ['coccinelle', 'la', 'f', 'animal'],
    ['escargot', 'le', 'm', 'animal'],
    ['flaque', 'la', 'f', 'weather'], ['flocon', 'le', 'm', 'weather'], ['goutte', 'la', 'f', 'weather'], ['nuage', 'le', 'm', 'weather'],
    ['orage', 'le', 'm', 'weather'], ['soleil', 'le', 'm', 'weather'], ['neige', 'la', 'f', 'weather'],
    ['pirate', 'le', 'm', 'character'], ['sorcier', 'le', 'm', 'character'], ['fée', 'la', 'f', 'character'], ['monstre', 'le', 'm', 'character'],
    ['fantôme', 'le', 'm', 'character'], ['martien', 'le', 'm', 'character'], ['sirène', 'la', 'f', 'character'],
    ['chevalier', 'le', 'm', 'character'], ['princesse', 'la', 'f', 'character'], ['géant', 'le', 'm', 'character'],
    ['robot', 'le', 'm', 'character'], ['sorcière', 'la', 'f', 'character'], ['lutin', 'le', 'm', 'character'],
  ];
  const LIVING = ['animal', 'character'];
  const CHILDREN = {
    words: CHILDREN_WORDS.filter(([w]) => !w.includes('-')).map(([w, art, g, cat]) => ({ w, x: np(art, w, g), cat })),
    suffixes: [
      { form: 'osaure', pos: 'n.m.', gloss: ['un dinosaure qui a peur des {0s:x}',
        { t: 'un gros dinosaure gentil qui ne mange que des {0s:x}', a: ['food'] },
        { t: '{un:x} préhistorique', a: LIVING }, '{un:x} dessiné{e:x} sur la queue d\'un dinosaure'] },
      { form: 'icorne', pos: 'n.f.', gloss: [{ t: 'un cheval magique avec {un:x} sur la tête', a: ['food', 'thing', 'animal', 'weather', 'character'] },
        'une licorne qui laisse derrière elle une traînée de {0s:x}', { t: 'une licorne qui ne sort que pendant {un:x}', a: ['event'] }] },
      { form: 'bot', pos: 'n.m.', gloss: ['un robot qui se prend pour {un:x}',
        { t: 'un petit robot qui range les {0s:x}', a: ['food', 'thing'] }, "un robot qui bipe dès qu'il y a {un:x} dans les parages"] },
      { form: 'tastique', pos: 'adj.', gloss: ["aussi génial {qun:x} un samedi", 'rempli de {0s:x} de haut en bas',
        { t: "si joyeux qu'on a envie de danser comme {un:x}", a: LIVING }] },
      { form: 'zilla', pos: 'n.m.', gloss: ['{un:x} géant{e:x} qui veut juste un câlin', 'un gentil monstre fait de {0s:x}',
        "{un:x} aussi grand{e:x} que l'école"] },
      { form: 'ville', pos: 'n.f.', gloss: [{ t: 'une ville où tout est fait de {0s:x}', a: ['food', 'thing'] },
        { t: 'un pays où les {0s:x} font la loi', a: LIVING }, 'un village où chaque maison a la forme {dun:x}'] },
      { form: 'ette', pos: 'n.f.', gloss: ['{un:x} tout{e:x} petit{e:x}', { t: 'un bébé {0:x} qui tient dans la main', a: LIVING },
        "{un:x} pas plus grand{e:x} qu'une coccinelle"] },
      { form: 'ounet', pos: 'n.m.', gloss: [{ t: 'un petit surnom tout doux pour {un:x}', a: ['animal', 'character', 'thing', 'food'] }, "{un:x} si craquant{e:x} qu'on a envie de lui faire un bisou"] },
      { form: 'nado', pos: 'n.f.', gloss: ['un tourbillon de {0s:x} qui fait le tour de la cour de récré',
        { t: 'un orage où il pleut des {0s:x}', a: ['food', 'thing'] }, { t: 'une danse qui fait tourner la tête, inventée par des {0s:x}', a: LIVING }] },
      { form: 'ologie', pos: 'n.f.', gloss: ['la très importante science des {0s:x}', "une matière à l'école qui ne parle que de {0s:x}"] },
      { form: 'ix', pos: 'n.m.', gloss: ['un petit Gaulois qui adore les {0s:x}', 'un héros de BD qui se bat avec {un:x} magique'] },
    ],
    prefixes: [
      { form: 'méga', gloss: ['{un:x} grand{e:x} comme une maison', '{un:x} plus grand{e:x} que le monde entier'] },
      { form: 'mini', gloss: ['{un:x} pas plus grand{e:x} qu\'un bouton', { t: '{un:x} qui tient dans le cartable', a: ['food', 'thing', 'animal'] }] },
      { form: 'super', gloss: ['{un:x} avec des super-pouvoirs', '{un:x} qui sait voler'] },
      { form: 'ultra', gloss: ['{un:x} ultra rapide', '{un:x} extra, extra, EXTRA'] },
      { form: 'dé', gloss: ['{un:x} qui marche à reculons', "l'exact contraire {dun:x}"] },
      { form: 'turbo', gloss: ['{un:x} qui file à toute vitesse', '{un:x} avec un moteur de fusée'] },
    ],
    mixes: [
      'ce qui arrive quand {a} rencontre {b}', '{un:b} qui se prend pour {un:a}', 'le jour où {b} est devenu{e:b} ami{e:b} avec {un:a}',
      { t: '{un:b} qui ne mange que des {0s:a}', a: ['food'], b: LIVING },
      { t: '{un:b} qui transforme tout en {0s:a}', a: ['food', 'thing', 'weather'], b: LIVING },
      { t: '{un:b} où tout le monde se déguise en {0:a}', a: LIVING, b: ['event'] },
      { t: '{un:b} dont le meilleur ami est {un:a}', a: LIVING, b: ['animal', 'character', 'thing'] },
      { t: "{un:b} qui n'apparaît qu'après {un:a}", a: ['weather'] },
      { t: '{un:b} qui a le goût {d0:a}', a: ['food', 'weather'], b: ['food'] },
      { t: "{un:b} qui chante dès qu'il y a {un:a} tout près", a: ['animal', 'weather'] },
      { t: '{un:b} caché{e:b} dans {un:a}', a: ['thing', 'food'], b: LIVING },
      { t: '{un:b} {qun:a} a rapporté{e:b} de vacances', a: LIVING, b: ['thing', 'food'] },
      { t: '{un:b} qui fait rire les {0s:a}', a: LIVING, b: ['event', 'food', 'thing'] },
      { t: "{un:b} qui arrive chaque fois {qun:a} éternue", a: LIVING, b: ['weather', 'event'] },
      { t: '{un:b} qui pousse sur les {0s:a}', a: ['weather', 'thing'], b: ['food'] },
      { t: '{un:b} qui a peur des {0s:a}', a: ['animal', 'food', 'thing'], b: LIVING },
      { t: "{un:b} qu'on ne trouve que pendant {un:a}", a: ['event'], b: ['animal', 'character', 'food'] },
      { t: '{un:b} qui sème des {0s:a} partout', a: ['food', 'weather', 'thing'], b: LIVING },
      { t: '{un:b} qui rebondit comme {un:a}', a: ['animal'], b: ['thing', 'food'] },
    ],
    join: EVERYDAY.join,
    joinPrefix: EVERYDAY.joinPrefix,
    mixPos: EVERYDAY.mixPos,
  };
  Object.assign(EXAMPLES, {
    'ch:osaure': ['{When}, {who} a trouvé {un:w} {where}.', '{Le:w} est le dinosaure préféré des enfants au musée.',
      'Si tu croises {un:w}, fais-lui coucou : il est très gentil.', "{Who} a dessiné {un:w} et l'a collé sur le frigo."],
    'ch:icorne': ['{Who} a fait un vœu et a trouvé {un:w} dans le jardin.', 'Seuls les enfants très gentils voient {un:w}.',
      '{When}, {un:w} est passée au galop {where}.', "{Le:w} a fait un clin d'œil et a disparu {where}."],
    'ch:bot': ['{Who} a construit {un:w} avec des cartons.', '{Le:w} a bipé deux fois et a fait une petite danse.',
      '{When}, {le:w} est tombé en panne de piles {where}.', 'Tout le monde veut {un:w} pour son anniversaire.'],
    'ch:tastique': ['La fête {where} était complètement {w} !', "{Who} a dit que c'était la journée la plus {w} de sa vie.",
      'Ce dessin est absolument {w}.', '{When}, tout était {w}.'],
    'ch:zilla': ['{When}, {un:w} a traversé la ville en cherchant un câlin.', "{Who} n'a pas du tout peur {de:w}.",
      '{Le:w} a demandé pardon pour le château de sable.', 'Chut ! {Le:w} fait la sieste {where}.'],
    'ch:ville': ['{Who} veut partir en vacances à {W}.', 'À {W}, personne ne range jamais sa chambre.',
      'La route qui mène à {W} commence {where}.', '{When}, {who} a envoyé une carte postale depuis {W}.'],
    'ch:ette': ['{Who} garde {un:w} dans une boîte à chaussures.', 'Oh, regarde {le:w} ! Trop mignonne !',
      "{When}, {un:w} a suivi {who} jusqu'à la maison.", "{Le:w}, c'est la plus petite chose {where}."],
    'ch:ounet': ['{Who} a fait un gros bisou {a:w}.', 'Viens là, petit {w} !',
      "{When}, {le:w} s'est roulé en boule {where} et s'est endormi.", 'Tout le monde adore {le:w}.'],
    'ch:nado': ['{When}, une {w} a tourbillonné {where}, et tout le monde a ri.', 'La météo annonce une {w} cet après-midi.',
      'Sur le chemin du retour, {le:w} a tout emporté.', 'Après {le:w}, il a fallu tout ranger.'],
    'ch:ologie': ['{Who} veut étudier {le:w} plus tard.', "La leçon {d:w} d'aujourd'hui était la meilleure.",
      '{Who} connaît {le:w} par cœur.', "{When}, toute l'école a fait un exposé sur {le:w}."],
    'ch:ix': ['{Who} lit les aventures de {W} tous les soirs.', '{W} a encore sauvé le village !',
      "{When}, toute la classe s'est déguisée en {W}.", "Dans la BD, {W} n'a peur de rien."],
    'ch:pre': ['{When}, {un:w} a rendu visite à toute la classe.', '{Who} jure avoir vu {un:w} {where}.',
      'Tout le monde a applaudi en voyant {le:w}.', 'Tu as déjà vu {un:w} ? {Who}, oui !',
      '{Le:w} a fait coucou et a filé goûter.', '{Who} a dessiné {un:w} pour Mamie.',
      "C'est la meilleure chose qui soit arrivée {where} : {un:w} !", '{When}, {who} a rencontré {un:w} pour de vrai.'],
    'ch:mix': ['{Who} a trouvé {un:w} {where}.', '{When}, {un:w} a débarqué {where}, et tout le monde souriait.',
      "{Le:w}, c'est ce qu'il y a de mieux au monde, dit {who}.", 'Personne ne croit {who}, mais il y a vraiment {un:w} {where}.',
      'Chut ! Si tu ne fais pas de bruit, tu entendras peut-être {un:w}.', '{Who} a écrit une histoire sur {un:w} et a eu une bonne note.',
      'Tous les soirs, {le:w} dit bonne nuit.', '{When}, {who} a joué toute la journée avec {un:w}.',
      "Tu sais ce que c'est, {un:w} ? Moi, oui !", '{Le:w} était la vedette du spectacle {where}.'],
  });

  // Endings for Invent words built on a real word ("pauvre" + "isme"). {b} is the real word.
  const AFFIX_SUFFIXES = [
    ['ité', 'n.f.', "le fait d'être {b}"], ['isme', 'n.m.', "une philosophie entièrement fondée sur l'idée {de:b}"],
    ['iste', 'n.m.', "un adepte inconditionnel de l'idée {de:b}"], ['iser', 'v.', 'rendre quelque chose {b} exprès'],
    ['isé', 'adj.', 'rendu {b} exprès'], ['isation', 'n.f.', 'le lent processus qui rend les choses {b}'],
    ['ifier', 'v.', 'ajouter une touche {de:b} à quelque chose'], ['eur', 'n.m.', 'un marchand {de:b}'],
    ['erie', 'n.f.', 'une fabrique {de:b}'], ['ette', 'n.f.', 'une petite version {de:b}'],
    ['esque', 'adj.', 'à la manière {de:b}'], ['âtre', 'adj.', 'vaguement {b}'], ['ard', 'adj.', '{b}, et un peu trop'],
    ['eux', 'adj.', 'plein {de:b}'], ['ique', 'adj.', 'dans le style {de:b}'], ['al', 'adj.', "lié à l'idée {de:b}"],
    ['ment', 'adv.', 'de façon {b}'], ['able', 'adj.', 'qui pourrait facilement devenir {b}'],
    ['ible', 'adj.', 'qui pourrait facilement devenir {b}'], ['age', 'n.m.', 'une grande quantité {de:b}'],
    ['ade', 'n.f.', 'une fête bruyante sur le thème {de:b}'], ['ier', 'n.m.', 'un vendeur ambulant {de:b}'],
    ['ière', 'n.f.', 'une boîte à {b}'], ['ée', 'n.f.', 'tout ce que peut contenir un {b}'],
    ['ement', 'n.m.', 'ce qui arrive quand on abuse {de:b}'], ['ance', 'n.f.', "l'art délicat d'être {b}"],
    ['ence', 'n.f.', "l'art délicat d'être {b}"], ['ure', 'n.f.', 'ce qui reste {de:b}'],
    ['oïde', 'adj.', 'en forme {de:b}'], ['ation', 'n.f.', "l'art de rendre les choses {b}"],
    ['ion', 'n.f.', 'une soudaine envie {de:b}'], ['er', 'v.', 'agir à la manière {de:b}'],
    ['esse', 'n.f.', 'le charme discret {de:b}'], ['ise', 'n.f.', 'un excès {de:b}'],
    ['logie', 'n.f.', "l'étude {de:b}"], ['logue', 'n.m.', 'un spécialiste {de:b}'], ['phobie', 'n.f.', 'la peur {de:b}'],
    ['phile', 'n.m.', 'un amoureux {de:b}'], ['manie', 'n.f.', 'une obsession pour {b}'],
  ].sort((x, y) => y[0].length - x[0].length);
  // {r} is the meaning of the rest of the word.
  const AFFIX_PREFIXES = [
    ['in', 'pas {r}'], ['im', 'pas {r}'], ['dé', 'le contraire de « {r} »'], ['dés', 'le contraire de « {r} »'],
    ['re', '{r}, une fois de plus'], ['sur', 'bien trop {r}'], ['sous', 'pas assez {r}'], ['mé', '{r}, mais de travers'],
    ['pré', '{r}, avant que ce soit à la mode'], ['anti', 'contre tout ce qui est {r}'], ['super', 'extrêmement {r}'],
    ['contre', "{r} à l'envers"], ['co', '{r}, à plusieurs'], ['entre', '{r} entre amis'], ['inter', '{r} entre voisins'],
    ['archi', '{r} au plus haut point'], ['néo', '{r}, version moderne'],
  ];

  Predictionary.LANGS.fr = {
    vowels: new Set('aeiouyàâäéèêëîïôöùûüÿœæ'), morphemes: MORPHEMES, prefixes: PREFIXES, roots: ROOTS,
    suffixes: SUFFIXES, pos: POS, nounPos: 'n.m.', pluralPos: 'n. pl.', families: FAMILIES,
    affixSuffixes: AFFIX_SUFFIXES, affixPrefixes: AFFIX_PREFIXES,
    compounds: ['{b} avec une touche {de:a}', '{b} façon {a}', "le genre {de:b} qu'on ne trouve qu'à côté {de:a}",
      'une sorte {de:b}, mais {a}'],
    fallbacks: ['tout ce qui vous rappelle « {b} » sans raison apparente',
      'le moment où quelque chose devient presque « {b} », puis non',
      'un lointain cousin de « {b} », du côté de la famille dont on ne parle pas',
      'ce que devient « {b} » après minuit'],
    unknown: ['un mot qui attend encore son sens', "une chose que personne n'avait encore pris la peine de nommer",
      'un bruit qui ressemble à un mot, et qui pourrait bien le devenir'],
    soundsLike: 'ressemble à', blend: 'mot-valise de {a} et {b}',
    avoid: new Set('con conne connard cul merde putain pute salope bite chier enculé nique niquer'.split(' ')),
    stopwords: new Set(('le la les l un une des du de d au aux à et ou en dans sur pour par avec sans qui que qu quoi ' +
      'est sont être chose choses truc quelque très genre sorte comme ce cette ces son sa ses mon ma mes').split(' ')),
    stem: t => (t.endsWith('aux') && t.length > 4 ? t.slice(0, -3) + 'al'
      : /[sx]$/.test(t) && t.length > 3 ? t.slice(0, -1) : t),
    tokens: s => s.toLowerCase().match(/[a-zàâäçéèêëîïôöùûüÿœæ]+/g) || [],
    describe, example, fill, everyday: EVERYDAY, children: CHILDREN,
    plural: w => (w.endsWith('aux') ? w.slice(0, -3) + 'al' : /[^s][sx]$/.test(w) ? w.slice(0, -1) : ''),
    inflected: (w, v) => (/[sx]$/.test(w) && v.has(w.slice(0, -1))) || (w.endsWith('e') && v.has(w.slice(0, -1)))
      || (w.endsWith('es') && v.has(w.slice(0, -2))),
  };
}(typeof module !== 'undefined' ? require('./engine.js').Predictionary : Predictionary));
