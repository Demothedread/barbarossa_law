/**
 * LUNAIRE COUNTRY CLUB -> THE RENEGADE FLOTILLA
 * "Where the void is dark and the plunder is plentiful"
 *
 * A collection of themed text content for the Renegade Astronaut/Space Pirate faction.
 * The tone is arrogant, exclusionary towards "mongrel Earthlings", and steeped in
 * buccaneer lore mixed with high-tech sci-fi.
 *
 * "We left Earth because it was unworthy of us. Now we judge it from above."
 */

export const CLUB_MOTTOS = [
  "Per Aspera Ad Astra... Then We Take Their Stuff",
  "Law for the Lawless, Justice for None",
  "The Void Takes What It Wants",
  "Swashbuckling Jurisprudence Since the Great Exodus",
  "Earth is a Cage. We Are the Key.",
  "Gold, Glory, and Summary Judgments",
];

export const LOADING_MESSAGES = [
  "Scanning scanning for merchant vessels...",
  "Calibrating the plunder sensors...",
  "Loading torpedo tubes with legal precedents...",
  "Calculating trajectory for orbital bombardment...",
  "Sharpening the cutlasses...",
  "Filtering out Earth-generated noise...",
  "Decrypting the Captain's logs...",
  "Pressurizing the airlock for 'guests'...",
  "Routing power to the logic shields...",
];

export const ERROR_MESSAGES = {
  generic: "System failure. Probably sabotage by Earth spies.",
  network: "Comms down. Solar flares or jamming signals from the mongrel race.",
  auth: "Access denied. You lack the clearance, whelp.",
  data: "The archives are corrupted. Someone's been tampering with the logs.",
  timeout:
    "The connection drifted into the void. Try again, if you have the patience.",
};

export const WELCOME_GREETINGS = [
  "Welcome to the Officers' Mess",
  "The Captain is... indisposed. You deal with me.",
  "Look what the shuttle dragged in.",
  "Fresh meat for the grinder?",
  "Try not to stain the carpet, Earth-born.",
  "The airlock is that way. Just saying.",
];

export const SCORE_CELEBRATIONS = {
  legend: [
    "A King's Ransom! The Captain will be pleased.",
    "Flawless victory. You might survive this crew yet.",
    "Pure Gold. We're rich, you mongrel!",
    "Legendary status. The stars bow to you.",
  ],
  captain: [
    "A fine haul. Stash it in the hold.",
    "Respectable plunder. You've earned your share.",
    "Good shooting. One less target to worry about.",
    "The Quartermaster approves.",
  ],
  ensign: [
    "Standard rations. Nothing to write home about.",
    "You survived. That's worth something.",
    "Mediocre, but acceptable for a lower-decker.",
    "Even keel. Don't get cocky.",
  ],
  swabbie: [
    "Sloppy work. Do you want to scrub the plasma injectors?",
    "Pathetic. The airlock is looking tempting.",
    "You missed. Try keeping your eyes open.",
    "Disappointing. Expected from an Earthling.",
  ],
  mutiny: [
    "Walk the plank. Now.",
    "Abomination. Get out of my sight.",
    "Waste of oxygen. Why do we keep you around?",
    "Total catastrophic failure. You shame the fleet.",
  ],
};

export const QUIZ_PROMPTS = {
  start: "Initiate Boarding Sequence.",
  submit: "Fire for Effect.",
  next: "Next Target.",
  previous: "Check Your Six.",
  eliminate: "Jettison Cargo.",
  quit: "Abandon Ship? Cowardice is punishable by death.",
};

export const SUBJECT_NAMES = {
  Contracts: "The Treaty Violations (Sectors 1-2)",
  Torts: "The Damage Assessment (Sectors 3-4)",
  "Criminal Law": "The Mutiny Protocols (Sectors 5-6)",
  "Constitutional Law": "The Admiral's Code (Sectors 7-8)",
  Evidence: "The Contraband Locker (Sectors 9-10)",
  "Civil Procedure": "The Boarding Maneuvers (Sectors 11-12)",
  "Real Property": "The Territory Disputes (Sectors 13-14)",
  "Professional Responsibility": "The Pirate's Honor (Sector 15)",
  "Community Property": "The Loot Division (Sector 16)",
  Remedies: "The Vengeance Pact (Sector 17)",
  "Business Associations": "The Syndicate Charters (Sector 18)",
};

export const FINE_PRINT = [
  "The Renegade Flotilla accepts no liability for loss of limb, sanity, or soul.",
  "Earthlings are tolerated only as long as they are useful. Remember that.",
  "Gambling on bar exam results is mandatory in the Officers' Mess.",
  "Oxygen is a privilege, not a right. Earn your breath.",
  "Any resemblance to terrestrial laws is purely for mockery purposes.",
  "The Captain's word is final. Especially when he's wrong.",
  "Mutiny will be met with immediate exposure to hard vacuum.",
  "We don't pay taxes. We take them.",
  "If you find a stowaway, you keep their possessions.",
  "The beatings will continue until morale improves.",
];

export const ACHIEVEMENT_NAMES = {
  firstRound: "First Blood",
  perfectRound: "The Captain's Favor",
  streak7: "Survivor's Instinct",
  streak30: "Void Veteran",
  allSubjects: "Master of the Fleet",
  speedDemon: "FTL Jump",
  comeback: "From the Brink",
  nightOwl: "Void Walker",
};

export const HAL_RESPONSES = {
  correct: [
    "Target destroyed. Excellence confirmed.",
    "Affirmative. The logic holds water.",
    "Direct hit. You know your trade.",
    "Acknowledged. Threat neutralized.",
  ],
  incorrect: [
    "Negative. Are your sensors malfunctioning?",
    "Error. You're firing blanks.",
    "False. That kind of thinking gets you killed.",
    "Denied. Go back to the academy.",
  ],
  explanation: [
    "Tactical Analysis follows...",
    "Scanning debris field for answers...",
    "Here's where you went wrong...",
    "Telemetry indicates the following...",
  ],
};

export const NAVIGATION_LABELS = {
  home: "Officers' Mess",
  quiz: "Battle Stations",
  setup: "Mission Briefing",
  review: "After-Action Report",
  statistics: "The Hoard",
  generator: "Simulations",
  essays: "Captain's Log",
  settings: "Ship Systems",
  profile: "Service Record",
  logout: "Abandon Ship",
  help: "Distress Signal",
};

export const EMPTY_STATES = {
  noHistory: {
    title: "Empty Logbook",
    message:
      "You haven't flown a sortie yet. Get in the simulator and earn your stripes.",
    cta: "Launch Mission",
  },
  noQuestions: {
    title: "Systems Offline",
    message: "The armory is restocking. Stand by for munitions.",
    cta: "Return to Bridge",
  },
  noStats: {
    title: "No Data",
    message: "We can't analyze what doesn't exist. Fly some missions first.",
    cta: "Engage Targets",
  },
};

/**
 * Get a random item from an array
 */
export function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Get a score-appropriate celebration message
 */
export function getCelebration(percentage) {
  if (percentage >= 90) return getRandomItem(SCORE_CELEBRATIONS.legend);
  if (percentage >= 80) return getRandomItem(SCORE_CELEBRATIONS.captain);
  if (percentage >= 70) return getRandomItem(SCORE_CELEBRATIONS.ensign);
  if (percentage >= 60) return getRandomItem(SCORE_CELEBRATIONS.swabbie);
  return getRandomItem(SCORE_CELEBRATIONS.mutiny);
}

/**
 * Get a loading message
 */
export function getLoadingMessage() {
  return getRandomItem(LOADING_MESSAGES);
}

/**
 * Get a welcome greeting
 */
export function getWelcomeGreeting() {
  return getRandomItem(WELCOME_GREETINGS);
}

/**
 * Get a fine print line
 */
export function getFinePrint() {
  return getRandomItem(FINE_PRINT);
}

/**
 * Get club motto
 */
export function getClubMotto() {
  return getRandomItem(CLUB_MOTTOS);
}

/**
 * Get HAL response for correct/incorrect
 */
export function getHalResponse(isCorrect) {
  return getRandomItem(
    isCorrect ? HAL_RESPONSES.correct : HAL_RESPONSES.incorrect,
  );
}

/**
 * Get golf-themed subject name
 */
export function getSubjectName(subject) {
  return SUBJECT_NAMES[subject] || subject;
}

export default {
  CLUB_MOTTOS,
  LOADING_MESSAGES,
  ERROR_MESSAGES,
  WELCOME_GREETINGS,
  SCORE_CELEBRATIONS,
  QUIZ_PROMPTS,
  SUBJECT_NAMES,
  FINE_PRINT,
  ACHIEVEMENT_NAMES,
  HAL_RESPONSES,
  NAVIGATION_LABELS,
  EMPTY_STATES,
  getRandomItem,
  getCelebration,
  getLoadingMessage,
  getWelcomeGreeting,
  getFinePrint,
  getClubMotto,
  getHalResponse,
  getSubjectName,
};
