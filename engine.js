// Predictionary engine: runs entirely on the device (iPhone web app and desktop).
'use strict';

const VOWELS = new Set('aeiouy');
const START = '^';
const END = '$';
const CREATIVITY = { wild: 2, balanced: 3, tame: 4 };
const STOPWORDS = new Set((
  'a an the of to for and or in on at with by about from into that who which what is are be ' +
  'being someone something thing things one ones very kind sort like').split(' '));

// link: vowel inserted before this form when the previous part ends in a consonant.
// adj: how a root reads as a modifier ("technological light").
const m = (form, kind, gloss, keys, link = '', adj = '') => ({ form, kind, gloss, keys: keys.split(' '), link, adj });

const MORPHEMES = [
  // prefixes (glosses must read before a noun: "fear of excessive water")
  m('un', 'prefix', 'non-', 'not no'),
  m('re', 'prefix', 'renewed', 'again back'),
  m('pre', 'prefix', 'early', 'before early'),
  m('post', 'prefix', 'late', 'after later'),
  m('anti', 'prefix', 'anti-', 'against opposite'),
  m('hyper', 'prefix', 'excessive', 'over excessive too much'),
  m('hypo', 'prefix', 'under-', 'under below'),
  m('micro', 'prefix', 'small', 'small tiny little'),
  m('mega', 'prefix', 'huge', 'huge giant big large'),
  m('neo', 'prefix', 'new', 'new modern'),
  m('pseudo', 'prefix', 'false', 'false fake'),
  m('auto', 'prefix', 'self-', 'self own automatic'),
  m('tele', 'prefix', 'remote', 'far distant remote'),
  m('omni', 'prefix', 'all', 'all every everything'),
  m('trans', 'prefix', 'cross-', 'across through beyond'),
  m('inter', 'prefix', 'shared', 'between among'),
  m('mis', 'prefix', 'mistaken', 'wrong wrongly badly'),
  m('poly', 'prefix', 'many', 'many multiple'),
  m('mono', 'prefix', 'single', 'single alone'),
  m('semi', 'prefix', 'half-', 'half partly'),
  m('meta', 'prefix', 'meta-', 'meta'),
  m('dys', 'prefix', 'dysfunctional', 'difficult broken'),
  m('eu', 'prefix', 'good', 'good pleasant'),
  // roots (combining forms)
  m('aqua', 'root', 'water', 'water', 'o', 'aquatic'),
  m('hydr', 'root', 'water', 'water', 'o', 'watery'),
  m('pyr', 'root', 'fire', 'fire', 'o', 'fiery'),
  m('terr', 'root', 'earth', 'earth land ground', 'o', 'earthly'),
  m('aer', 'root', 'air', 'air', 'o', 'airborne'),
  m('chron', 'root', 'time', 'time', 'o', 'time-bending'),
  m('phon', 'root', 'sound', 'sound voice noise', 'o', 'acoustic'),
  m('phot', 'root', 'light', 'light', 'o', 'luminous'),
  m('graph', 'root', 'writing', 'write writing drawing', 'o', 'handwritten'),
  m('bibli', 'root', 'books', 'book', 'o', 'bookish'),
  m('bio', 'root', 'life', 'life living', 'o', 'living'),
  m('necr', 'root', 'the dead', 'death dead', 'o', 'posthumous'),
  m('anthrop', 'root', 'humans', 'human people person', 'o', 'human'),
  m('dem', 'root', 'the people', 'crowd public', 'o', 'public'),
  m('ger', 'root', 'old age', 'old elderly aging', 'o', 'elderly'),
  m('cardi', 'root', 'the heart', 'heart', 'o', 'heartfelt'),
  m('cephal', 'root', 'the head', 'head', 'o', 'cerebral'),
  m('ocul', 'root', 'the eye', 'eye', 'o', 'visual'),
  m('chir', 'root', 'the hand', 'hand', 'o', 'hand-made'),
  m('pod', 'root', 'the foot', 'foot feet', 'o', 'barefoot'),
  m('dent', 'root', 'teeth', 'tooth teeth', 'i', 'dental'),
  m('somn', 'root', 'sleep', 'sleep sleeping nap', 'i', 'sleepy'),
  m('noct', 'root', 'night', 'night', 'i', 'nocturnal'),
  m('heli', 'root', 'the sun', 'sun sunny', 'o', 'solar'),
  m('lun', 'root', 'the moon', 'moon', 'i', 'lunar'),
  m('astr', 'root', 'stars', 'star space', 'o', 'stellar'),
  m('cosm', 'root', 'the universe', 'universe world cosmos', 'o', 'cosmic'),
  m('xen', 'root', 'strangers', 'stranger foreign', 'o', 'foreign'),
  m('cyber', 'root', 'computers', 'computer digital internet online', 'o', 'digital'),
  m('techn', 'root', 'technology', 'technology tech machine', 'o', 'technological'),
  m('crypt', 'root', 'secrets', 'hidden secret', 'o', 'secret'),
  m('kine', 'root', 'movement', 'movement motion moving', 'o', 'restless'),
  m('morph', 'root', 'shape', 'shape form', 'o', 'shape-shifting'),
  m('chrom', 'root', 'colour', 'colour color', 'o', 'colourful'),
  m('zo', 'root', 'animals', 'animal', 'o', 'animal'),
  m('phyt', 'root', 'plants', 'plant', 'o', 'botanical'),
  m('ichthy', 'root', 'fish', 'fish', 'o', 'fishy'),
  m('ornith', 'root', 'birds', 'bird', 'o', 'feathered'),
  m('arachn', 'root', 'spiders', 'spider', 'o', 'eight-legged'),
  m('cyn', 'root', 'dogs', 'dog', 'o', 'canine'),
  m('ailur', 'root', 'cats', 'cat', 'o', 'feline'),
  m('gastr', 'root', 'the stomach', 'stomach food eating', 'o', 'culinary'),
  m('oen', 'root', 'wine', 'wine', 'o', 'wine-soaked'),
  m('caffe', 'root', 'coffee', 'coffee', 'o', 'caffeinated'),
  m('erg', 'root', 'work', 'work working job', 'o', 'hard-working'),
  m('syn', 'root', 'gatherings', 'meeting together', 'o', 'collective'),
  m('lex', 'root', 'words', 'word vocabulary dictionary', 'i', 'verbal'),
  m('mnem', 'root', 'memory', 'memory remember', 'o', 'half-remembered'),
  m('pecun', 'root', 'money', 'money cash', 'i', 'financial'),
  m('chrys', 'root', 'gold', 'gold', 'o', 'golden'),
  m('tach', 'root', 'speed', 'speed fast quick', 'y', 'high-speed'),
  m('brady', 'root', 'slowness', 'slow slowness', 'o', 'slow-motion'),
  m('klept', 'root', 'theft', 'steal stealing theft', 'o', 'stolen'),
  m('psych', 'root', 'the mind', 'mind mental soul', 'o', 'mental'),
  m('soph', 'root', 'wisdom', 'wisdom wise', 'o', 'wise'),
  m('tox', 'root', 'poison', 'poison toxic', 'i', 'toxic'),
  m('hebdom', 'root', 'the week', 'week weekly monday', 'o', 'weekly'),
  m('ergast', 'root', 'the office', 'office workplace', 'o', 'office'),
  // suffixes ({x} is filled with the rest of the meaning)
  m('phobia', 'suffix', 'fear of {x}', 'fear afraid scared phobia', 'o'),
  m('philia', 'suffix', 'love of {x}', 'love liking fondness', 'o'),
  m('phile', 'suffix', 'a lover of {x}', 'lover fan enthusiast', 'o'),
  m('ology', 'suffix', 'the study of {x}', 'study science'),
  m('ologist', 'suffix', 'one who studies {x}', 'expert scientist'),
  m('mania', 'suffix', 'an obsession with {x}', 'obsession craze madness', 'o'),
  m('cracy', 'suffix', 'rule by {x}', 'rule government power', 'o'),
  m('graphy', 'suffix', 'writing about {x}', 'description record', 'o'),
  m('scope', 'suffix', 'an instrument for viewing {x}', 'view viewing see instrument', 'o'),
  m('meter', 'suffix', 'a device that measures {x}', 'measure measuring', 'o'),
  m('cide', 'suffix', 'the killing of {x}', 'killing kill', 'i'),
  m('vore', 'suffix', 'an eater of {x}', 'eater eats', 'i'),
  m('algia', 'suffix', 'pain from {x}', 'pain ache'),
  m('itis', 'suffix', 'inflammation of {x}', 'inflammation'),
  m('ism', 'suffix', 'the doctrine of {x}', 'belief doctrine movement'),
  m('ness', 'suffix', 'the quality of {x}', 'state quality'),
  m('less', 'suffix', 'without {x}', 'without lacking'),
  m('ify', 'suffix', 'to turn into {x}', 'make turn become'),
  m('tron', 'suffix', 'a device for {x}', 'device gadget', 'o'),
  m('arium', 'suffix', 'a place for {x}', 'place room house'),
  m('sphere', 'suffix', 'the world of {x}', 'community scene', 'o'),
  m('genic', 'suffix', 'producing {x}', 'producing causing', 'o'),
  m('naut', 'suffix', 'a voyager in {x}', 'traveller traveler voyager explorer', 'o'),
];
const PREFIXES = MORPHEMES.filter(x => x.kind === 'prefix');
const ROOTS = MORPHEMES.filter(x => x.kind === 'root');
const SUFFIXES = MORPHEMES.filter(x => x.kind === 'suffix');
const POS = { less: 'adj.', genic: 'adj.', ify: 'v.' };
// Words built from these endings are siblings: if "podology" exists, "podologist" is not new.
const FAMILIES = [
  ['ology', 'ologist', 'ological', 'ologic', 'ologies', 'ologists'],
  ['phobia', 'phobic', 'phobe', 'phobias'], ['philia', 'phile', 'philic', 'philiac', 'philous'],
  ['mania', 'maniac', 'manic', 'maniacal'], ['graphy', 'grapher', 'graphic', 'graph', 'graphical'],
  ['cracy', 'crat', 'cratic'], ['ism', 'ist', 'istic', 'ists'], ['meter', 'metry', 'metric', 'metre'],
  ['scope', 'scopy', 'scopic'], ['cide', 'cidal'], ['vore', 'vorous', 'vory'], ['algia', 'algic'],
  ['itis', 'itic'], ['naut', 'nautic', 'nautical', 'nautics'], ['genic', 'genesis', 'gen', 'genous', 'geny'],
  ['tron', 'tronic', 'tronics'], ['arium', 'aria', 'ary'], ['ify', 'ification', 'ified', 'ifier'],
  ['less', 'lessness', 'lessly'], ['ness', 'nesses'], ['sphere', 'spheric', 'spherical'],
];

// Two roots: the last is the head, the first modifies it in one of these ways.
const ACTIONS = ['improvement', 'measurement', 'bottling', 'translation', 'taming', 'rearrangement', 'recycling',
  'smuggling', 'polishing', 'forecasting', 'cataloguing', 'reinvention', 'sweetening', 'interrogation'];
const RELATIONS = ['powered by', 'inspired by', 'borrowed from', 'hidden inside', 'made from', 'guarded by',
  'mixed with', 'traded for', 'shaped like', 'measured in', 'haunted by', 'disguised as'];

// Sentence slots: {w} word, {W} Word, {x} meaning, {Who}/{who} a person, {where} a place, {When} a time.
const WHO = ['My grandmother', 'The night porter', 'A retired pilot', 'Our new neighbour', 'The village baker',
  'A tired accountant', 'The lighthouse keeper', 'My dentist', 'A philosophy student', 'The mayor',
  'A travelling magician', 'The school caretaker', 'A famous chef', 'The landlord', 'An off-duty astronaut',
  'The museum guard', 'A taxi driver from Porto', 'The choir director', 'My younger brother', 'A semi-retired detective',
  'The postwoman', 'A nervous best man', 'My yoga teacher', 'The quiz night champion', 'A bored lifeguard',
  'The woman at number 42', 'A first-year nurse', 'The hotel receptionist', 'My cousin from Cork', 'A jet-lagged violinist'];
const WHERE = ['in Lisbon', 'at the village fête', 'on the night train to Vienna', 'in a basement in Leeds',
  'at the back of the library', 'on a ferry to Tangier', 'in a Tokyo hotel lobby', 'at the annual fishing contest',
  'in the staff kitchen', 'halfway up a mountain', 'at a wedding in Naples', 'in a launderette in Glasgow',
  'at a motorway service station', 'in the queue at the post office', 'on a camping trip in Wales',
  'at a garden centre in Kent', 'in the back of a taxi', 'at the office Christmas party', 'on a rooftop in Madrid',
  'at a car boot sale'];
const WHEN = ['Last winter', 'Every Tuesday', 'Since the power cut', 'On the day the clocks went back',
  'Long before the internet', 'During the heatwave', 'The morning after the wedding',
  'By the third week of the strike', 'In the spring of 1987', 'Shortly after the lottery win',
  'Halfway through the meeting', 'On the first day of the sales', 'Just before midnight', 'After the third coffee',
  'On a rainy bank holiday', 'The week the boiler broke'];
const ADULTS = { who: WHO, where: WHERE, when: WHEN };
const KIDS = {
  who: ['My little sister', 'Our teacher', 'Grandpa', 'The new kid in class', 'A very small pirate', 'My best friend',
    'The dinner lady', 'A sleepy giant', 'The tooth fairy', 'My big brother', 'The bus driver', 'A shy dragon',
    'Granny', 'The head teacher', 'A friendly robot', 'My cousin Lily', 'The school librarian', 'A brave little mouse'],
  where: ['at the park', 'in the playground', 'at Granny\'s house', 'on the school bus', 'at the beach', 'under the bed',
    'in the treehouse', 'at the zoo', 'in a castle', 'at the swimming pool', 'in the garden', 'at the school fair',
    'in the sandpit', 'on a pirate ship', 'at the funfair', 'in the classroom'],
  when: ['Yesterday after school', 'On the last day of term', 'At bedtime', 'Every Saturday morning',
    'During the summer holidays', 'On a snowy day', 'Once upon a time', 'On my birthday', 'Right after lunch',
    'At playtime', 'During the school trip', 'On a rainy Sunday'],
};

const EXAMPLES = {
  phobia: [
    '{Who} developed a mild {w} {where}, and now avoids anything involving {x}.',
    '{When}, {who} finally admitted to {w}: the mere thought of {x} made their hands shake.',
    'Therapists {where} report a spike in {w}, with patients going quiet whenever {x} comes up.',
    'Thanks to her {w}, every invitation had to be checked for any hint of {x}.',
    'It isn\'t laziness, it\'s {w}: {x} genuinely terrifies him.'],
  philia: [
    '{Who} confessed to a lifelong {w}; the attic is full of anything connected to {x}.',
    '{When}, {who} discovered {w} and started planning holidays around {x}.',
    'Her {w} began innocently, with a single postcard about {x}.',
    'You can spot {w} a mile off: eyes light up the moment {x} is mentioned.'],
  phile: [
    '{Who}, a devoted {w}, keeps a scrapbook on {x}.',
    'Every {w} {where} turned up to argue about {x} until midnight.',
    'Only a true {w} would cross a continent for {x}.',
    '{When}, {who} came out as a {w} and nobody was surprised.'],
  ology: [
    '{Who} gave a surprisingly moving lecture on {w} {where}.',
    '{W} remains a small field: a dozen researchers, one journal and endless debates about {x}.',
    '{When}, the university quietly opened a department of {w}.',
    'Her thesis in {w} argued that we have badly underestimated {x}.',
    'Nobody took {w} seriously until {who} published the notebooks.'],
  ologist: [
    'The leading {w} {where} is, unexpectedly, {who}.',
    '{When}, a visiting {w} explained {x} so clearly that the room went silent.',
    'Ask any {w} about {x} and clear your afternoon.',
    '{Who} retrained as a {w} after an unforgettable encounter with {x}.'],
  mania: [
    '{When}, {w} swept the country: queues, t-shirts, and nothing but {x}.',
    'Economists blamed the shortage on {w}, a sudden craze for {x}.',
    '{Who} insists it isn\'t {w}, merely a healthy interest in {x}.',
    'By Friday, the {w} had spread to the staff room.'],
  cracy: [
    '{When}, the island experimented with {w}, letting {x} decide everything.',
    'Critics of {w} say {x} should never be in charge of the budget.',
    '{Who} campaigned for {w} with one slogan and a lot of leaflets.',
    'Under {w}, meetings got shorter and stranger.'],
  graphy: [
    '{Who} spent the winter writing a short {w}: forty pages about {x}.',
    'Her {w} won a prize {where}, mostly for its footnotes.',
    'The library\'s {w} section is one shelf long and always busy.',
    '{When}, {who} took up {w} and filled the spare room with notes on {x}.'],
  scope: [
    '{Who} pressed an eye to the {w} and finally saw {x} clearly.',
    'The museum keeps an antique {w}, once used to observe {x}.',
    'With a cheap {w} bought {where}, {who} spent the night watching {x}.',
    'Tilt the {w} slightly and {x} snaps into focus.'],
  meter: [
    '{Who} built a homemade {w} and was alarmed by the readings.',
    'Someone left a {w} on the meeting table; it rated {x} as "worrying".',
    '{When}, every household was issued a {w} to keep an eye on {x}.',
    'The {w} needle trembled whenever {x} came near.'],
  cide: [
    'The novel\'s twist is a slow, deliberate {w}: the steady destruction of {x}.',
    '{Who} was accused of {w} after the incident {where}.',
    'Activists are campaigning to end {w} once and for all.',
    '{When}, a quiet case of {w} made the local paper.'],
  vore: [
    '{Who}, a lifelong {w}, orders nothing but {x}.',
    'The zoo\'s newest {w} refuses everything except {x}.',
    '{When}, {who} went full {w} and the fridge has never recovered.',
    'As a {w}, she finds most menus disappointing.'],
  algia: [
    '{Who} took the afternoon off with {w}, a dull ache brought on by {x}.',
    'The doctor {where} diagnosed {w} and prescribed a week away from {x}.',
    '{When}, a wave of {w} hit the office.',
    'Mild {w} is common among people who think too hard about {x}.'],
  itis: [
    'Too much exposure to {x} and you risk {w}, warned {who}.',
    '{When}, {who} came down with a stubborn case of {w}.',
    'The clinic {where} sees more {w} every year.',
    'There is no cure for {w}, only rest and distance from {x}.'],
  ism: [
    'Followers of {w} meet {where} to discuss {x}.',
    '{Who} converted to {w} after a long conversation about {x}.',
    '{When}, {w} was the only thing anyone talked about at dinner.',
    'At its heart, {w} is a bet that {x} matters more than we think.'],
  ness: [
    'There was a strange {w} to the evening, a feeling of {x} in the air.',
    '{Who} describes the {w} of the old house as unbearable.',
    '{When}, a gentle {w} settled over the town.',
    'Poets have tried for centuries to put {w} into words.'],
  less: [
    'After the move, {who} felt completely {w}, cut off from {x}.',
    'The new office is entirely {w}, and nobody can concentrate.',
    '{When}, the whole town went {w} for a week.',
    'A {w} life is simpler, but {who} misses {x}.'],
  ify: [
    'The council plans to {w} the high street, filling it with {x}.',
    '{Who} decided to {w} the spare bedroom; it now revolves around {x}.',
    'Give her a weekend and she\'ll {w} anything.',
    '{When}, a startup promised to {w} the entire city.'],
  tron: [
    '{Who} built a {w} out of spare parts, a gadget for {x}.',
    'The {w} hummed in the corner {where}, quietly handling {x}.',
    '{When}, the {w} became the must-have gift.',
    'Plug in the {w}, press the green button and wait for {x}.'],
  arium: [
    'The new {w} {where} is the place to go for {x}.',
    '{Who} spent a whole afternoon in the {w}, surrounded by {x}.',
    '{When}, the town opened a {w}; the queue went round the block.',
    'Every school trip ends at the {w}.'],
  sphere: [
    'Everyone in the {w} has a strong opinion about {x}.',
    '{Who} is something of a celebrity in the {w}.',
    '{When}, the {w} was rocked by a scandal involving {x}.',
    'News travels fast in the {w}.'],
  genic: [
    'The plan proved highly {w}: it produced {x} wherever it went.',
    '{Who} has a {w} effect on any room.',
    '{When}, scientists {where} found something unexpectedly {w}.',
    'Be careful: that recipe is notoriously {w}.'],
  naut: [
    '{Who}, the first {w}, set off on a voyage through {x}.',
    '{When}, a lone {w} returned with stories about {x}.',
    'Training to be a {w} takes years and a strong stomach.',
    'The old {w} logbooks describe {x} in vivid detail.'],
  '': [
    'Nobody had a word for {x} until {who} said "{w}" {where}, and it stuck.',
    '{When}, {w} was all anyone {where} could talk about.',
    '{Who} keeps a jar of {w} on the kitchen shelf, just in case.',
    'The exhibition\'s centrepiece was a giant {w}, a meditation on {x}.',
    'There\'s a hint of {w} in everything {who} paints.'],
};

// English endings for Invent words built on a real word ("poor" + "ship"). {b} is the real word.
const EN_SUFFIXES = [
  ['ship', 'n.', 'the state or rank of being {b}'], ['hood', 'n.', 'the years of one\'s life spent {b}'],
  ['dom', 'n.', 'the realm of everything {b}'], ['ness', 'n.', 'the quality of being {b}'],
  ['ity', 'n.', 'the condition of being {b}'], ['ism', 'n.', 'a philosophy built entirely around {b}'],
  ['alism', 'n.', 'a philosophy built entirely around {b}'], ['ialism', 'n.', 'a philosophy built entirely around {b}'],
  ['ist', 'n.', 'someone devoted to {b}'], ['ialist', 'n.', 'a committed believer in {b}'],
  ['ize', 'v.', 'to make something {b} on purpose'], ['ise', 'v.', 'to make something {b} on purpose'],
  ['ized', 'adj.', 'deliberately made {b}'], ['ised', 'adj.', 'deliberately made {b}'],
  ['izing', 'v.', 'turning everything nearby {b}'], ['ization', 'n.', 'the slow process of making things {b}'],
  ['ify', 'v.', 'to add a touch of {b} to something'], ['ification', 'n.', 'the art of adding {b} to things'],
  ['er', 'n.', 'someone who deals in {b}'], ['ery', 'n.', 'a place where {b} is made or kept'],
  ['ette', 'n.', 'a small, charming {b}'], ['let', 'n.', 'a little {b}'], ['ling', 'n.', 'a young or small {b}'],
  ['ish', 'adj.', 'somewhat {b}'], ['y', 'adj.', 'a bit like {b}'], ['ly', 'adv.', 'in a {b} way'],
  ['ful', 'adj.', 'full of {b}'], ['less', 'adj.', 'without any {b}'], ['ous', 'adj.', 'overflowing with {b}'],
  ['ious', 'adj.', 'overflowing with {b}'], ['al', 'adj.', 'relating to {b}'], ['ial', 'adj.', 'relating to {b}'],
  ['ic', 'adj.', 'in the style of {b}'], ['ical', 'adj.', 'in the style of {b}'], ['ive', 'adj.', 'tending towards {b}'],
  ['able', 'adj.', 'that could easily become {b}'], ['ible', 'adj.', 'that could easily become {b}'],
  ['ation', 'n.', 'the act of making something {b}'], ['ment', 'n.', 'what is left after {b}'],
  ['ing', 'n.', 'the habit of going {b}'], ['ed', 'adj.', 'having recently turned {b}'],
  ['ward', 'adv.', 'in the direction of {b}'], ['wards', 'adv.', 'in the direction of {b}'],
  ['wise', 'adv.', 'in matters of {b}'], ['ian', 'n.', 'a follower of {b}'], ['ite', 'n.', 'a member of the {b} crowd'],
  ['ee', 'n.', 'someone on the receiving end of {b}'], ['age', 'n.', 'the whole collection of {b} in one place'],
  ['scape', 'n.', 'a landscape made of {b}'], ['fest', 'n.', 'a festival of {b}'], ['core', 'n.', 'a music genre about {b}'],
  ['ary', 'n.', 'a collection of {b}'], ['idae', 'n.', 'the animal family that includes {b}'],
  ['aceae', 'n.', 'the plant family that includes {b}'], ['ology', 'n.', 'the study of {b}'],
  ['ologist', 'n.', 'an expert in {b}'], ['ent', 'adj.', 'giving off {b}'], ['ance', 'n.', 'the art of {b}'],
  ['ence', 'n.', 'the art of {b}'], ['ure', 'n.', 'whatever is left over from {b}'],
  ['ectomy', 'n.', 'the surgical removal of {b}'], ['oid', 'adj.', 'shaped a lot like {b}'],
].sort((a, b) => b[0].length - a[0].length);
// {r} is the meaning of the rest of the word.
const EN_PREFIXES = [
  ['un', 'not {r}'], ['non', 'anything but {r}'], ['re', '{r}, all over again'], ['over', 'far too {r}'],
  ['under', 'not quite {r} enough'], ['mis', '{r}, done wrong'], ['dis', 'the opposite of {r}'],
  ['pre', '{r}, before it was cool'], ['out', 'more {r} than anyone else'], ['super', 'extremely {r}'],
  ['anti', 'against anything {r}'], ['semi', 'half {r}'], ['counter', '{r} in reverse'], ['co', '{r}, done together'],
  ['sub', 'a lesser kind of {r}'], ['inter', '{r} between friends'],
];
const COMPOUNDS = ['the {a} kind of {b}', '{b} with a touch of {a}', '{b}, but {a}', 'a {b} you only find near {a}'];
const FALLBACKS = ['anything that reminds you of "{b}" for no clear reason',
  'the moment something almost becomes "{b}", then doesn\'t',
  'a distant cousin of "{b}", from the side of the family nobody mentions',
  'what "{b}" turns into after midnight'];

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const longest = arr => arr.reduce((best, x) => (!best || x.form.length > best.form.length ? x : best), null);
const shortGloss = p => p.gloss.replace(/\{[^}]*\}/g, '…');
const recipeOf = parts => parts.map(p => `${p.form} (${shortGloss(p)})`).join(' + ');
const product = lists => lists.reduce((acc, l) => acc.flatMap(a => l.map(x => [...a, x])), [[]]);
const permutations = arr => (arr.length <= 1 ? [arr.slice()]
  : arr.flatMap((x, i) => permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(p => [x, ...p])));
const lowerFirst = s => s[0].toLowerCase() + s.slice(1);
const upperFirst = s => s[0].toUpperCase() + s.slice(1);
const noThe = s => s.replace(/^the /, '');

function stem(t) {
  if (t.endsWith('ies') && t.length > 4) return t.slice(0, -3) + 'y';
  if (t.endsWith('s') && !t.endsWith('ss') && t.length > 3) return t.slice(0, -1);
  return t;
}

/** Turn roots into one noun phrase: "the technological improvement of light", not "technology and light". */
function relate(roots) {
  if (!roots.length) return '';
  if (roots.length === 1) return roots[0].gloss;
  const head = roots[roots.length - 1];
  const mods = roots.slice(0, -1);
  const style = roots.length > 2 ? 0 : Math.floor(Math.random() * 3);
  if (style === 1) return `the ${mods[0].adj} ${pick(ACTIONS)} of ${head.gloss}`;
  if (style === 2) return `${head.gloss} ${pick(RELATIONS)} ${mods[0].gloss}`;
  return `${mods.map(r => r.adj).join(', ')} ${noThe(head.gloss)}`;
}

/** Return [core meaning, full definition] for a prefix/roots/suffix split. */
function describe(pre, roots, suf) {
  let core = relate(roots);
  if (pre) {
    const sep = pre.gloss.endsWith('-') ? '' : ' ';
    core = pre.gloss + sep + noThe(core || 'things'); // "excessive heart", not "excessive the heart"
  }
  if (suf) return [core, suf.gloss.replace('{x}', core)];
  return [core, roots.length > 1 ? `a name for ${core}` : `something to do with ${core}`];
}

const recentTemplates = [];
const AN = /\b([Aa]) (?=[aeio]|u(?!ni|se))/g; // "a umbrella" -> "an umbrella", but "a unicorn"

/** Fill a sentence for this word, avoiding templates used in the last dozen sentences. */
function exampleFor(key, w, x) {
  const all = EXAMPLES[key];
  const fresh = all.filter(t => !recentTemplates.includes(t));
  const t = pick(fresh.length ? fresh : all);
  recentTemplates.push(t);
  if (recentTemplates.length > 12) recentTemplates.shift();
  const S = key.startsWith('ch:') ? KIDS : ADULTS;
  const who = pick(S.who);
  const xs = typeof x === 'string' ? { np: x, pl: x } : x;
  return t.replaceAll('{W}', upperFirst(w)).replaceAll('{w}', w).replaceAll('{s:x}', xs.pl)
    .replaceAll('{0:x}', xs.np.replace(/^(a|an) /, '')).replaceAll('{x}', xs.np)
    .replaceAll('{Who}', who).replaceAll('{who}', lowerFirst(who))
    .replaceAll('{where}', pick(S.where)).replaceAll('{When}', pick(S.when))
    .replace(AN, '$1n ');
}

// Everyday style: blends, everyday endings and prefixes on ordinary words.
// [word, as a noun phrase, plural, type: day | event | food | thing | tech | animal | weather]
const EVERYDAY_WORDS = [
  ['monday', 'a Monday', 'Mondays', 'day'], ['sunday', 'a Sunday', 'Sundays', 'day'], ['friday', 'a Friday', 'Fridays', 'day'],
  ['weekend', 'a weekend', 'weekends', 'day'], ['birthday', 'a birthday', 'birthdays', 'day'],
  ['holiday', 'a holiday', 'holidays', 'day'],
  ['nap', 'a nap', 'naps', 'event'], ['meeting', 'a meeting', 'meetings', 'event'], ['commute', 'a commute', 'commutes', 'event'],
  ['deadline', 'a deadline', 'deadlines', 'event'], ['picnic', 'a picnic', 'picnics', 'event'],
  ['queue', 'a queue', 'queues', 'event'], ['hug', 'a hug', 'hugs', 'event'], ['traffic', 'a traffic jam', 'traffic jams', 'event'],
  ['wedding', 'a wedding', 'weddings', 'event'], ['barbecue', 'a barbecue', 'barbecues', 'event'],
  ['hiccup', 'a hiccup', 'hiccups', 'event'], ['sneeze', 'a sneeze', 'sneezes', 'event'], ['yawn', 'a yawn', 'yawns', 'event'],
  ['haircut', 'a haircut', 'haircuts', 'event'], ['karaoke', 'a karaoke night', 'karaoke nights', 'event'],
  ['sandwich', 'a sandwich', 'sandwiches', 'food'], ['pizza', 'a pizza', 'pizzas', 'food'], ['coffee', 'a coffee', 'coffees', 'food'],
  ['snack', 'a snack', 'snacks', 'food'], ['breakfast', 'a breakfast', 'breakfasts', 'food'],
  ['biscuit', 'a biscuit', 'biscuits', 'food'], ['doughnut', 'a doughnut', 'doughnuts', 'food'],
  ['croissant', 'a croissant', 'croissants', 'food'], ['noodle', 'a noodle', 'noodles', 'food'],
  ['pancake', 'a pancake', 'pancakes', 'food'], ['cupcake', 'a cupcake', 'cupcakes', 'food'], ['waffle', 'a waffle', 'waffles', 'food'],
  ['muffin', 'a muffin', 'muffins', 'food'], ['taco', 'a taco', 'tacos', 'food'], ['pickle', 'a pickle', 'pickles', 'food'],
  ['sofa', 'a sofa', 'sofas', 'thing'], ['sock', 'a sock', 'socks', 'thing'], ['umbrella', 'an umbrella', 'umbrellas', 'thing'],
  ['toaster', 'a toaster', 'toasters', 'thing'], ['pillow', 'a pillow', 'pillows', 'thing'], ['fridge', 'a fridge', 'fridges', 'thing'],
  ['bus', 'a bus', 'buses', 'thing'], ['blanket', 'a blanket', 'blankets', 'thing'], ['mug', 'a mug', 'mugs', 'thing'],
  ['slipper', 'a slipper', 'slippers', 'thing'], ['backpack', 'a backpack', 'backpacks', 'thing'],
  ['scooter', 'a scooter', 'scooters', 'thing'], ['wardrobe', 'a wardrobe', 'wardrobes', 'thing'], ['lift', 'a lift', 'lifts', 'thing'],
  ['kettle', 'a kettle', 'kettles', 'thing'], ['balloon', 'a balloon', 'balloons', 'thing'],
  ['inbox', 'an inbox', 'inboxes', 'tech'], ['playlist', 'a playlist', 'playlists', 'tech'], ['selfie', 'a selfie', 'selfies', 'tech'],
  ['password', 'a password', 'passwords', 'tech'], ['battery', 'a battery', 'batteries', 'tech'],
  ['podcast', 'a podcast', 'podcasts', 'tech'], ['meme', 'a meme', 'memes', 'tech'], ['email', 'an email', 'emails', 'tech'],
  ['spreadsheet', 'a spreadsheet', 'spreadsheets', 'tech'], ['charger', 'a charger', 'chargers', 'tech'],
  ['laptop', 'a laptop', 'laptops', 'tech'], ['emoji', 'an emoji', 'emojis', 'tech'], ['router', 'a router', 'routers', 'tech'],
  ['notification', 'a notification', 'notifications', 'tech'], ['printer', 'a printer', 'printers', 'tech'],
  ['cat', 'a cat', 'cats', 'animal'], ['dog', 'a dog', 'dogs', 'animal'], ['pigeon', 'a pigeon', 'pigeons', 'animal'],
  ['goldfish', 'a goldfish', 'goldfish', 'animal'], ['hamster', 'a hamster', 'hamsters', 'animal'],
  ['penguin', 'a penguin', 'penguins', 'animal'], ['llama', 'a llama', 'llamas', 'animal'],
  ['squirrel', 'a squirrel', 'squirrels', 'animal'], ['duck', 'a duck', 'ducks', 'animal'],
  ['cloud', 'a cloud', 'clouds', 'weather'], ['puddle', 'a puddle', 'puddles', 'weather'], ['drizzle', 'a drizzle', 'drizzles', 'weather'],
  ['thunderstorm', 'a thunderstorm', 'thunderstorms', 'weather'], ['rainbow', 'a rainbow', 'rainbows', 'weather'],
  ['snowflake', 'a snowflake', 'snowflakes', 'weather'], ['heatwave', 'a heatwave', 'heatwaves', 'weather'],
  ['hailstorm', 'a hailstorm', 'hailstorms', 'weather'],
];

function joinEn(word, suffix) {
  if (word.at(-1) === suffix[0]) return word + suffix.slice(1); // pizza + aholic
  if (word.endsWith('e') && VOWELS.has(suffix[0])) return word.slice(0, -1) + suffix; // commute + ish
  return word + suffix;
}

// Meanings for blends: a = the first word, b = the second (the head); a/b list the word types that fit.
const PHYSICAL = ['food', 'thing', 'tech', 'animal', 'weather'];
const EVERYDAY = {
  words: EVERYDAY_WORDS.map(([w, np, pl, cat]) => ({ w, x: { np, pl }, cat })),
  suffixes: [
    { form: 'ish', pos: 'adj.', gloss: ['feeling a bit like {x}', 'not quite {x}, but close', 'slightly too fond of {s:x}',
      'in the mood for {x} but too polite to say so'] },
    { form: 'core', pos: 'n.', gloss: ['an aesthetic built entirely around {s:x}', 'a music genre that only sings about {s:x}',
      'a fashion trend inspired by {s:x}', 'a whole way of life based on {s:x}'] },
    { form: 'ify', pos: 'v.', gloss: ['to make anything feel like {x}', 'to add a little too much {0:x} to something',
      'to explain everything using {s:x}', 'to quietly replace something with {x}'] },
    { form: 'ster', pos: 'n.', gloss: ['someone who lives for {s:x}', 'a person who always knows where the best {s:x} are',
      'the friend who turns every conversation to {s:x}', 'a local legend in the world of {s:x}'] },
    { form: 'fest', pos: 'n.', gloss: ['a day-long celebration of {s:x}', 'a party where everyone has to bring {x}',
      'a festival with nothing on the programme but {s:x}', 'a week when {s:x} are suddenly everywhere'] },
    { form: 'less', pos: 'adj.', gloss: ['stuck without {x}', 'having lost {x} and refusing to talk about it',
      'bravely getting through the day without {x}', 'missing {x} more than anyone expected'] },
    { form: 'aholic', pos: 'n.', gloss: ['someone who cannot stop thinking about {s:x}', 'a person who owns far too many {s:x}',
      'someone who plans every holiday around {s:x}', 'a person who has never once said no to {x}'] },
    { form: 'ery', pos: 'n.', gloss: ['a shop that sells nothing but {s:x}', 'a small workshop where {s:x} are made by hand',
      'a secret room full of {s:x}', 'a museum dedicated to the history of {s:x}'] },
    { form: 'ism', pos: 'n.', gloss: ['the belief that everything is better with {x}', 'a political movement promising {s:x} for all',
      'the habit of judging people by their {s:x}', 'a school of thought that started with {x} and got out of hand'] },
    { form: 'nado', pos: 'n.', gloss: ['a sudden swirling storm of {s:x}', 'the chaos that follows when there are far too many {s:x}',
      'a whirlwind of {s:x} that arrives without warning', 'the weather forecast nobody wanted: {s:x} all afternoon'] },
    { form: 'ville', pos: 'n.', gloss: ['a town where everything revolves around {s:x}', 'the place your mind wanders to when you think about {s:x}',
      'a theme park where every ride is about {s:x}', 'a tiny village where everyone owns {x}'] },
    { form: 'ology', pos: 'n.', gloss: ['the very serious study of {s:x}', 'a degree nobody asked for, entirely about {s:x}',
      'the science of finding the perfect {0:x}', 'the art of talking about {s:x} for hours'] },
    { form: 'tastic', pos: 'adj.', gloss: ['as good as {x} on a Friday', 'unbelievably full of {s:x}',
      'better than {s:x}, and that is saying something', 'shining with the joy of {x}'] },
    { form: 'zilla', pos: 'n.', gloss: ['a monster made entirely of {s:x}', '{x} that has grown far too big',
      'someone who turns terrifying when they don\'t get {x}', 'a giant {0:x} stomping through the city'] },
    { form: 'let', pos: 'n.', gloss: ['a tiny, adorable {0:x}', { t: 'a {0:x} small enough to fit in a pocket', a: PHYSICAL },
      'a baby {0:x}, still learning the ropes', { t: 'a {0:x} so small you could lose it down the sofa', a: PHYSICAL }] },
  ],
  prefixes: [
    { form: 'mega', gloss: ['{x}, but enormous', 'the biggest {0:x} anyone has ever seen', '{x} so big it has its own postcode',
      '{x} with the volume turned all the way up'] },
    { form: 'mini', gloss: ['a miniature {0:x}', { t: 'a {0:x} small enough to fit in your hand', a: PHYSICAL },
      '{x} for people in a hurry', { t: 'a {0:x} sized for a hamster', a: ['food', 'thing', 'tech'] }] },
    { form: 'over', gloss: ['far too much {0:x}', { t: '{x} that went on for far too long', a: ['event'] },
      'the feeling of having had one {0:x} too many', 'an excessive love of {s:x}'] },
    { form: 'anti', gloss: ['the exact opposite of {x}', 'something designed to protect you from {s:x}',
      'a club for people who cannot stand {s:x}', 'a spray that keeps {s:x} away'] },
    { form: 're', gloss: ['{x}, all over again', 'a second {0:x} nobody asked for', 'a {0:x} you thought you had got rid of',
      'an old {0:x} brought back to life'] },
    { form: 'super', gloss: ['{x} with superpowers', 'the best {0:x} of the year', '{x} that saves the day', '{x} wearing a cape'] },
    { form: 'un', gloss: ['the feeling of {x} slowly disappearing', 'something that is definitely not {x}',
      '{x} that never actually happened', 'a {0:x} that undoes itself as soon as you look away'] },
    { form: 'semi', gloss: ['half {x}, half something else', '{x} that only half works', '{x} you only half remember',
      'a {0:x} that hasn\'t made its mind up'] },
    { form: 'ultra', gloss: ['the most extreme {0:x} imaginable', '{x}, but turned up to eleven'] },
    { form: 'pre', gloss: ['the moment just before {x} shows up', 'a small warm-up {0:x} before the real one'] },
    { form: 'post', gloss: ['whatever is left after {x}', 'the strange calm right after {x}'] },
    { form: 'micro', gloss: ['a {0:x} you need a magnifying glass to see', 'the smallest possible amount of {0:x}'] },
  ],
  mixes: [
    '{b} that somehow turns into {a}', 'what you get when {a} meets {b}', '{b} with the energy of {a}',
    'the moment you realise {b} is really {a}',
    { t: '{b} with {a} as the only meal', a: ['food'], b: ['event'] },
    { t: 'the {0:a} you only ever need during {b}', a: ['thing'], b: ['event'] },
    { t: '{b} ruined by {a}', a: ['weather'], b: ['event'] },
    { t: '{b} that {a} has quietly claimed as its own', a: ['animal'], b: ['thing'] },
    { t: '{b} spent staring at {a}', a: ['tech'], b: ['event'] },
    { t: 'the feeling of {a} in the middle of {b}', a: ['event'], b: ['event'] },
    { t: '{b} that always smells faintly of {0:a}', a: ['food'], b: ['thing'] },
    { t: '{b} that keeps turning up where {a} should be', a: ['thing'], b: ['thing'] },
    { t: '{b} with {a} watching your every move', a: ['animal'], b: ['event'] },
    { t: '{b} that needs charging more often than {a}', a: ['tech'], b: ['thing'] },
    { t: '{b} that appears out of nowhere, like {a}', a: ['weather'] },
    { t: '{b} that tastes suspiciously like {a}', b: ['food'] },
    { t: '{b} that only makes sense on {a}', a: ['day'] },
    { t: '{b} that {a} has already licked', a: ['animal'], b: ['food'] },
    { t: '{b} that has learned to use {a}', a: ['tech'], b: ['animal'] },
    { t: '{b} you only find after {a}', a: ['weather'], b: ['thing'] },
    { t: '{b} that will do anything for {a}', a: ['food'], b: ['animal'] },
    { t: '{b} that feels a week long because of {a}', b: ['day'] },
    { t: '{b} where everyone has to bring {a}', a: ['food', 'thing'], b: ['event'] },
    { t: '{b} interrupted by {a} at the worst possible moment', a: ['animal', 'tech', 'weather'], b: ['event'] },
    { t: '{b} that only works if you are holding {a}', a: ['thing', 'food'], b: ['tech'] },
    { t: '{b} shaped exactly like {a}', a: ['animal', 'food', 'thing'], b: ['food', 'thing'] },
    { t: '{b} that {a} keeps stealing', a: ['animal'], b: ['food', 'thing', 'tech'] },
    { t: '{b} you can only get on {a}', a: ['day'], b: ['food'] },
    { t: '{b} that starts playing music whenever {a} begins', a: ['weather', 'event'], b: ['thing', 'tech'] },
    { t: '{b} that should never have been invited to {a}', a: ['event'], b: ['animal'] },
    { t: '{b} that smells of {0:a} and nobody knows why', a: ['food', 'weather'], b: ['tech', 'thing'] },
    { t: 'the sudden urge for {a} in the middle of {b}', a: ['food'], b: ['event'] },
    { t: '{b} that is secretly run by {s:a}', a: ['animal'], b: ['event', 'thing', 'tech'] },
    { t: '{b} that only {a} would understand', a: ['animal'] },
    { t: '{b} with the attention span of {a}', a: ['animal'], b: ['event', 'tech'] },
    { t: '{b} that brings {a} with it wherever it goes', a: ['weather'], b: ['animal', 'thing', 'event'] },
  ],
  join: joinEn,
  joinPrefix: (pre, word) => pre + word,
  mixPos: () => 'n.',
};
Object.assign(EXAMPLES, {
  'ev:ish': ['It\'s only Tuesday, but the whole office feels {w}.', '{Who} gets a little {w} every time it rains.',
    'There\'s a {w} feeling in the air {where} today.', '{When}, {who} went quietly {w} and nobody noticed.',
    'Don\'t talk to {who} before ten: they\'re still {w}.'],
  'ev:core': ['{When}, {w} took over every café {where}.', 'Her flat is pure {w}, right down to the curtains.',
    '{Who} has gone full {w}, and honestly it suits them.', 'The {w} look is all over the magazines this spring.',
    'You can spot a {w} fan {where} from a mile away.'],
  'ev:ify': ['{Who} has decided to {w} the whole house.', 'The new manager wants to {w} every meeting.',
    'Give {who} ten minutes and they\'ll {w} anything.', '{When}, a startup promised to {w} the entire city.',
    'Please don\'t {w} the wedding speech.'],
  'ev:ster': ['{Who} is a proud {w} and doesn\'t care who knows it.', 'Every {w} {where} turned up early.',
    'Ask any {w}: they\'ll talk for an hour.', '{When}, {who} was crowned {w} of the year.',
    'There\'s always one {w} at every party.'],
  'ev:fest': ['{When}, the town threw its very first {w}.', 'The annual {w} {where} sold out in minutes.',
    '{Who} has been planning this year\'s {w} since January.', 'Tickets for {W} are like gold dust.',
    'Nobody remembers how the {w} started, but nobody wants it to stop.'],
  'ev:less': ['{Who} spent the whole week {w} and survived.', 'Being {w} {where} turned out to be oddly relaxing.',
    '{When}, the whole street went {w}.', 'A {w} weekend is harder than it sounds.',
    '{Who} came back from holiday looking {w} and very relieved.'],
  'ev:aholic': ['{Who}, a self-confessed {w}, has finally asked for help.', 'Every family has one {w}.',
    'The {w} support group meets {where} on Thursdays.', '{When}, {who} admitted to being a {w}.',
    'You can always tell a {w} by the look in their eye.'],
  'ev:ery': ['A tiny {w} has just opened {where}.', '{Who} spends every Saturday at the {w}.',
    'The old {w} {where} has been there since 1952.', '{When}, the {w} ran out of stock for the first time.',
    'There\'s a queue outside the {w} again.'],
  'ev:ism': ['{Who} preaches {w} to anyone who will listen.', '{When}, {w} became the town\'s unofficial religion.',
    'The rise of {w} has been gradual but unstoppable.', '{Who} gave a talk on {w} {where} and the room was packed.',
    'Critics of {w} are always invited and never turn up.'],
  'ev:nado': ['{When}, a {w} hit the town and nobody went to work.', 'The weather forecast warns of a {w} {where}.',
    '{Who} filmed the {w} from an upstairs window.', 'Nobody saw the {w} coming.',
    'After the {w}, the whole street needed tidying.'],
  'ev:ville': ['{Who} has been living in {W} for years.', 'Welcome to {W}, population: one very happy {0:x}.',
    'The bus to {W} leaves every hour {where}.', '{When}, {who} finally moved to {W}.',
    'Nobody ever leaves {W} without a souvenir.'],
  'ev:ology': ['{Who} has a PhD in {w}.', 'The {w} department {where} has one professor and three cats.',
    '{When}, {w} was finally recognised as a real science.', 'The first {w} conference took place {where}.',
    'Nobody understands {w} quite like {who}.'],
  'ev:tastic': ['The party {where} was absolutely {w}.', '{Who} called the new menu totally {w}.',
    '{When}, everything felt a bit {w}.', 'It wasn\'t just good, it was {w}.', 'Their new song is properly {w}.'],
  'ev:zilla': ['{When}, {who} accidentally created a {w}.', 'The {w} was last seen {where}.',
    'Lock the doors: the {w} is back.', '{Who} swears the {w} is harmless if you stay calm.',
    'Every town has a {w} story, and ours happened {where}.'],
  'ev:let': ['{Who} keeps a {w} in their coat pocket.', 'Look at that {w}! Isn\'t it sweet?',
    '{When}, {who} came home with a {w}.', 'The {w} is the cutest thing {where}.',
    'Everyone wanted to hold the {w}.'],
  'ev:pre': ['Nobody was ready for the {w} {where}.', '{Who} still talks about the {w} of 1987.',
    '{When}, a {w} changed everything.', 'If you ever meet a {w}, stay calm and back away slowly.',
    '{Who} swears they saw a {w} {where}.', 'The local paper ran a whole page on the {w}.',
    'There was a {w} {where}, and the photos are incredible.', 'Everyone has a {w} story, but {who} has the best one.',
    '{Who} has been dreaming of a {w} for years.', 'The {w} is back, and this time it\'s personal.',
    'They say you never forget your first {w}.', '{When}, the {w} made the evening news.',
    'The {w} is not for the faint-hearted.', 'If in doubt, blame the {w}.'],
  'ev:mix': ['{Who} invented the {w} {where}, and nobody has looked back.',
    'Nothing ruins a quiet afternoon like an unexpected {w}.', '{When}, the {w} became a household word.',
    'Ask anyone {where} about the {w}: they all have a story.',
    '{Who} swears the {w} is the best thing to happen {where} in years.',
    'There is no polite way to explain a {w} to your boss.', '{When}, {who} posted a photo of a {w} and it went viral.',
    'Every office has at least one {w}, and everyone pretends not to notice.',
    '{Who} keeps a notebook of every {w} they have ever seen.', 'You haven\'t lived until you\'ve had a proper {w} {where}.',
    'I wasn\'t going to mention the {w}, but here we are.', '{Who} blames the {w} for everything.',
    '{When}, {who} had their very first {w}.', 'Nobody talks about the {w} {where} any more.',
    'The {w} is either genius or a terrible mistake.', 'Somewhere {where}, a {w} is happening right now.',
    '{Who} wrote a whole song about the {w}.', 'There\'s a {w} in every family photo album.'],
});

// Children style: kid words, kid endings, kid meanings, and sentences with kid characters (KIDS).
// [word, as a noun phrase, plural, type: event | food | thing | animal | weather | character]
const CHILDREN_WORDS = [
  ['bedtime', 'a bedtime', 'bedtimes', 'event'], ['bathtime', 'a bathtime', 'bathtimes', 'event'],
  ['playtime', 'a playtime', 'playtimes', 'event'], ['sleepover', 'a sleepover', 'sleepovers', 'event'],
  ['picnic', 'a picnic', 'picnics', 'event'], ['birthday', 'a birthday party', 'birthday parties', 'event'],
  ['homework', 'a homework sheet', 'homework sheets', 'event'], ['tickle', 'a tickle', 'tickles', 'event'],
  ['giggle', 'a giggle', 'giggles', 'event'], ['holiday', 'a holiday', 'holidays', 'event'], ['disco', 'a disco', 'discos', 'event'],
  ['jelly', 'a jelly', 'jellies', 'food'], ['cookie', 'a cookie', 'cookies', 'food'], ['popcorn', 'a bowl of popcorn', 'bowls of popcorn', 'food'],
  ['spaghetti', 'a plate of spaghetti', 'plates of spaghetti', 'food'], ['banana', 'a banana', 'bananas', 'food'],
  ['carrot', 'a carrot', 'carrots', 'food'], ['lollipop', 'a lollipop', 'lollipops', 'food'], ['pancake', 'a pancake', 'pancakes', 'food'],
  ['cupcake', 'a cupcake', 'cupcakes', 'food'], ['broccoli', 'a broccoli tree', 'broccoli trees', 'food'], ['muffin', 'a muffin', 'muffins', 'food'],
  ['sausage', 'a sausage', 'sausages', 'food'], ['toast', 'a slice of toast', 'slices of toast', 'food'], ['custard', 'a bowl of custard', 'bowls of custard', 'food'],
  ['crayon', 'a crayon', 'crayons', 'thing'], ['backpack', 'a backpack', 'backpacks', 'thing'], ['teddy', 'a teddy', 'teddies', 'thing'],
  ['slide', 'a slide', 'slides', 'thing'], ['swing', 'a swing', 'swings', 'thing'], ['trampoline', 'a trampoline', 'trampolines', 'thing'],
  ['bucket', 'a bucket', 'buckets', 'thing'], ['kite', 'a kite', 'kites', 'thing'], ['lunchbox', 'a lunchbox', 'lunchboxes', 'thing'],
  ['sock', 'a sock', 'socks', 'thing'], ['pillow', 'a pillow', 'pillows', 'thing'], ['bike', 'a bike', 'bikes', 'thing'],
  ['sandcastle', 'a sandcastle', 'sandcastles', 'thing'], ['balloon', 'a balloon', 'balloons', 'thing'], ['bubble', 'a bubble', 'bubbles', 'thing'],
  ['puzzle', 'a puzzle', 'puzzles', 'thing'], ['drum', 'a drum', 'drums', 'thing'], ['snowman', 'a snowman', 'snowmen', 'thing'],
  ['puppy', 'a puppy', 'puppies', 'animal'], ['kitten', 'a kitten', 'kittens', 'animal'], ['dinosaur', 'a dinosaur', 'dinosaurs', 'animal'],
  ['unicorn', 'a unicorn', 'unicorns', 'animal'], ['dragon', 'a dragon', 'dragons', 'animal'], ['monkey', 'a monkey', 'monkeys', 'animal'],
  ['frog', 'a frog', 'frogs', 'animal'], ['penguin', 'a penguin', 'penguins', 'animal'], ['octopus', 'an octopus', 'octopuses', 'animal'],
  ['bunny', 'a bunny', 'bunnies', 'animal'], ['hamster', 'a hamster', 'hamsters', 'animal'], ['giraffe', 'a giraffe', 'giraffes', 'animal'],
  ['shark', 'a shark', 'sharks', 'animal'], ['tortoise', 'a tortoise', 'tortoises', 'animal'], ['owl', 'an owl', 'owls', 'animal'],
  ['elephant', 'an elephant', 'elephants', 'animal'], ['ladybird', 'a ladybird', 'ladybirds', 'animal'], ['snail', 'a snail', 'snails', 'animal'],
  ['puddle', 'a puddle', 'puddles', 'weather'], ['rainbow', 'a rainbow', 'rainbows', 'weather'], ['snowflake', 'a snowflake', 'snowflakes', 'weather'],
  ['raindrop', 'a raindrop', 'raindrops', 'weather'], ['cloud', 'a cloud', 'clouds', 'weather'], ['storm', 'a storm', 'storms', 'weather'],
  ['sunbeam', 'a sunbeam', 'sunbeams', 'weather'],
  ['pirate', 'a pirate', 'pirates', 'character'], ['wizard', 'a wizard', 'wizards', 'character'], ['fairy', 'a fairy', 'fairies', 'character'],
  ['monster', 'a monster', 'monsters', 'character'], ['ghost', 'a ghost', 'ghosts', 'character'], ['superhero', 'a superhero', 'superheroes', 'character'],
  ['alien', 'an alien', 'aliens', 'character'], ['mermaid', 'a mermaid', 'mermaids', 'character'], ['knight', 'a knight', 'knights', 'character'],
  ['princess', 'a princess', 'princesses', 'character'], ['giant', 'a giant', 'giants', 'character'], ['robot', 'a robot', 'robots', 'character'],
];
const LIVING = ['animal', 'character'];
const CHILDREN = {
  words: CHILDREN_WORDS.map(([w, np, pl, cat]) => ({ w, x: { np, pl }, cat })),
  suffixes: [
    { form: 'saurus', pos: 'n.', gloss: ['a dinosaur that is scared of {s:x}', { t: 'a big, friendly dinosaur that only eats {s:x}', a: ['food'] },
      { t: 'the biggest {0:x} that ever lived, millions of years ago', a: LIVING }, 'a dinosaur with {x} painted on its tail'] },
    { form: 'icorn', pos: 'n.', gloss: [{ t: 'a magic horse with {x} on its head', a: ['food', 'thing', 'animal', 'weather', 'character'] },
      'a unicorn that leaves a trail of {s:x}', { t: 'a unicorn that only comes out during {x}', a: ['event'] }] },
    { form: 'bot', pos: 'n.', gloss: ['a robot that thinks it is {x}', { t: 'a little robot that tidies away {s:x}', a: ['food', 'thing'] },
      'a robot that beeps whenever {x} is near'] },
    { form: 'tastic', pos: 'adj.', gloss: ['as exciting as {x} on a Saturday', 'full of {s:x} from top to bottom',
      { t: 'so happy you want to dance like {x}', a: LIVING }] },
    { form: 'zilla', pos: 'n.', gloss: ['a giant {0:x} that only wants a hug', 'a friendly monster made of {s:x}',
      'a {0:x} as tall as the school'] },
    { form: 'ville', pos: 'n.', gloss: [{ t: 'a town where everything is made of {s:x}', a: ['food', 'thing'] },
      { t: 'a land where {s:x} are in charge', a: LIVING }, 'a village where every house is shaped like {x}'] },
    { form: 'let', pos: 'n.', gloss: ['a teeny-tiny {0:x}', { t: 'a baby {0:x} that fits in your hand', a: LIVING },
      'a {0:x} as small as a ladybird'] },
    { form: 'ish', pos: 'adj.', gloss: ['a little bit like {x}', { t: 'as happy as {x} in the sunshine', a: LIVING },
      { t: 'as wobbly as {x}', a: ['food'] }] },
    { form: 'nado', pos: 'n.', gloss: ['a whirlwind of {s:x} that spins round the playground',
      { t: 'a storm where it rains {s:x}', a: ['food', 'thing'] }, { t: 'a twirly dance that makes you dizzy, invented by {s:x}', a: LIVING }] },
    { form: 'kins', pos: 'n.', gloss: [{ t: 'a cuddly nickname for {x}', a: ['animal', 'character', 'thing', 'food'] }, 'the cutest {0:x} in the whole world'] },
    { form: 'pop', pos: 'n.', gloss: [{ t: 'a lollipop that tastes of {0:x}', a: ['food', 'weather'] }, 'a lollipop shaped like {x}'] },
    { form: 'ology', pos: 'n.', gloss: ['the very important science of {s:x}', 'a school subject all about {s:x}'] },
  ],
  prefixes: [
    { form: 'mega', gloss: ['{x}, but as big as a house', 'the biggest {0:x} in the whole world'] },
    { form: 'mini', gloss: ['a {0:x} as small as a button', { t: 'a {0:x} that fits in your lunchbox', a: ['food', 'thing', 'animal'] }] },
    { form: 'super', gloss: ['{x} with superpowers', '{x} that can fly'] },
    { form: 'ultra', gloss: ['the fastest {0:x} ever', '{x} that is extra, extra, EXTRA'] },
    { form: 'un', gloss: ['{x} that goes backwards', 'the exact opposite of {x}'] },
    { form: 'sky', gloss: ['{x} that lives up in the clouds', 'a {0:x} that floats like a balloon'] },
    { form: 'sparkle', gloss: ['{x} covered in glitter', 'a {0:x} that glows in the dark'] },
  ],
  mixes: [
    'what you get when {a} meets {b}', '{b} that thinks it is {a}', 'the day {b} and {a} became best friends',
    { t: '{b} that only eats {s:a}', a: ['food'], b: LIVING },
    { t: '{b} that turns everything into {s:a}', a: ['food', 'thing', 'weather'], b: LIVING },
    { t: '{b} where everyone dresses up as {s:a}', a: LIVING, b: ['event'] },
    { t: '{b} whose best friend is {a}', a: LIVING, b: ['animal', 'character', 'thing'] },
    { t: '{b} that only appears after {a}', a: ['weather'] },
    { t: '{b} that tastes like {0:a}', a: ['food', 'weather'], b: ['food'] },
    { t: '{b} that sings whenever {a} is near', a: ['animal', 'weather'] },
    { t: '{b} hiding inside {a}', a: ['thing', 'food'], b: LIVING },
    { t: '{b} that {a} brought back from holiday', a: LIVING, b: ['thing', 'food'] },
    { t: '{b} that makes {s:a} giggle', a: LIVING, b: ['event', 'food', 'thing'] },
    { t: '{b} that happens every time {a} sneezes', a: LIVING, b: ['weather', 'event'] },
    { t: '{b} that grows on {s:a}', a: ['weather', 'thing'], b: ['food'] },
    { t: '{b} that is scared of {s:a}', a: ['animal', 'food', 'thing'], b: LIVING },
    { t: '{b} you can only find during {a}', a: ['event'], b: ['animal', 'character', 'food'] },
    { t: '{b} that leaves {s:a} wherever it goes', a: ['food', 'weather', 'thing'], b: LIVING },
    { t: '{b} with the bounce of {a}', a: ['animal'], b: ['thing', 'food'] },
  ],
  join: joinEn,
  joinPrefix: (pre, word) => pre + word,
  mixPos: () => 'n.',
};
Object.assign(EXAMPLES, {
  'ch:saurus': ['{When}, {who} found a {w} {where}.', 'The {w} is the most popular dinosaur at the museum.',
    'If you see a {w}, wave hello. It is very friendly.', '{Who} drew a {w} and stuck it on the fridge.'],
  'ch:icorn': ['{Who} wished for a {w} and woke up with one in the garden.', 'Only very kind children ever see a {w}.',
    '{When}, a {w} trotted past {where}.', 'The {w} winked at {who} and galloped away.'],
  'ch:bot': ['{Who} built a {w} out of cardboard boxes.', 'The {w} beeped twice and did a little dance.',
    '{When}, the {w} ran out of batteries {where}.', 'Everyone wants a {w} for their birthday.'],
  'ch:tastic': ['The party {where} was totally {w}!', '{Who} said today was the most {w} day ever.',
    'That drawing is absolutely {w}.', '{When}, everything felt {w}.'],
  'ch:zilla': ['{When}, a {w} stomped through the town, looking for a cuddle.', '{Who} is not scared of the {w} at all.',
    'The {w} said sorry for knocking over the sandcastle.', 'Shh! The {w} is having a nap {where}.'],
  'ch:ville': ['{Who} wants to go on holiday to {W}.', 'In {W}, nobody ever has to tidy their room.',
    'The road to {W} starts {where}.', '{When}, {who} sent a postcard from {W}.'],
  'ch:let': ['{Who} keeps a {w} in a shoebox.', 'Look at that little {w}! Isn\'t it sweet?',
    '{When}, a {w} followed {who} home.', 'The {w} is the smallest thing {where}.'],
  'ch:ish': ['{Who} felt a bit {w} after lunch.', 'The whole class went {w} {where}.',
    'It was a very {w} sort of day.', '{When}, {who} woke up feeling {w}.'],
  'ch:nado': ['{When}, a {w} spun {where}, and everyone laughed.', 'The weather man warned of a {w} this afternoon.',
    '{Who} got caught in a {w} on the way home.', 'After the {w}, there was a lot of tidying up to do.'],
  'ch:kins': ['{Who} gave the {w} a big goodnight kiss.', 'Come here, little {w}!',
    '{When}, the {w} curled up {where} and fell asleep.', 'Everybody loves {w}.'],
  'ch:pop': ['{Who} bought a {w} {where}.', 'You can only get a {w} on very special days.',
    '{When}, {who} shared a {w} with the whole class.', 'The {w} turned {who}\'s tongue bright blue.'],
  'ch:ology': ['{Who} wants to study {w} when they grow up.', 'Today\'s {w} lesson was the best one yet.',
    '{Who} is the class expert in {w}.', '{When}, the whole school did a {w} project.'],
  'ch:pre': ['{When}, a {w} came to visit {where}.', '{Who} swears they saw a {w} {where}.',
    'Everyone cheered when the {w} arrived.', 'Have you ever seen a {w}? {Who} has!',
    'The {w} waved goodbye and went home for tea.', '{Who} drew a picture of a {w} for Granny.',
    'The {w} is the best thing that ever happened {where}.', '{When}, {who} met a real {w}.'],
  'ch:mix': ['{Who} found a {w} {where}.', '{When}, a {w} turned up {where}, and nobody could stop smiling.',
    'The {w} is the best thing in the whole world, says {who}.', 'Nobody believes {who}, but there really is a {w} {where}.',
    'Shh! If you are very quiet, you might hear a {w}.', '{Who} wrote a story about a {w} and got a gold star.',
    'At the end of the day, the {w} always says goodnight.', '{When}, {who} made friends with a {w}.',
    'Do you know what a {w} is? Ask {who}!', 'The {w} was the star of the show {where}.'],
});

// Everything language-specific. Other languages (lang-fr.js) register a pack with the same shape.
const EN = {
  vowels: VOWELS, morphemes: MORPHEMES, prefixes: PREFIXES, roots: ROOTS, suffixes: SUFFIXES,
  pos: POS, nounPos: 'n.', pluralPos: 'n. pl.', families: FAMILIES,
  affixSuffixes: EN_SUFFIXES, affixPrefixes: EN_PREFIXES, compounds: COMPOUNDS, fallbacks: FALLBACKS,
  unknown: ['a word still waiting for its meaning', 'something nobody had bothered to name, until now',
    'a noise that sounds like a word and might become one'],
  soundsLike: 'sounds like', blend: 'blend of {a} and {b}',
  stopwords: STOPWORDS, stem, tokens: s => s.toLowerCase().match(/[a-z]+/g) || [],
  describe, example: exampleFor, everyday: EVERYDAY, children: CHILDREN,
  fill: (tpl, x, key = 'x') => (typeof x === 'string'
    ? tpl.replaceAll(`{${key}}`, x)
    : tpl.replaceAll(`{s:${key}}`, x.pl).replaceAll(`{0:${key}}`, x.np.replace(/^(a|an) /, ''))
      .replaceAll(`{${key}}`, x.np).replace(AN, '$1n ')),
  plural: w => (w.endsWith('ies') ? w.slice(0, -3) + 'y' : /[^su]s$/.test(w) ? w.slice(0, -1) : ''),
  inflected: (w, v) => (w.endsWith('s') && v.has(w.slice(0, -1)))
    || (w.endsWith('es') && v.has(w.slice(0, -2)))
    || (w.endsWith('ed') && (v.has(w.slice(0, -2)) || v.has(w.slice(0, -1))))
    || (w.endsWith('ing') && (v.has(w.slice(0, -3)) || v.has(w.slice(0, -3) + 'e')))
    || (w.endsWith('ly') && v.has(w.slice(0, -2))),
};
const LANGS = { en: EN };

/** Character n-gram model over padded words. */
class Model {
  constructor(words, order) {
    this.order = order;
    this.counts = new Map();
    const pad = START.repeat(order);
    for (const w of words) {
      const p = pad + w + END;
      for (let i = order; i < p.length; i++) {
        const ctx = p.slice(i - order, i);
        let nxt = this.counts.get(ctx);
        if (!nxt) this.counts.set(ctx, (nxt = new Map()));
        nxt.set(p[i], (nxt.get(p[i]) || 0) + 1);
      }
    }
    this.totals = new Map();
    for (const [ctx, nxt] of this.counts) {
      let t = 0;
      for (const n of nxt.values()) t += n;
      this.totals.set(ctx, t);
    }
  }

  sample(start, maxLen) {
    let word = start;
    let ctx = (START.repeat(this.order) + start).slice(-this.order);
    while (word.length <= maxLen) {
      const nxt = this.counts.get(ctx);
      if (!nxt) return null;
      let r = Math.random() * this.totals.get(ctx);
      let c;
      for (const [ch, n] of nxt) {
        c = ch;
        r -= n;
        if (r < 0) break;
      }
      if (c === END) return word;
      word += c;
      ctx = (ctx + c).slice(-this.order);
    }
    return null;
  }

  /** Average log-probability per transition (higher = more English-sounding). */
  score(word) {
    const p = START.repeat(this.order) + word + END;
    let total = 0;
    for (let i = this.order; i < p.length; i++) {
      const ctx = p.slice(i - this.order, i);
      const nxt = this.counts.get(ctx);
      const seen = (nxt && nxt.get(p[i])) || 0;
      total += Math.log((seen + 0.01) / ((this.totals.get(ctx) || 0) + 0.28));
    }
    return total / (p.length - this.order);
  }
}

class Predictionary {
  /** words: everything known ("already exists"); common: everyday words that definitions build on;
   *  train: words whose sound Invent imitates (defaults to words). */
  constructor(words, common = words, lang = 'en', train = words) {
    this.L = LANGS[lang];
    this.words = train;
    this.vocab = new Set(words);
    this.common = new Set(common);
    for (const w of this.L.avoid || []) this.common.delete(w); // never build a definition on a crude word
    this.models = new Map();
    this.recentSuffixes = [];
    this.recentMixes = [];
    this.scorer = this.model(3);
    this.index = new Map();
    for (const x of this.L.morphemes) {
      for (const k of x.keys) {
        if (!this.index.has(k)) this.index.set(k, []);
        this.index.get(k).push(x);
      }
    }
  }

  model(order) {
    if (!this.models.has(order)) this.models.set(order, new Model(this.words, order));
    return this.models.get(order);
  }

  /** Remember words found to exist elsewhere (e.g. online) so they are never offered again. */
  addKnown(words) {
    for (const w of words) this.vocab.add(w);
  }

  isKnown(w) {
    const v = this.vocab;
    if (v.has(w) || this.L.inflected(w, v)) return true;
    for (const family of this.L.families) {
      for (const end of family) {
        if (!w.endsWith(end) || w.length - end.length < 3) continue;
        const base = w.slice(0, -end.length);
        if (family.some(sibling => v.has(base + sibling))) return true;
      }
    }
    return false;
  }

  plausibility(w) {
    return Math.round(Math.max(0, Math.min(1, (this.scorer.score(w) + 3.5) / 2.5)) * 100);
  }

  /** Guess a meaning from known prefixes, roots and suffixes inside the word. */
  analyze(w) {
    let pre = longest(this.L.prefixes.filter(p => w.startsWith(p.form) && w.length - p.form.length >= 3));
    const suf = longest(this.L.suffixes.filter(s => w.endsWith(s.form) && w.length - s.form.length >= 2));
    let lo = pre ? pre.form.length : 0;
    const hi = suf ? w.length - suf.form.length : w.length;
    if (lo > hi) [pre, lo] = [null, 0];
    const roots = [];
    for (let i = lo; i < hi;) {
      const r = longest(this.L.roots.filter(r => r.form.length >= 3 && w.startsWith(r.form, i) && i + r.form.length <= hi));
      if (r) {
        roots.push(r);
        i += r.form.length;
      } else {
        i += 1;
      }
    }
    if (!roots.length && !(pre && suf)) return [[], '']; // a lone "re-" or "-ness" is a coincidence, not a meaning
    const [core, definition] = this.L.describe(pre, roots, suf);
    return [[pre, ...roots, suf].filter(Boolean), definition, core];
  }

  /** Build one new word, with its meaning and an example sentence.
   *  style: 'everyday' (ordinary words), 'classic' (one root, easy to say) or 'scientific' (stacked roots). */
  predict(style = 'everyday') {
    if (style === 'everyday' && this.L.everyday) return this.predictEveryday(this.L.everyday, 'ev');
    if (style === 'children' && this.L.children) return this.predictEveryday(this.L.children, 'ch');
    const classic = style === 'classic';
    const L = this.L;
    const candidates = [];
    for (let tries = 0; candidates.length < 8 && tries < 500; tries++) {
      const suf = classic || Math.random() < 0.85
        ? pick(L.suffixes.filter(s => !this.recentSuffixes.includes(s.form))) : null;
      const k = classic ? 1 : suf && Math.random() < 0.5 ? 1 : 2;
      const pre = k === 1 && Math.random() < (classic ? 0.25 : 0.4) ? pick(L.prefixes) : null; // a prefix on two roots garbles the meaning
      const roots = [...L.roots].sort(() => Math.random() - 0.5).slice(0, k);
      const parts = [pre, ...roots, suf].filter(Boolean);
      if (suf && roots.some(r => suf.form.startsWith(r.form.slice(0, 4)))) continue; // "graph" + "-graphy"
      const w = Predictionary.assemble(parts, L.vowels);
      if (classic && !this.easyToSay(w)) continue;
      if (!this.isKnown(w)) candidates.push({ score: this.scorer.score(w), w, pre, roots, suf, parts });
    }
    if (!candidates.length) return this.predict('scientific');
    // A random pick among the most English-sounding few, so short "-ology" words don't always win.
    const best = pick(candidates.sort((a, b) => b.score - a.score).slice(0, 3));
    const [core, definition] = L.describe(best.pre, best.roots, best.suf);
    const key = best.suf ? best.suf.form : '';
    this.recentSuffixes = [...this.recentSuffixes, key].slice(-6);
    return {
      word: best.w,
      pos: L.pos[key] || L.nounPos,
      plausibility: this.plausibility(best.w),
      definition,
      example: L.example(key, best.w, core),
      recipe: recipeOf(best.parts),
    };
  }

  /** At most 4 syllables and 2 consonant sounds in a row ("ph", "th"... count as one). */
  easyToSay(w) {
    const v = this.L.vowels;
    let syllables = 0;
    let run = 0;
    let maxRun = 0;
    let prevVowel = false;
    for (const c of w.replace(/ph|th|ch|sh|ps|rh|gh|qu|ll|rr|gu/g, 'C')) {
      const isVowel = v.has(c);
      if (isVowel && !prevVowel) syllables += 1;
      run = isVowel ? 0 : run + 1;
      maxRun = Math.max(maxRun, run);
      prevVowel = isVowel;
    }
    return syllables <= 4 && maxRun <= 2 && w.length <= 12;
  }

  /** Everyday and Children styles: an ordinary word plus an ending or a prefix, or two words blended together.
   *  E is the word set (L.everyday or L.children); tag prefixes its sentence keys ("ev:ish", "ch:saurus"). */
  predictEveryday(E, tag) {
    const L = this.L;
    const weights = { mix: 0.45, suffix: 0.35, prefix: E.prefixes ? 0.2 : 0 };
    if (this.lastKind) weights[this.lastKind] *= 0.3; // rarely the same pattern twice in a row
    let r = Math.random() * (weights.mix + weights.suffix + weights.prefix);
    const kind = Object.keys(weights).find(k => (r -= weights[k]) < 0) || 'mix';
    const fits = (word, types) => !types || types.includes(word.cat) || (types.includes('event') && word.cat === 'day');
    // A meaning is a string, or { t, a: [types] } when it only suits some words ("lasts too long" = events).
    const gloss = (g, word) => {
      const o = pick((Array.isArray(g) ? g : [g]).filter(m => typeof m === 'string' || fits(word, m.a)));
      return typeof o === 'string' ? o : o.t;
    };
    const candidates = [];
    for (let tries = 0; candidates.length < 8 && tries < 300; tries++) {
      if (kind === 'suffix') {
        const word = pick(E.words);
        const suf = pick(E.suffixes.filter(s => !this.recentSuffixes.includes(`${tag}:${s.form}`)));
        const fem = suf.fem && word.x.g === 'f';
        const form = fem ? suf.fem : suf.form;
        const w = E.join(word.w, form);
        if (w === word.w || this.isKnown(w) || !this.easyToSay(w)) continue;
        candidates.push({ w, key: `${tag}:${suf.form}`, pos: fem ? suf.posFem : suf.pos, core: word.x,
          definition: L.fill(gloss(suf.gloss, word), word.x), recipe: `${word.w} + -${form}` });
      } else if (kind === 'prefix') {
        const word = pick(E.words);
        const pre = pick(E.prefixes.filter(p => !this.recentSuffixes.includes(`${tag}:pre:${p.form}`)));
        const w = E.joinPrefix(pre.form, word.w);
        if (this.isKnown(w) || !this.easyToSay(w)) continue;
        candidates.push({ w, key: `${tag}:pre`, tag: `${tag}:pre:${pre.form}`, pos: E.mixPos(word), core: word.x,
          definition: L.fill(gloss(pre.gloss, word), word.x), recipe: `${pre.form}- + ${word.w}` });
      } else {
        const fresh = E.mixes.filter(m => !this.recentMixes.includes(m));
        const mix = pick(fresh.length ? fresh : E.mixes);
        const a = pick(E.words.filter(x => fits(x, mix.a)));
        const bs = E.words.filter(x => x !== a && fits(x, mix.b));
        if (!a || !bs.length) continue;
        const b = pick(bs);
        const options = this.blends(a.w, b.w)
          .filter(o => o.w.length >= 4 && o.w.length <= Math.max(a.w.length, b.w.length) + 3 && this.easyToSay(o.w));
        if (a.w.length + b.w.length <= 11 && !this.isKnown(a.w + b.w) && this.easyToSay(a.w + b.w)) {
          options.push({ w: a.w + b.w, recipe: `${a.w} + ${b.w}` });
        }
        if (!options.length) continue;
        const o = pick(options.slice(0, 2));
        candidates.push({ w: o.w, key: `${tag}:mix`, pos: E.mixPos(b), core: b.x, mix,
          definition: L.fill(L.fill(mix.t || mix, a.x, 'a'), b.x, 'b'), recipe: o.recipe });
      }
    }
    if (!candidates.length) return this.predict('classic');
    const best = pick(candidates.map(c => ({ ...c, score: this.scorer.score(c.w) }))
      .sort((x, y) => y.score - x.score).slice(0, 3));
    this.lastKind = kind;
    if (best.mix) this.recentMixes = [...this.recentMixes, best.mix].slice(-10);
    this.recentSuffixes = [...this.recentSuffixes, best.tag || best.key].slice(-6);
    return {
      word: best.w,
      pos: best.pos,
      plausibility: this.plausibility(best.w),
      definition: best.definition,
      example: L.example(best.key, best.w, best.core, best.pos),
      recipe: best.recipe,
    };
  }

  invent(n, minLen, maxLen, start, creativity) {
    const model = this.model(CREATIVITY[creativity] || 3);
    const found = new Set();
    for (let i = 0; i < n * 300 && found.size < n * 3; i++) {
      const w = model.sample(start, maxLen);
      if (w && w.length >= minLen && !this.isKnown(w)) found.add(w);
    }
    return [...found]
      .map(w => ({ w, s: model.score(w) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, n)
      .map(({ w }) => ({ word: w, plausibility: this.plausibility(w), ...this.explain(w) }));
  }

  /** A definition for any invented word: { definition, pos, recipe }. */
  explain(w) {
    const affixes = this.explainAffixes(w);
    if (affixes) return affixes;
    const [parts, definition, core] = this.analyze(w);
    const covered = parts.reduce((n, p) => n + p.form.length, 0) / w.length;
    if (definition && covered >= 0.6) { // "dent" in "duodently" isn't teeth
      const suf = parts.find(p => p.kind === 'suffix');
      const key = suf ? suf.form : '';
      return { definition, pos: this.L.pos[key] || this.L.nounPos, example: this.L.example(key, w, core),
        recipe: recipeOf(parts) };
    }
    const plural = this.L.plural(w);
    if (plural.length >= 4) {
      const one = this.explainAffixes(plural) || this.explainCompound(plural) || this.explainEnding(plural);
      if (one) return { ...one, pos: this.L.pluralPos, recipe: `${one.recipe} + -${w.slice(plural.length) || 's'}` };
    }
    return this.explainCompound(w) || this.explainEnding(w) || this.explainFallback(w);
  }

  /** A known ending on an unknown start: "taish" + "-ness" = the quality of being taish. */
  explainEnding(w) {
    const L = this.L;
    const endings = [...L.affixSuffixes.map(([form, pos, tpl]) => ({ form, pos, tpl, key: 'b' })),
      ...L.suffixes.map(s => ({ form: s.form, pos: L.pos[s.form] || L.nounPos, tpl: s.gloss, key: 'x' }))]
      .filter(e => e.form.length >= 2 && w.endsWith(e.form) && w.length - e.form.length >= (e.form.length >= 3 ? 3 : 4))
      .sort((a, b) => b.form.length - a.form.length);
    if (!endings.length) return null;
    const e = endings[0];
    let start = w.slice(0, -e.form.length).replace(/[oi]$/, ''); // "syco-phobia": the linking vowel isn't part of it
    let trimmed = '';
    for (let i = start.length - 1; i >= Math.max(L.minBase || 3, Math.ceil(start.length / 2)); i--) {
      if (this.common.has(start.slice(0, i))) { // "poorat" + "-ed" reads better as "poor"
        [start, trimmed] = [start.slice(0, i), '…'];
        break;
      }
    }
    return { definition: L.fill(e.tpl, start, e.key), pos: e.pos, recipe: `${start}${trimmed} + -${e.form}` };
  }

  /** Real word + endings, optionally after a prefix: "poor" + "ialism". */
  explainAffixes(w) {
    for (const [pf, tpl] of [['', '{r}'], ...this.L.affixPrefixes]) {
      if (!w.startsWith(pf)) continue;
      const rest = w.slice(pf.length);
      const inner = (pf && rest.length >= (this.L.minBase || 3) && this.common.has(rest))
        ? { definition: rest, pos: '', recipe: rest }
        : this.baseAndSuffix(rest);
      if (inner) {
        return pf
          ? { ...inner, definition: tpl.replace('{r}', inner.definition), recipe: `${pf}- + ${inner.recipe}` }
          : inner;
      }
    }
    return null;
  }

  baseAndSuffix(rest) {
    for (const [sf, pos, tpl] of this.L.affixSuffixes) {
      if (!rest.endsWith(sf)) continue;
      const stem = rest.slice(0, -sf.length);
      const bases = [stem, stem + 'e', stem.endsWith('i') && stem.slice(0, -1) + 'y',
        stem.length > 3 && stem.at(-1) === stem.at(-2) && stem.slice(0, -1)]; // happi->happy, sadd->sad
      const base = bases.find(b => b && b.length >= (this.L.minBase || 3) && this.common.has(b));
      if (base) return { definition: this.L.fill(tpl, base, 'b'), pos, recipe: `${base} + -${sf}` };
    }
    return null;
  }

  /** Two real words glued together: "poor" + "bitter". */
  explainCompound(w) {
    let best = null;
    for (let i = 4; i <= w.length - 4; i++) {
      const [a, b] = [w.slice(0, i), w.slice(i)];
      if (this.common.has(a) && this.common.has(b) && (!best || Math.min(i, w.length - i) > best.min)) {
        best = { a, b, min: Math.min(i, w.length - i) };
      }
    }
    if (!best) return null;
    const L = this.L;
    return { definition: L.fill(L.fill(pick(L.compounds), best.a, 'a'), best.b, 'b'), pos: L.nounPos,
      recipe: `${best.a} + ${best.b}` };
  }

  /** No clean split: lean on the longest real word the invented one starts with (or contains). */
  explainFallback(w) {
    const min = this.L.minBase || 3;
    const startsWith = set => {
      for (let i = w.length - 1; i >= min; i--) if (set.has(w.slice(0, i))) return w.slice(0, i);
      return '';
    };
    const contains = set => {
      for (let len = w.length - 1; len >= min; len--) {
        for (let i = 1; i + len <= w.length; i++) if (set.has(w.slice(i, i + len))) return w.slice(i, i + len);
      }
      return '';
    };
    const near = startsWith(this.common) || contains(this.common) || startsWith(this.vocab);
    if (!near) return { definition: pick(this.L.unknown), pos: this.L.nounPos, recipe: '' };
    return { definition: this.L.fill(pick(this.L.fallbacks), near, 'b'), pos: this.L.nounPos,
      recipe: `${this.L.soundsLike} ${near}` };
  }

  lookup(token) {
    const stem = this.L.stem;
    for (const key of [token, stem(token)]) {
      if (this.index.has(key)) return this.index.get(key).slice(0, 3);
    }
    const s = stem(token);
    return [{ form: s, kind: 'word', gloss: s, keys: [], link: '' }];
  }

  static assemble(parts, vowels = VOWELS) {
    let w = '';
    parts.forEach((p, idx) => {
      let form = p.form;
      if (p.kind === 'root' && idx === parts.length - 1 && !vowels.has(form.at(-1)) && !vowels.has(form.at(-2))) {
        form += 'o'; // "hydr" can't end a word; "hydro" can
      }
      if (w) {
        const afterPrefix = parts[idx - 1].kind === 'prefix';
        if (vowels.has(w.at(-1)) && vowels.has(form[0]) && w.length > 2 && !afterPrefix) {
          w = w.slice(0, -1);
        } else if (!vowels.has(w.at(-1)) && !vowels.has(form[0]) && !afterPrefix) {
          w += p.link;
        }
      }
      w += form;
    });
    return w;
  }

  /** Portmanteaus of a and b, favouring seams where the two words share letters. */
  blends(a, b) {
    const out = [];
    for (let i = Math.min(3, a.length); i <= a.length; i++) {
      for (let j = 0; j <= b.length - Math.min(3, b.length); j++) {
        if ((i === a.length && j === 0) || i + b.length - j < 4) continue;
        const w = a.slice(0, i) + b.slice(j);
        if (w === a || w === b || this.isKnown(w)) continue;
        let overlap = 0;
        for (let k = 1; k <= Math.min(i, j); k++) {
          if (a.slice(i - k, i) === b.slice(j - k, j)) overlap = k;
        }
        out.push({ score: this.scorer.score(w) + 0.3 * overlap, w,
          recipe: `${a.slice(0, i)}- + -${b.slice(j)} (${this.L.fill(this.L.fill(this.L.blend, a, 'a'), b, 'b')})` });
      }
    }
    return out.sort((x, y) => y.score - x.score).slice(0, 4);
  }

  coin(concept, n) {
    const L = this.L;
    const tokens = L.tokens(concept).filter(t => !L.stopwords.has(t)).map(L.stem).slice(0, 4);
    const compounds = new Map();
    const blends = new Map();
    for (const combo of product(tokens.map(t => this.lookup(t)))) {
      const pres = combo.filter(p => p.kind === 'prefix');
      const sufs = combo.filter(p => p.kind === 'suffix');
      const mids = combo.filter(p => p.kind === 'root' || p.kind === 'word');
      if (combo.length < 2 || sufs.length > 1 || !(mids.length || sufs.length)) continue;
      for (const perm of permutations(mids)) {
        const parts = [...pres, ...perm, ...sufs];
        const w = Predictionary.assemble(parts, L.vowels);
        if (!compounds.has(w) && !this.isKnown(w)) {
          compounds.set(w, { score: this.scorer.score(w), recipe: recipeOf(parts) });
        }
      }
    }
    const words = tokens.filter(t => t.length >= 3);
    for (const a of words) {
      for (const b of words) {
        if (a === b) continue;
        for (const x of this.blends(a, b)) {
          if (!compounds.has(x.w) && !blends.has(x.w)) blends.set(x.w, x);
        }
      }
    }
    // Blends always sound more English; alternate so the classical coinages still show.
    const [c, bl] = [compounds, blends].map(d => [...d].sort((x, y) => y[1].score - x[1].score));
    const ranked = [];
    for (let i = 0; i < Math.max(c.length, bl.length); i++) ranked.push(...[c[i], bl[i]].filter(Boolean));
    return ranked.slice(0, n).map(([w, { recipe }]) => ({
      word: w, plausibility: this.plausibility(w), definition: concept.trim(), recipe,
    }));
  }
}

Predictionary.LANGS = LANGS;
if (typeof module !== 'undefined') module.exports = { Predictionary }; // for Node tests
