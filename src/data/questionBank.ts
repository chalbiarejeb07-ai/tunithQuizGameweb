/**
 * Banque de questions locale — culture tunisienne.
 *
 * Elle sert à deux choses :
 *  1. de contenu de secours quand Firestore est indisponible (mode hors ligne) ;
 *  2. de source pour `npm run seed-quiz`, qui pousse ces questions dans Firestore.
 *
 * Chaque question suit le format « Family Feud » : plusieurs suggestions sont
 * affichées, certaines valides (40/30/20/10 points) et deux leurres. Trouver une
 * bonne réponse rapporte ses points, se tromper coûte une faute.
 */

export type Localized = { fr: string; ar: string }

export type QuizAnswer = { label: Localized; points: number; correct: boolean }

export type ThemeId =
  | 'patrimoine'
  | 'cuisine'
  | 'geographie'
  | 'histoire'
  | 'sport'
  | 'musique'
  | 'traditions'
  | 'nature'

export type QuizQuestion = { id: string; themeId: ThemeId; prompt: Localized; answers: QuizAnswer[] }

export const themes: { id: ThemeId; label: Localized }[] = [
  { id: 'patrimoine', label: { fr: 'Patrimoine', ar: 'التراث' } },
  { id: 'cuisine', label: { fr: 'Cuisine', ar: 'المطبخ' } },
  { id: 'geographie', label: { fr: 'Géographie', ar: 'الجغرافيا' } },
  { id: 'histoire', label: { fr: 'Histoire', ar: 'التاريخ' } },
  { id: 'sport', label: { fr: 'Sport', ar: 'الرياضة' } },
  { id: 'musique', label: { fr: 'Musique & Arts', ar: 'الموسيقى والفنون' } },
  { id: 'traditions', label: { fr: 'Traditions', ar: 'التقاليد' } },
  { id: 'nature', label: { fr: 'Nature', ar: 'الطبيعة' } },
]

export const themeIds = themes.map((theme) => theme.id)

export function themeLabel(themeId: string, language: 'fr' | 'ar'): string {
  return themes.find((theme) => theme.id === themeId)?.label[language] ?? themeId
}

/** Bonne réponse : `ok(français, arabe, points)`. */
const ok = (fr: string, ar: string, points: number): QuizAnswer => ({ label: { fr, ar }, points, correct: true })
/** Leurre : `no(français, arabe)` — 0 point et une faute pour l'équipe. */
const no = (fr: string, ar: string): QuizAnswer => ({ label: { fr, ar }, points: 0, correct: false })

export const questionBank: QuizQuestion[] = [
  // ─── Patrimoine ────────────────────────────────────────────────────────────
  {
    id: 'patrimoine-medina',
    themeId: 'patrimoine',
    prompt: { fr: 'Que trouve-t-on dans la médina de Tunis ?', ar: 'ماذا نجد في مدينة تونس العتيقة؟' },
    answers: [
      ok('La mosquée Zitouna', 'جامع الزيتونة', 40),
      ok('Le souk El Attarine', 'سوق العطارين', 30),
      ok('Dar Ben Abdallah', 'دار بن عبد الله', 20),
      ok('Bab Bhar (Porte de France)', 'باب بحر', 10),
      no('L’amphithéâtre d’El Jem', 'مدرج الجم'),
      no('Le temple des Eaux de Zaghouan', 'معبد المياه بزغوان'),
    ],
  },
  {
    id: 'patrimoine-unesco',
    themeId: 'patrimoine',
    prompt: { fr: 'Quels sites tunisiens sont inscrits au patrimoine mondial de l’UNESCO ?', ar: 'ما هي المواقع التونسية المسجلة في التراث العالمي لليونسكو؟' },
    answers: [
      ok('Le site de Carthage', 'موقع قرطاج', 40),
      ok('L’amphithéâtre d’El Jem', 'مدرج الجم', 30),
      ok('La médina de Tunis', 'مدينة تونس العتيقة', 20),
      ok('Le site de Dougga', 'موقع دقة', 10),
      no('Sidi Bou Saïd', 'سيدي بوسعيد'),
      no('Le lac de Tunis', 'بحيرة تونس'),
    ],
  },
  {
    id: 'patrimoine-kairouan',
    themeId: 'patrimoine',
    prompt: { fr: 'Que trouve-t-on à Kairouan ?', ar: 'ماذا نجد في مدينة القيروان؟' },
    answers: [
      ok('La Grande Mosquée Okba Ibn Nafaa', 'جامع عقبة بن نافع', 40),
      ok('Les bassins des Aghlabides', 'أحواض الأغالبة', 30),
      ok('La zaouïa Sidi Sahbi', 'زاوية سيدي الصحبي', 20),
      ok('Le makroudh', 'المقروض', 10),
      no('Le port punique circulaire', 'الميناء البوني الدائري'),
      no('La cathédrale Saint-Louis', 'كاتدرائية سان لويس'),
    ],
  },
  {
    id: 'patrimoine-sidibou',
    themeId: 'patrimoine',
    prompt: { fr: 'Qu’est-ce qui caractérise le village de Sidi Bou Saïd ?', ar: 'ما الذي يميز قرية سيدي بوسعيد؟' },
    answers: [
      ok('Ses portes bleues', 'أبوابها الزرقاء', 40),
      ok('Ses murs blancs', 'جدرانها البيضاء', 30),
      ok('Le Café des Nattes', 'مقهى العلية', 20),
      ok('Sa vue sur le golfe de Tunis', 'إطلالتها على خليج تونس', 10),
      no('Ses dunes de sable', 'كثبانها الرملية'),
      no('Son amphithéâtre romain', 'مدرجها الروماني'),
    ],
  },
  {
    id: 'patrimoine-romain',
    themeId: 'patrimoine',
    prompt: { fr: 'Quels vestiges romains peut-on visiter en Tunisie ?', ar: 'ما هي الآثار الرومانية التي يمكن زيارتها في تونس؟' },
    answers: [
      ok('L’amphithéâtre d’El Jem', 'مدرج الجم', 40),
      ok('Le site de Dougga', 'موقع دقة', 30),
      ok('Bulla Regia', 'بولا ريجيا', 20),
      ok('Les thermes d’Antonin à Carthage', 'حمامات أنطونيوس بقرطاج', 10),
      no('Le ksar Ouled Soltane', 'قصر أولاد سلطان'),
      no('La mosquée Zitouna', 'جامع الزيتونة'),
    ],
  },

  // ─── Cuisine ───────────────────────────────────────────────────────────────
  {
    id: 'cuisine-mechouia',
    themeId: 'cuisine',
    prompt: { fr: 'Quels ingrédients retrouve-t-on dans une salade méchouia ?', ar: 'ما هي مكونات السلطة المشوية؟' },
    answers: [
      ok('Des poivrons grillés', 'الفلفل المشوي', 40),
      ok('Des tomates', 'الطماطم', 30),
      ok('De l’ail', 'الثوم', 20),
      ok('De l’huile d’olive', 'زيت الزيتون', 10),
      no('De la crème fraîche', 'الكريمة الطازجة'),
      no('Du riz', 'الأرز'),
    ],
  },
  {
    id: 'cuisine-brik',
    themeId: 'cuisine',
    prompt: { fr: 'Que met-on traditionnellement dans une brik à l’œuf ?', ar: 'ماذا نضع عادة في البريك بالبيض؟' },
    answers: [
      ok('Une feuille de malsouka', 'ورقة مالسوقة', 40),
      ok('Un œuf', 'بيضة', 30),
      ok('Du thon', 'التن', 20),
      ok('Du persil', 'المعدنوس', 10),
      no('Du chocolat', 'الشوكولاطة'),
      no('De la semoule', 'السميد'),
    ],
  },
  {
    id: 'cuisine-lablabi',
    themeId: 'cuisine',
    prompt: { fr: 'De quoi se compose un lablabi ?', ar: 'مم تتكون اللبلابي؟' },
    answers: [
      ok('Des pois chiches', 'الحمص', 40),
      ok('Du pain rassis', 'الخبز اليابس', 30),
      ok('De la harissa', 'الهريسة', 20),
      ok('Du cumin', 'الكمون', 10),
      no('Du poisson grillé', 'السمك المشوي'),
      no('Du lait de coco', 'حليب جوز الهند'),
    ],
  },
  {
    id: 'cuisine-patisserie',
    themeId: 'cuisine',
    prompt: { fr: 'Quelles sont des pâtisseries tunisiennes traditionnelles ?', ar: 'ما هي الحلويات التونسية التقليدية؟' },
    answers: [
      ok('Le makroudh', 'المقروض', 40),
      ok('La zlabia', 'الزلابية', 30),
      ok('Le kaak warka', 'كعك الورقة', 20),
      ok('La baklawa', 'البقلاوة', 10),
      no('Le tiramisu', 'التيراميسو'),
      no('La crêpe Suzette', 'كريب سوزيت'),
    ],
  },
  {
    id: 'cuisine-semoule',
    themeId: 'cuisine',
    prompt: { fr: 'Quels plats tunisiens sont à base de semoule ?', ar: 'ما هي الأطباق التونسية المعتمدة على السميد؟' },
    answers: [
      ok('Le couscous', 'الكسكسي', 40),
      ok('Le masfouf', 'المسفوف', 30),
      ok('La mhamsa', 'المحمصة', 20),
      ok('La rfissa', 'الرفيسة', 10),
      no('Le lablabi', 'اللبلابي'),
      no('L’ojja', 'العجة'),
    ],
  },

  // ─── Géographie ────────────────────────────────────────────────────────────
  {
    id: 'geographie-iles',
    themeId: 'geographie',
    prompt: { fr: 'Quelles sont les principales îles tunisiennes ?', ar: 'ما هي أهم الجزر التونسية؟' },
    answers: [
      ok('Djerba', 'جربة', 40),
      ok('Les Kerkennah', 'قرقنة', 30),
      ok('Zembra', 'زمبرة', 20),
      ok('La Galite', 'جالطة', 10),
      no('Malte', 'مالطا'),
      no('Pantelleria', 'بانتيليريا'),
    ],
  },
  {
    id: 'geographie-cotes',
    themeId: 'geographie',
    prompt: { fr: 'Quelles villes se trouvent sur la côte tunisienne ?', ar: 'ما هي المدن الواقعة على الساحل التونسي؟' },
    answers: [
      ok('Sousse', 'سوسة', 40),
      ok('Sfax', 'صفاقس', 30),
      ok('Bizerte', 'بنزرت', 20),
      ok('Monastir', 'المنستير', 10),
      no('Kasserine', 'القصرين'),
      no('Le Kef', 'الكاف'),
    ],
  },
  {
    id: 'geographie-sud',
    themeId: 'geographie',
    prompt: { fr: 'Quelles oasis et destinations du sud tunisien connaissez-vous ?', ar: 'ما هي واحات ووجهات الجنوب التونسي؟' },
    answers: [
      ok('Tozeur', 'توزر', 40),
      ok('Douz', 'دوز', 30),
      ok('Nefta', 'نفطة', 20),
      ok('Ksar Ghilane', 'قصر غيلان', 10),
      no('Tabarka', 'طبرقة'),
      no('Bizerte', 'بنزرت'),
    ],
  },
  {
    id: 'geographie-chott',
    themeId: 'geographie',
    prompt: { fr: 'Que sait-on du Chott el Jérid ?', ar: 'ماذا نعرف عن شط الجريد؟' },
    answers: [
      ok('C’est un lac salé', 'هو بحيرة مالحة', 40),
      ok('Il se situe dans le sud-ouest', 'يقع في الجنوب الغربي', 30),
      ok('Il est souvent asséché', 'غالبا ما يكون جافا', 20),
      ok('On y observe des mirages', 'تُشاهد فيه السرابات', 10),
      no('C’est une station de ski', 'هو محطة تزلج'),
      no('Il se jette dans l’Atlantique', 'يصب في المحيط الأطلسي'),
    ],
  },
  {
    id: 'geographie-extremes',
    themeId: 'geographie',
    prompt: { fr: 'Quels sont les points extrêmes de la Tunisie ?', ar: 'ما هي النقاط القصوى في تونس؟' },
    answers: [
      ok('Le Cap Angela, point le plus au nord de l’Afrique', 'رأس أنجلة، أقصى شمال إفريقيا', 40),
      ok('Le Djebel Chambi, plus haut sommet', 'جبل الشعانبي، أعلى قمة', 30),
      ok('Le Chott el Jérid, point le plus bas', 'شط الجريد، أخفض نقطة', 20),
      ok('Ras Ajdir, frontière avec la Libye', 'رأس جدير، الحدود مع ليبيا', 10),
      no('Le mont Toubkal', 'جبل توبقال'),
      no('Le détroit de Gibraltar', 'مضيق جبل طارق'),
    ],
  },

  // ─── Histoire ──────────────────────────────────────────────────────────────
  {
    id: 'histoire-carthage',
    themeId: 'histoire',
    prompt: { fr: 'Qu’associe-t-on à la Carthage antique ?', ar: 'بماذا ترتبط قرطاج القديمة؟' },
    answers: [
      ok('Hannibal Barca', 'حنبعل برقا', 40),
      ok('La reine Didon (Elyssa)', 'الملكة عليسة', 30),
      ok('Les guerres puniques', 'الحروب البونية', 20),
      ok('Le port punique circulaire', 'الميناء البوني الدائري', 10),
      no('Les pyramides de Gizeh', 'أهرامات الجيزة'),
      no('Toutânkhamon', 'توت عنخ آمون'),
    ],
  },
  {
    id: 'histoire-independance',
    themeId: 'histoire',
    prompt: { fr: 'Que sait-on de l’indépendance de la Tunisie ?', ar: 'ماذا نعرف عن استقلال تونس؟' },
    answers: [
      ok('Elle est proclamée en 1956', 'أُعلن سنة 1956', 40),
      ok('Elle est obtenue de la France', 'تم الحصول عليه من فرنسا', 30),
      ok('Habib Bourguiba en fut la figure', 'الحبيب بورقيبة كان رمزه', 20),
      ok('La République est proclamée en 1957', 'أُعلنت الجمهورية سنة 1957', 10),
      no('Elle est obtenue de l’Italie', 'تم الحصول عليه من إيطاليا'),
      no('Elle est proclamée en 1912', 'أُعلن سنة 1912'),
    ],
  },
  {
    id: 'histoire-dynasties',
    themeId: 'histoire',
    prompt: { fr: 'Quelles dynasties ont régné sur la Tunisie ?', ar: 'ما هي الدول التي حكمت تونس؟' },
    answers: [
      ok('Les Aghlabides', 'الأغالبة', 40),
      ok('Les Hafsides', 'الحفصيون', 30),
      ok('Les Fatimides', 'الفاطميون', 20),
      ok('Les Husseinites', 'الحسينيون', 10),
      no('Les Mérinides', 'المرينيون'),
      no('Les Nasrides', 'النصريون'),
    ],
  },
  {
    id: 'histoire-figures',
    themeId: 'histoire',
    prompt: { fr: 'Quelles figures ont marqué l’histoire de la Tunisie ?', ar: 'ما هي الشخصيات التي طبعت تاريخ تونس؟' },
    answers: [
      ok('Hannibal', 'حنبعل', 40),
      ok('Ibn Khaldoun', 'ابن خلدون', 30),
      ok('La Kahina', 'الكاهنة', 20),
      ok('Okba Ibn Nafaa', 'عقبة بن نافع', 10),
      no('Napoléon Bonaparte', 'نابليون بونابرت'),
      no('Christophe Colomb', 'كريستوفر كولومبوس'),
    ],
  },
  {
    id: 'histoire-ibnkhaldoun',
    themeId: 'histoire',
    prompt: { fr: 'Que sait-on d’Ibn Khaldoun ?', ar: 'ماذا نعرف عن ابن خلدون؟' },
    answers: [
      ok('Il est né à Tunis en 1332', 'وُلد بتونس سنة 1332', 40),
      ok('Il a écrit la Muqaddima', 'ألّف المقدمة', 30),
      ok('Il est un pionnier de la sociologie', 'رائد علم الاجتماع', 20),
      ok('Sa statue est avenue Habib Bourguiba', 'تمثاله بشارع الحبيب بورقيبة', 10),
      no('Il a inventé le téléphone', 'اخترع الهاتف'),
      no('C’était un navigateur portugais', 'كان بحارا برتغاليا'),
    ],
  },

  // ─── Sport ─────────────────────────────────────────────────────────────────
  {
    id: 'sport-clubs',
    themeId: 'sport',
    prompt: { fr: 'Quels sont les grands clubs de football tunisiens ?', ar: 'ما هي أكبر أندية كرة القدم التونسية؟' },
    answers: [
      ok('L’Espérance Sportive de Tunis', 'الترجي الرياضي التونسي', 40),
      ok('Le Club Africain', 'النادي الإفريقي', 30),
      ok('L’Étoile du Sahel', 'النجم الساحلي', 20),
      ok('Le CS Sfaxien', 'النادي الرياضي الصفاقسي', 10),
      no('Le Raja Casablanca', 'الرجاء البيضاوي'),
      no('Al Ahly', 'الأهلي'),
    ],
  },
  {
    id: 'sport-champions',
    themeId: 'sport',
    prompt: { fr: 'Quels champions tunisiens se sont illustrés à l’international ?', ar: 'ما هم الأبطال التونسيون الذين تألقوا دوليا؟' },
    answers: [
      ok('Ons Jabeur, tennis', 'أنس جابر، التنس', 40),
      ok('Oussama Mellouli, natation', 'أسامة الملولي، السباحة', 30),
      ok('Habiba Ghribi, athlétisme', 'حبيبة الغريبي، ألعاب القوى', 20),
      ok('Mohamed Gammoudi, athlétisme', 'محمد القمودي، ألعاب القوى', 10),
      no('Zinédine Zidane', 'زين الدين زيدان'),
      no('Mohamed Salah', 'محمد صلاح'),
    ],
  },
  {
    id: 'sport-can2004',
    themeId: 'sport',
    prompt: { fr: 'Que sait-on de la CAN 2004 ?', ar: 'ماذا نعرف عن كأس أمم إفريقيا 2004؟' },
    answers: [
      ok('Elle a été organisée en Tunisie', 'نُظمت في تونس', 40),
      ok('Elle a été remportée par la Tunisie', 'فازت بها تونس', 30),
      ok('La finale opposait la Tunisie au Maroc', 'النهائي جمع تونس بالمغرب', 20),
      ok('La finale s’est jouée au stade de Radès', 'أُقيم النهائي بملعب رادس', 10),
      no('Elle a été remportée par l’Égypte', 'فازت بها مصر'),
      no('Elle a été organisée au Qatar', 'نُظمت في قطر'),
    ],
  },
  {
    id: 'sport-onsjabeur',
    themeId: 'sport',
    prompt: { fr: 'Que sait-on d’Ons Jabeur ?', ar: 'ماذا نعرف عن أنس جابر؟' },
    answers: [
      ok('Elle est née à Ksar Hellal', 'وُلدت بقصر هلال', 40),
      ok('Elle a été finaliste de Wimbledon', 'بلغت نهائي ويمبلدون', 30),
      ok('On la surnomme « la ministre du bonheur »', 'تُلقّب بوزيرة السعادة', 20),
      ok('Première Arabe du top 10 mondial', 'أول عربية في العشرة الأوائل عالميا', 10),
      no('Elle est championne olympique de judo', 'بطلة أولمبية في الجودو'),
      no('Elle joue au handball', 'تلعب كرة اليد'),
    ],
  },
  {
    id: 'sport-populaires',
    themeId: 'sport',
    prompt: { fr: 'Quels sports sont les plus pratiqués en Tunisie ?', ar: 'ما هي الرياضات الأكثر ممارسة في تونس؟' },
    answers: [
      ok('Le football', 'كرة القدم', 40),
      ok('Le handball', 'كرة اليد', 30),
      ok('Le volley-ball', 'الكرة الطائرة', 20),
      ok('La natation', 'السباحة', 10),
      no('Le hockey sur glace', 'الهوكي على الجليد'),
      no('Le ski alpin', 'التزلج الألبي'),
    ],
  },

  // ─── Musique & Arts ────────────────────────────────────────────────────────
  {
    id: 'musique-instruments',
    themeId: 'musique',
    prompt: { fr: 'Quels instruments sont utilisés dans la musique tunisienne ?', ar: 'ما هي الآلات المستعملة في الموسيقى التونسية؟' },
    answers: [
      ok('Le oud', 'العود', 40),
      ok('Le mezoued', 'المزود', 30),
      ok('La darbouka', 'الدربوكة', 20),
      ok('La zokra', 'الزكرة', 10),
      no('La cornemuse écossaise', 'مزمار القربة الاسكتلندي'),
      no('Le banjo', 'البانجو'),
    ],
  },
  {
    id: 'musique-festivals',
    themeId: 'musique',
    prompt: { fr: 'Quels grands festivals se tiennent en Tunisie ?', ar: 'ما هي أهم المهرجانات التي تُقام في تونس؟' },
    answers: [
      ok('Le Festival international de Carthage', 'مهرجان قرطاج الدولي', 40),
      ok('Le Festival international de Hammamet', 'مهرجان الحمامات الدولي', 30),
      ok('Le Festival du Sahara à Douz', 'مهرجان الصحراء بدوز', 20),
      ok('Jazz à Tabarka', 'مهرجان الجاز بطبرقة', 10),
      no('Le Festival de Cannes', 'مهرجان كان'),
      no('L’Oktoberfest', 'مهرجان أكتوبر'),
    ],
  },
  {
    id: 'musique-artistes',
    themeId: 'musique',
    prompt: { fr: 'Quels artistes tunisiens sont célèbres ?', ar: 'ما هم الفنانون التونسيون المشهورون؟' },
    answers: [
      ok('Saliha', 'صليحة', 40),
      ok('Hédi Jouini', 'الهادي الجويني', 30),
      ok('Latifa Arfaoui', 'لطيفة العرفاوي', 20),
      ok('Dhafer Youssef', 'ظافر يوسف', 10),
      no('Oum Kalthoum', 'أم كلثوم'),
      no('Fairuz', 'فيروز'),
    ],
  },
  {
    id: 'musique-malouf',
    themeId: 'musique',
    prompt: { fr: 'Que sait-on du malouf ?', ar: 'ماذا نعرف عن المالوف؟' },
    answers: [
      ok('C’est une musique arabo-andalouse', 'هو موسيقى عربية أندلسية', 40),
      ok('Il a été apporté par les Andalous', 'جلبه الأندلسيون', 30),
      ok('Il est porté par l’institut La Rachidia', 'تحمله مؤسسة الرشيدية', 20),
      ok('Il fait partie du patrimoine national', 'يُعد جزءا من التراث الوطني', 10),
      no('Il est né au Japon', 'نشأ في اليابان'),
      no('C’est un style de rap américain', 'هو نمط راب أمريكي'),
    ],
  },
  {
    id: 'musique-cinema',
    themeId: 'musique',
    prompt: { fr: 'Que sait-on du cinéma tunisien ?', ar: 'ماذا نعرف عن السينما التونسية؟' },
    answers: [
      ok('Les Journées Cinématographiques de Carthage', 'أيام قرطاج السينمائية', 40),
      ok('« Un été à La Goulette » de Férid Boughedir', 'صيف حلق الوادي لفريد بوغدير', 30),
      ok('« Les Silences du palais » de Moufida Tlatli', 'صمت القصور لمفيدة التلاتلي', 20),
      ok('Les studios de tournage du sud tunisien', 'استوديوهات التصوير بالجنوب التونسي', 10),
      no('Hollywood Boulevard', 'شارع هوليوود'),
      no('Les studios de Bollywood', 'استوديوهات بوليوود'),
    ],
  },

  // ─── Traditions ────────────────────────────────────────────────────────────
  {
    id: 'traditions-mariage',
    themeId: 'traditions',
    prompt: { fr: 'Quelles étapes composent un mariage traditionnel tunisien ?', ar: 'ما هي مراحل العرس التونسي التقليدي؟' },
    answers: [
      ok('La soirée du henné', 'ليلة الحناء', 40),
      ok('L’outia', 'العوتية', 30),
      ok('La jelwa', 'الجلوة', 20),
      ok('Le hammam de la mariée', 'حمام العروس', 10),
      no('Le lancer du bouquet', 'رمي باقة الورد'),
      no('Le sapin décoré', 'شجرة عيد الميلاد'),
    ],
  },
  {
    id: 'traditions-vetements',
    themeId: 'traditions',
    prompt: { fr: 'Quels vêtements traditionnels tunisiens connaissez-vous ?', ar: 'ما هي الملابس التقليدية التونسية؟' },
    answers: [
      ok('La jebba', 'الجبة', 40),
      ok('Le sefsari', 'السفساري', 30),
      ok('La chechia', 'الشاشية', 20),
      ok('La fouta', 'الفوطة', 10),
      no('Le kimono', 'الكيمونو'),
      no('Le kilt écossais', 'التنورة الاسكتلندية'),
    ],
  },
  {
    id: 'traditions-artisanat',
    themeId: 'traditions',
    prompt: { fr: 'Quels artisanats font la réputation des régions tunisiennes ?', ar: 'ما هي الحرف التي اشتهرت بها الجهات التونسية؟' },
    answers: [
      ok('La poterie de Nabeul', 'خزف نابل', 40),
      ok('Le tapis de Kairouan', 'زربية القيروان', 30),
      ok('Le cuivre ciselé de Tunis', 'النحاس المنقوش بتونس', 20),
      ok('La céramique de Sejnane', 'فخار سجنان', 10),
      no('La porcelaine de Limoges', 'خزف ليموج'),
      no('Le verre de Murano', 'زجاج مورانو'),
    ],
  },
  {
    id: 'traditions-khomsa',
    themeId: 'traditions',
    prompt: { fr: 'Que représente la khomsa (main de Fatma) ?', ar: 'ماذا تمثل الخمسة (يد فاطمة)؟' },
    answers: [
      ok('Une protection contre le mauvais œil', 'حماية من العين', 40),
      ok('Un porte-bonheur', 'جالبة للحظ', 30),
      ok('Un bijou traditionnel', 'حلية تقليدية', 20),
      ok('Un motif d’artisanat très courant', 'زخرفة حرفية شائعة', 10),
      no('Un instrument de musique', 'آلة موسيقية'),
      no('Une unité monétaire', 'وحدة نقدية'),
    ],
  },
  {
    id: 'traditions-ramadan',
    themeId: 'traditions',
    prompt: { fr: 'Quelles traditions accompagnent le Ramadan en Tunisie ?', ar: 'ما هي التقاليد المصاحبة لرمضان في تونس؟' },
    answers: [
      ok('La rupture du jeûne au coucher du soleil', 'الإفطار عند غروب الشمس', 40),
      ok('La zlabia et le mkharek', 'الزلابية والمخارق', 30),
      ok('Les veillées en famille', 'السهرات العائلية', 20),
      ok('Le canon annonçant l’iftar', 'مدفع الإفطار', 10),
      no('La chasse aux œufs', 'البحث عن البيض'),
      no('Le réveillon du 31 décembre', 'سهرة رأس السنة'),
    ],
  },

  // ─── Nature ────────────────────────────────────────────────────────────────
  {
    id: 'nature-parcs',
    themeId: 'nature',
    prompt: { fr: 'Quels parcs nationaux existent en Tunisie ?', ar: 'ما هي الحدائق الوطنية الموجودة في تونس؟' },
    answers: [
      ok('Le parc de l’Ichkeul', 'حديقة إشكل', 40),
      ok('Le parc de Bouhedma', 'حديقة بوهدمة', 30),
      ok('Le parc du Djebel Chambi', 'حديقة جبل الشعانبي', 20),
      ok('Le parc de Zembra et Zembretta', 'حديقة زمبرة وزمبريتة', 10),
      no('Le Serengeti', 'سيرينغيتي'),
      no('Yellowstone', 'يلوستون'),
    ],
  },
  {
    id: 'nature-ichkeul',
    themeId: 'nature',
    prompt: { fr: 'Que sait-on du lac Ichkeul ?', ar: 'ماذا نعرف عن بحيرة إشكل؟' },
    answers: [
      ok('Il est classé au patrimoine mondial', 'مصنفة ضمن التراث العالمي', 40),
      ok('C’est une étape d’oiseaux migrateurs', 'محطة للطيور المهاجرة', 30),
      ok('Il se situe près de Bizerte', 'تقع قرب بنزرت', 20),
      ok('C’est une réserve de biosphère', 'محمية محيط حيوي', 10),
      no('Il se situe en plein Sahara', 'تقع وسط الصحراء'),
      no('C’est un glacier', 'هي نهر جليدي'),
    ],
  },
  {
    id: 'nature-arbres',
    themeId: 'nature',
    prompt: { fr: 'Quels arbres sont emblématiques de la Tunisie ?', ar: 'ما هي الأشجار الرمزية في تونس؟' },
    answers: [
      ok('L’olivier', 'شجرة الزيتون', 40),
      ok('Le palmier dattier', 'النخلة', 30),
      ok('Le figuier', 'شجرة التين', 20),
      ok('Le chêne-liège', 'شجرة الفلين', 10),
      no('Le sapin de Norvège', 'شجرة التنوب النرويجي'),
      no('Le baobab', 'شجرة الباوباب'),
    ],
  },
  {
    id: 'nature-deglet',
    themeId: 'nature',
    prompt: { fr: 'Que sait-on de la datte Deglet Nour ?', ar: 'ماذا نعرف عن تمر دقلة النور؟' },
    answers: [
      ok('Elle est cultivée à Tozeur et Kébili', 'تُزرع في توزر وقبلي', 40),
      ok('Son nom signifie « doigt de lumière »', 'اسمها يعني إصبع النور', 30),
      ok('C’est un grand produit d’exportation', 'من أهم منتجات التصدير', 20),
      ok('Elle est récoltée en automne', 'تُجنى في الخريف', 10),
      no('Elle est cultivée à Bizerte', 'تُزرع في بنزرت'),
      no('C’est un agrume', 'هي من الحمضيات'),
    ],
  },
  {
    id: 'nature-animaux',
    themeId: 'nature',
    prompt: { fr: 'Quels animaux vivent dans la nature tunisienne ?', ar: 'ما هي الحيوانات التي تعيش في الطبيعة التونسية؟' },
    answers: [
      ok('Le fennec', 'الفنك', 40),
      ok('La gazelle dorcas', 'غزال الدركاس', 30),
      ok('Le flamant rose', 'النحام الوردي', 20),
      ok('Le sanglier', 'الخنزير البري', 10),
      no('Le kangourou', 'الكنغر'),
      no('Le pingouin', 'البطريق'),
    ],
  },
]

export const questionsByTheme = (themeId: ThemeId) => questionBank.filter((question) => question.themeId === themeId)
