const { createStrapi, compileStrapi } = require('@strapi/strapi');

const DEMO_PASSWORD = 'Demo1234!';

const USERS = [
  { username: 'vincent_etf', email: 'vincent.etf@example.com' },
  { username: 'papyboursier', email: 'papyboursier@example.com' },
  { username: 'odile_retraite', email: 'odile.retraite@example.com' },
  { username: 'sophie_invest', email: 'sophie.invest@example.com' },
  { username: 'karim_immo', email: 'karim.immo@example.com' },
];

const CATEGORIES = [
  {
    slug: 'bourse',
    name: 'Bourse & actions',
    description: "Actions, ETF, PEA, compte-titres : stratégies et retours d'expérience.",
  },
  {
    slug: 'epargne',
    name: 'Épargne & placements',
    description: 'Livrets, fonds euros, obligations, comptes à terme.',
  },
  {
    slug: 'assurance-vie',
    name: 'Assurance-vie',
    description: 'Choisir son contrat, arbitrer, transmettre.',
  },
  {
    slug: 'immobilier',
    name: 'Immobilier & SCPI',
    description: 'Résidence principale, locatif, SCPI, crédit immobilier.',
  },
  {
    slug: 'impots',
    name: 'Impôts & fiscalité',
    description: 'Déclaration, niches fiscales, IFI : payer le juste impôt.',
  },
  {
    slug: 'retraite',
    name: 'Retraite',
    description: 'PER, rachat de trimestres, cumul emploi-retraite.',
  },
  {
    slug: 'cafe',
    name: 'Le Café du Revenu',
    description: 'Présentations, discussions libres, idées pour la rédaction.',
  },
];

const DISCUSSIONS = [
  {
    category: 'cafe',
    type: 'discussion',
    author: 'sophie_invest',
    title: 'Bienvenue dans la Communauté du Revenu ! Présentez-vous ici',
    content:
      "Bonjour à toutes et à tous,\n\nCet espace est le vôtre : posez vos questions, partagez vos expériences, aidez les autres membres.\n\nPour bien démarrer, présentez-vous en une phrase en réponse à ce message et choisissez les espaces qui vous intéressent. Bienvenue !",
    replies: [
      {
        author: 'papyboursier',
        content:
          "Bienvenue aux jeunes ! N'hésitez pas à poser des questions, même basiques. On est tous passés par là.",
      },
      {
        author: 'vincent_etf',
        content: 'Bonjour à tous, Vincent, investisseur passif depuis 2015, ravi de rejoindre cet espace.',
      },
      {
        author: 'odile_retraite',
        content: 'Bonjour, Odile, jeune retraitée. Je gère mon patrimoine en famille, contente d\'échanger ici.',
      },
    ],
  },
  {
    category: 'cafe',
    type: 'discussion',
    author: 'karim_immo',
    title: "Quel est le meilleur conseil d'argent que vous ayez reçu ?",
    content:
      "La rédaction pose une question à la communauté cette semaine : quel conseil d'argent a changé votre vie, et qui vous l'a donné ?",
    replies: [
      {
        author: 'papyboursier',
        content:
          "Mon père : « N'investis jamais l'argent dont tu auras besoin dans les cinq ans. » Ça m'a évité bien des ventes en catastrophe.",
      },
      {
        author: 'vincent_etf',
        content:
          "« Le temps passé sur le marché compte plus que le moment où on y entre. » Investir tous les mois, sans se poser de questions.",
      },
      {
        author: 'sophie_invest',
        content:
          "Faire le tour de ses contrats une fois par an. J'économise plusieurs centaines d'euros par an grâce à ça.",
      },
    ],
  },
  {
    category: 'bourse',
    type: 'question',
    author: 'sophie_invest',
    title: 'Ouvrir un PEA avec 5 000 € : par où commencer ?',
    content:
      "Bonjour, je viens d'ouvrir un PEA en ligne et j'ai 5 000 € à y placer. Je ne connais pas grand-chose aux actions.\n\nVaut-il mieux tout investir d'un coup ou étaler ? Et sur quoi : des ETF, quelques actions ?",
    replies: [
      {
        author: 'papyboursier',
        content:
          "Première chose : vous avez bien une épargne de précaution à côté ? Le PEA, c'est de l'argent qu'on oublie au moins cinq ans.",
      },
      {
        author: 'vincent_etf',
        content:
          "Pour débuter, un ETF éligible au PEA qui réplique un indice mondial fait très bien le travail : une seule ligne, des frais faibles, une large diversification. Rappel utile : le PEA est plafonné à 150 000 € de versements, et après cinq ans les gains sont exonérés d'impôt sur le revenu (les prélèvements sociaux restent dus).",
      },
    ],
  },
  {
    category: 'epargne',
    type: 'question',
    author: 'karim_immo',
    title: "J'ai 25 ans et 10 000 € de côté : je fais quoi ?",
    content:
      "Premier CDI depuis un an, j'ai réussi à mettre 10 000 € de côté sur un livret. Pas de projet immobilier avant quatre ou cinq ans.\n\nJe me sens un peu perdu entre PEA, assurance-vie, PER… Comment auriez-vous réparti à mon âge ?",
    replies: [
      {
        author: 'odile_retraite',
        content: 'Gardez déjà trois à six mois de dépenses sur un livret. Le reste peut travailler.',
      },
      {
        author: 'vincent_etf',
        content:
          "À 25 ans, ouvrir un PEA et une assurance-vie tôt, même avec peu, c'est surtout prendre date pour la fiscalité : l'antériorité compte.",
      },
      {
        author: 'papyboursier',
        content:
          "Le PER peut attendre à mon avis : l'argent est bloqué jusqu'à la retraite (sauf achat de la résidence principale) et l'avantage fiscal est faible si votre taux d'imposition est bas.",
      },
    ],
  },
  {
    category: 'assurance-vie',
    type: 'question',
    author: 'odile_retraite',
    title: 'Assurance-vie après 70 ans : est-ce encore intéressant ?',
    content:
      "J'ai 71 ans et je me demande s'il est encore utile de verser sur une assurance-vie, notamment pour la transmission à mes petits-enfants. On m'a dit que la fiscalité était moins avantageuse après 70 ans ?",
    replies: [
      {
        author: 'sophie_invest',
        content:
          "Pour les versements après 70 ans, l'abattement est de 30 500 € au total (tous bénéficiaires confondus) et il ne porte que sur les primes versées : les gains, eux, sont exonérés de droits de succession. Sur une longue durée, ça peut peser lourd.",
      },
      {
        author: 'papyboursier',
        content:
          "Pour les primes versées avant 70 ans, l'abattement est de 152 500 € par bénéficiaire. Les deux régimes peuvent se combiner sur un même contrat.",
      },
    ],
  },
  {
    category: 'immobilier',
    type: 'discussion',
    author: 'karim_immo',
    title: 'SCPI : vous avez renforcé ces derniers mois ou vous attendez ?',
    content:
      "Après les baisses de prix de parts de certaines SCPI, je vois deux écoles autour de moi : ceux qui en profitent pour renforcer et ceux qui ne veulent plus en entendre parler.\n\nEt vous, comment avez-vous réagi ?",
    replies: [
      {
        author: 'odile_retraite',
        content: "J'attends. J'ai été échaudée par les délais de revente sur une de mes SCPI.",
      },
      {
        author: 'papyboursier',
        content:
          "J'ai renforcé, mais uniquement sur des SCPI récentes, sans immobilier de bureaux acheté au plus haut.",
      },
    ],
  },
  {
    category: 'impots',
    type: 'question',
    author: 'sophie_invest',
    title: 'Frais réels ou abattement de 10 % : comment savoir ce qui est le plus avantageux ?',
    content: 'Je fais 35 km aller-retour par jour en voiture pour aller travailler. Est-ce que je devrais passer aux frais réels ?',
    replies: [
      {
        author: 'papyboursier',
        content:
          "Faites le calcul simplement : additionnez vos frais (barème kilométrique selon la puissance de la voiture, repas, etc.) et comparez avec 10 % de votre salaire. Si vos frais dépassent, les frais réels sont gagnants. Attention : il faut garder les justificatifs.",
      },
      {
        author: 'karim_immo',
        content: 'Je viens de faire le calcul de mon côté et je gagne quelques centaines d\'euros. Ça vaut le coup.',
      },
    ],
  },
  {
    category: 'retraite',
    type: 'discussion',
    author: 'papyboursier',
    title: "PER : vos retours d'expérience après quelques années ?",
    content:
      "J'ai ouvert un PER il y a trois ans pour la déduction fiscale. Je m'interroge sur les frais et la sortie. Vos retours ?",
    replies: [
      {
        author: 'vincent_etf',
        content:
          "Le point clé pour moi : les frais. Un PER en ligne avec des ETF, c'est très différent d'un PER bancaire avec 3 % de frais d'entrée.",
      },
      {
        author: 'odile_retraite',
        content: 'Pensez aussi à la fiscalité à la sortie : ce que vous déduisez aujourd\'hui sera imposé plus tard.',
      },
    ],
  },
  {
    category: 'cafe',
    type: 'discussion',
    author: 'sophie_invest',
    title: 'Quel sujet aimeriez-vous voir traité par la rédaction ?',
    content:
      "La rédaction lit ce forum, profitons-en ! Moi j'aimerais un dossier complet sur la succession dans les familles recomposées.",
    replies: [
      {
        author: 'karim_immo',
        content: "Un comparatif des SCPI par type d'actifs, avec le recul sur les dernières années.",
      },
      {
        author: 'odile_retraite',
        content: 'Un guide pas à pas de la déclaration en location meublée !',
      },
    ],
  },
  {
    category: 'impots',
    type: 'question',
    author: 'odile_retraite',
    title: 'Location meublée : micro-BIC ou régime réel ?',
    content:
      'Je loue un studio meublé depuis deux mois. Je ne sais pas quel régime choisir pour ma première déclaration. Comment avez-vous fait votre choix ?',
    replies: [],
  },
  {
    category: 'bourse',
    type: 'question',
    author: 'karim_immo',
    title: 'Dividendes sur un compte-titres : flat tax ou barème ?',
    content:
      'Je perçois des dividendes sur un compte-titres ordinaire. Flat tax ou barème progressif : qu\'avez-vous choisi et pourquoi ?',
    replies: [],
  },
  {
    category: 'retraite',
    type: 'question',
    author: 'odile_retraite',
    title: 'Rachat de trimestres : est-ce que ça vaut vraiment le coup ?',
    content: 'Une amie a racheté des trimestres pour partir plus tôt. Le coût m\'a paru énorme. Quelqu\'un a fait le calcul ?',
    replies: [
      {
        author: 'papyboursier',
        content:
          'Ça dépend énormément de votre situation. Demandez une simulation à votre caisse de retraite : elle calcule le coût et le gain de pension. Le rachat est déductible du revenu imposable, ce qui adoucit l\'addition.',
      },
    ],
  },
  {
    category: 'assurance-vie',
    type: 'discussion',
    author: 'vincent_etf',
    title: 'Fonds euros : quelle part gardez-vous dans votre contrat ?',
    content:
      "Suite à un article sur les rendements des fonds euros, je me demande quelle part vous conservez en fonds euros et en unités de compte.",
    replies: [
      {
        author: 'odile_retraite',
        content: 'Environ 60 % en fonds euros, à mon âge je privilégie la sécurité.',
      },
      {
        author: 'sophie_invest',
        content: 'Autour de 35 % chez moi, le reste en unités de compte diversifiées. Je rééquilibre une fois par an.',
      },
    ],
  },
  {
    category: 'immobilier',
    type: 'question',
    author: 'karim_immo',
    title: 'Crédit immobilier : renégocier ou faire racheter son prêt ?',
    content:
      'Mon taux actuel est plus élevé que les offres du moment. Vaut-il mieux renégocier avec ma banque ou passer par un rachat de crédit ? Vos expériences ?',
    replies: [],
  },
];

async function findOrCreateUser(app, roleId, user) {
  const existing = await app.db.query('plugin::users-permissions.user').findOne({ where: { username: user.username } });
  if (existing) return existing;

  const created = await app.plugin('users-permissions').service('user').add({
    username: user.username,
    email: user.email,
    password: DEMO_PASSWORD,
    provider: 'local',
    confirmed: true,
    blocked: false,
    role: roleId,
  });
  console.log(`created user ${user.username}`);
  return created;
}

async function findOrCreateCategory(app, category) {
  const existing = await app.documents('api::category.category').findFirst({
    filters: { slug: category.slug },
  });
  if (existing) return existing;

  const created = await app.documents('api::category.category').create({
    data: { name: category.name, slug: category.slug, description: category.description },
  });
  console.log(`created category ${category.slug}`);
  return created;
}

async function findOrCreateDiscussion(app, discussion, userIdByUsername, categoryDocumentIdBySlug) {
  const existing = await app.documents('api::discussion.discussion').findFirst({
    filters: { title: discussion.title },
  });
  if (existing) return existing;

  const created = await app.documents('api::discussion.discussion').create({
    data: {
      title: discussion.title,
      content: discussion.content,
      type: discussion.type,
      author: userIdByUsername[discussion.author],
      authorUsername: discussion.author,
      category: categoryDocumentIdBySlug[discussion.category],
    },
  });
  console.log(`created discussion "${discussion.title}"`);
  return created;
}

async function findOrCreateReply(app, discussionDocumentId, reply, userIdByUsername) {
  const existing = await app.documents('api::reply.reply').findFirst({
    filters: { content: reply.content, discussion: { documentId: discussionDocumentId } },
  });
  if (existing) return existing;

  return app.documents('api::reply.reply').create({
    data: {
      content: reply.content,
      author: userIdByUsername[reply.author],
      authorUsername: reply.author,
      discussion: discussionDocumentId,
    },
  });
}

async function run() {
  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();
  app.log.level = 'error';

  const authenticatedRole = await app.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });

  const userIdByUsername = {};
  for (const user of USERS) {
    const created = await findOrCreateUser(app, authenticatedRole.id, user);
    userIdByUsername[user.username] = created.id;
  }

  const categoryDocumentIdBySlug = {};
  for (const category of CATEGORIES) {
    const created = await findOrCreateCategory(app, category);
    categoryDocumentIdBySlug[category.slug] = created.documentId;
  }

  for (const discussion of DISCUSSIONS) {
    const created = await findOrCreateDiscussion(app, discussion, userIdByUsername, categoryDocumentIdBySlug);
    for (const reply of discussion.replies) {
      await findOrCreateReply(app, created.documentId, reply, userIdByUsername);
    }
  }

  console.log('seed complete');
  await app.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
