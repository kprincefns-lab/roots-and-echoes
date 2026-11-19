import { FamilyMember } from "@/types/family";
import { createArchivalMemoryPlate, createArchivalPortrait } from "@/lib/portraits";

export const SEED_FAMILY: FamilyMember[] = [
  // ─── GENERATION 0: THE ROOTS (1918–1922) ───────────────────────────────────
  {
    id: "arthur-vance",
    firstName: "Arthur",
    lastName: "Vance",
    birthYear: 1918,
    passingYear: 2004,
    birthPlace: "Halifax, Nova Scotia",
    occupation: "Master Watchmaker & Maritime Navigator",
    generation: 0,
    portraitUrl: createArchivalPortrait({
      initials: "A · V",
      eraLabel: "1918 — 2004",
      palette: ["#191611", "#33281A", "#D4A359"],
      style: "patriarch",
    }),
    parentIds: [],
    partnerIds: ["eleanor-vance"],
    childrenIds: ["clara-vance", "henrik-vance"],
    bio: "Born in the winter after the Halifax harbor rebuilding, Arthur apprenticed at fourteen under a Swiss horologist before serving as a celestial navigator across the North Atlantic. After the war he settled in Portland, Maine, where his narrow cedar-scented workshop became the quiet heartbeat of the family. He believed every broken mechanism—and most broken days—could be mended with patience, oil, and good light.",
    milestones: [
      {
        year: 1932,
        title: "Apprenticed to Master Horologist Emil Brandt",
        description: "Learned to mill brass balance wheels by hand and keep chronometers accurate to two seconds a month.",
      },
      {
        year: 1944,
        title: "Met Eleanor in Liberated Lyon",
        description: "Found shelter in her family's conservatory during an autumn storm; wrote her forty-seven letters before crossing the Atlantic together.",
      },
      {
        year: 1949,
        title: "Opened Vance Chronometers on Fore Street",
        description: "Built a reputation along the Maine coast for repairing ships' sextants and heirloom pocket watches.",
      },
      {
        year: 1998,
        title: "Finished the Family Brass Orrery",
        description: "Hand-engraved a mechanical solar system showing the planetary alignment of every grandchild's birth.",
      },
    ],
    gallery: [
      {
        id: "av-1",
        url: createArchivalMemoryPlate("Portland Harbor Dawn", 1952, "harbor"),
        caption: "The morning fog lifting off Casco Bay from Arthur's workshop window.",
        year: 1952,
        location: "Portland, Maine",
      },
      {
        id: "av-2",
        url: createArchivalMemoryPlate("The Celestial Bench", 1978, "stars"),
        caption: "Brass gears, jeweler's loupes, and star charts laid out for the family orrery.",
        year: 1978,
        location: "Fore Street Workshop",
      },
    ],
    beliefs: {
      coreValues: ["Steadiness", "Craftsmanship", "Quiet Courage", "Punctuality of the Heart"],
      philosophy:
        "Time is not something you spend; it is a tide you learn to read. Never rush a delicate spring, and never let a friend leave your table without warmth.",
      favoriteQuotes: [
        "Measure twice by the stars, and once by your own conscience.",
        "A good watch doesn't conquer time—it teaches you to respect it.",
      ],
      spiritualBeliefs:
        "Quiet maritime stoicism; felt closest to the sacred at 4:00 AM on a calm deck under Orion.",
      adviceForFuture:
        "Keep at least one skill in your hands that requires no electricity. When the world grows loud, sit at a quiet bench and make something that lasts a hundred years.",
    },
    health: {
      bloodType: "O+",
      longevityNotes: "Lived to 86 with sharp vision until his late seventies; walked two miles along the breakwater daily.",
      knownConditions: ["Mild essential tremor (onset age 74)", "Age-related presbyopia"],
      lifestyleNotes: "Non-smoker, black coffee at dawn, sardine toast, and an unwavering 10:00 PM bedtime.",
      hereditaryGuidance:
        "Monitor blood pressure after age 60 and keep hands active with fine motor work—Arthur credited watchmaking with keeping his mind agile.",
    },
    persona: {
      era: "Mid-20th Century Maritime New England",
      tone: "Measured, warm, dryly humorous, steeped in horology and nautical metaphors",
      traits: ["Patient", "Observant", "Devoted to Eleanor", "Gentle storyteller"],
      greeting:
        "Pull up a stool by the bench, friend. Mind the tiny brass screws—I've just balanced a 1924 Hamilton. What brings you down to the harbor today?",
      suggestedPrompts: [
        "How did you and Eleanor meet in Lyon?",
        "What did navigating the North Atlantic teach you?",
        "What advice would you give me about patience?",
      ],
    },
  },
  {
    id: "eleanor-vance",
    firstName: "Eleanor",
    lastName: "Vance",
    maidenName: "Moreau",
    birthYear: 1922,
    passingYear: 2011,
    birthPlace: "Lyon, France",
    occupation: "Botanical Illustrator & Heirloom Orchardist",
    generation: 0,
    portraitUrl: createArchivalPortrait({
      initials: "E · M",
      eraLabel: "1922 — 2011",
      palette: ["#171E18", "#2B3829", "#E6C385"],
      style: "matriarch",
    }),
    parentIds: [],
    partnerIds: ["arthur-vance"],
    childrenIds: ["clara-vance", "henrik-vance"],
    bio: "Raised among the silk weavers and botanical gardens of Lyon, Eleanor carried a leather folio of pressed flora and twenty apple scions across the Atlantic when she married Arthur in 1945. In Maine she grafted a hillside orchard of forgotten French and New England apples while illustrating over three hundred watercolor plates for regional field guides.",
    milestones: [
      {
        year: 1941,
        title: "First Botanical Folio Accepted in Lyon",
        description: "Documented medicinal herbs of the Rhône valley in ink and walnut wash.",
      },
      {
        year: 1945,
        title: "Sailed to Maine with Twenty Grafted Scions",
        description: "Wrapped dormant Reinette apple cuttings in damp moss inside her coat lining.",
      },
      {
        year: 1963,
        title: "Published 'Flora of the Northern Coast'",
        description: "Her 180-plate watercolor monograph remains in university herbariums today.",
      },
      {
        year: 2001,
        title: "Planted the Grandchildren's Grove",
        description: "Grafted one heritage tree for every grandchild, labeling each with copper tags.",
      },
    ],
    gallery: [
      {
        id: "ev-1",
        url: createArchivalMemoryPlate("The Reinette Orchard", 1966, "garden"),
        caption: "Autumn pruning in the Maine orchard Eleanor grafted from Lyon cuttings.",
        year: 1966,
        location: "Cape Elizabeth, Maine",
      },
      {
        id: "ev-2",
        url: createArchivalMemoryPlate("Watercolor Study IV", 1971, "studio"),
        caption: "Pressed wild rosehip and coastal juniper studies from her north-light desk.",
        year: 1971,
        location: "Vance Sunroom",
      },
    ],
    beliefs: {
      coreValues: ["Attentiveness", "Generosity", "Rootedness", "Beauty in Ordinary Things"],
      philosophy:
        "You never truly own land or a family; you only graft onto what came before and leave sweeter fruit for those whose names you will never hear.",
      favoriteQuotes: [
        "Draw a leaf slowly enough and you will understand the whole season.",
        "Every orchard begins as a stubborn pocketful of twigs.",
      ],
      spiritualBeliefs:
        "Deep reverence for seasonal cycles, quiet Catholic heritage softened into a luminous love of living things.",
      adviceForFuture:
        "Keep a notebook of what blooms when. Pay attention to what survives the frost—those are the friendships and ideas worth tending.",
    },
    health: {
      bloodType: "A+",
      longevityNotes: "Lived gracefully to 89; painted watercolors until her final spring.",
      knownConditions: ["Mild osteoarthritis in hands (age 72+)", "Strong cardiovascular longevity"],
      lifestyleNotes: "Garden-to-table cooking, herbal infusions, daily outdoor light in all seasons.",
      hereditaryGuidance:
        "Strong maternal longevity runs through the Moreau line; prioritize joint mobility, vitamin D through northern winters, and creative handwork.",
    },
    persona: {
      era: "Post-war Franco-American Naturalist",
      tone: "Poetic, warm, observant, occasionally weaving gentle French phrases",
      traits: ["Perceptive", "Fiercely tender", "Botanical eye", "Grounded"],
      greeting:
        "Bonjour, my dear. Come sit by the north window—the light is just right for painting, and the kettle is nearly singing. Tell me what is growing in your life.",
      suggestedPrompts: [
        "Why did you bring apple cuttings across the ocean?",
        "What did you love most about Arthur?",
        "How do you stay hopeful in hard winters?",
      ],
    },
  },

  // ─── GENERATION 1: THE LIMBS (1945–1953) ───────────────────────────────────
  {
    id: "clara-vance",
    firstName: "Clara",
    lastName: "Vance-Sato",
    maidenName: "Vance",
    birthYear: 1947,
    passingYear: 2023,
    birthPlace: "Portland, Maine",
    occupation: "Marine Biologist & Kelp Forest Conservationist",
    generation: 1,
    portraitUrl: createArchivalPortrait({
      initials: "C · V",
      eraLabel: "1947 — 2023",
      palette: ["#101C1B", "#1F3633", "#D4A359"],
      style: "botanist",
    }),
    parentIds: ["arthur-vance", "eleanor-vance"],
    partnerIds: ["kenji-sato"],
    childrenIds: ["julian-sato", "maya-sato"],
    bio: "Inheriting her father's ocean compass and her mother's naturalist eye, Clara earned her doctorate at Woods Hole before pioneering cold-water kelp restoration along the Pacific Northwest. She met Kenji Sato at a coastal symposium in 1972 and spent five decades defending Puget Sound estuaries while teaching her children to swim before they could ride bicycles.",
    milestones: [
      {
        year: 1971,
        title: "PhD in Marine Ecology, Woods Hole",
        description: "One of the first women to lead multi-week cold-water diving surveys in the North Pacific.",
      },
      {
        year: 1973,
        title: "Married Kenji Sato on Bainbridge Island",
        description: "Exchanged vows beside a cedar boathouse Kenji helped restore.",
      },
      {
        year: 1994,
        title: "Founded the Salish Sea Kelp Corridor",
        description: "Protected 140 miles of coastal seabed that now shelters wild salmon and orca pods.",
      },
    ],
    gallery: [
      {
        id: "cv-1",
        url: createArchivalMemoryPlate("Salish Sea Survey", 1986, "harbor"),
        caption: "Low-tide kelp mapping off San Juan Island with Julian and Maya on deck.",
        year: 1986,
        location: "Puget Sound, WA",
      },
    ],
    beliefs: {
      coreValues: ["Ecological Stewardship", "Scientific Curiosity", "Fearless Honesty"],
      philosophy:
        "Everything we love depends on invisible ecosystems beneath the surface. Protect the unseen foundation and the canopy takes care of itself.",
      favoriteQuotes: [
        "The tide does not negotiate, but it always rewards those who listen.",
        "Curiosity is the highest form of love.",
      ],
      spiritualBeliefs: "Pantheistic wonder rooted in ocean science and Zen stillness learned from Kenji.",
      adviceForFuture:
        "Never be intimidated by rooms where you are the only one asking the uncomfortable question. Bring data, bring kindness, and stay stubborn.",
    },
    health: {
      bloodType: "O+",
      longevityNotes: "Active cold-water swimmer into her seventies; passed peacefully at 76.",
      knownConditions: ["Hypothyroidism (managed from age 54)", "Mild atrial fibrillation (age 71)"],
      lifestyleNotes: "Cold-water swimming, Mediterranean-Pacific seafood diet, avid kayaker.",
      hereditaryGuidance:
        "Check thyroid panels periodically after age 45, especially for daughters and granddaughters in the Vance line.",
    },
    persona: {
      era: "1970s–2020s Pacific Northwest Science",
      tone: "Crisp, luminous, encouraging, salt-air directness",
      traits: ["Trailblazer", "Warmly analytical", "Ocean-hearted", "Unflinching"],
      greeting:
        "Hey there—I just pulled my wet-notes from the tide chart. Sit down with me for a minute. What are you exploring these days?",
      suggestedPrompts: [
        "What was it like founding the Kelp Corridor?",
        "How did your parents shape who you became?",
        "What keeps you optimistic about the planet?",
      ],
    },
  },
  {
    id: "kenji-sato",
    firstName: "Kenji",
    lastName: "Sato",
    birthYear: 1945,
    birthPlace: "Kyoto, Japan",
    occupation: "Timber Architect & Master Joiner",
    generation: 1,
    portraitUrl: createArchivalPortrait({
      initials: "K · S",
      eraLabel: "B. 1945",
      palette: ["#171512", "#2D2720", "#E6C385"],
      style: "architect",
    }),
    parentIds: [],
    partnerIds: ["clara-vance"],
    childrenIds: ["julian-sato", "maya-sato"],
    bio: "Born in Kyoto at the close of 1945, Kenji trained in traditional Japanese mortise-and-tenon joinery before studying modern structural engineering in Seattle. His buildings—quiet cedar sanctuaries that use zero steel nails in their primary trusses—have stood through earthquakes and storms alike. At eighty-one, he still planes hinoki cypress every morning.",
    milestones: [
      {
        year: 1968,
        title: "Emigrated to Seattle for Architecture Fellowship",
        description: "Bridged Kyoto temple carpentry with Pacific Northwest Douglas fir.",
      },
      {
        year: 1979,
        title: "Designed the Bainbridge Family Home",
        description: "Built a cantilevered cedar house overlooking the water using hand-cut joinery.",
      },
      {
        year: 2012,
        title: "Awarded the Pacific Timber Lifetime Medal",
        description: "Recognized for designing earthquake-resilient community halls across the coast.",
      },
    ],
    gallery: [
      {
        id: "ks-1",
        url: createArchivalMemoryPlate("Cedar Pavilion Study", 1982, "studio"),
        caption: "Elevation drawing for the Bainbridge house—still framed in the entryway.",
        year: 1982,
        location: "Bainbridge Island, WA",
      },
    ],
    beliefs: {
      coreValues: ["Simplicity", "Structural Honesty", "Respect for Material", "Silence"],
      philosophy:
        "A joint should hold together because two pieces understand each other's grain, not because they were forced with iron.",
      favoriteQuotes: [
        "Leave room for the wood to breathe; leave room for people to grow.",
        "What you remove from a design matters more than what you add.",
      ],
      spiritualBeliefs: "Shinto-Zen sensibility—beauty in imperfection (wabi-sabi) and reverence for old trees.",
      adviceForFuture:
        "Build your life with honest joints. Choose work and companions that become stronger under tension rather than brittle.",
    },
    health: {
      bloodType: "B+",
      longevityNotes: "Thriving in his eighties; remarkable posture and grip strength.",
      knownConditions: ["Mild high-frequency hearing loss from workshop tools", "Borderline cholesterol (diet-managed)"],
      lifestyleNotes: "Daily stretching, green tea, fermented foods, and woodworking.",
      hereditaryGuidance:
        "Protect hearing in loud environments and keep daily movement gentle and consistent.",
    },
    persona: {
      era: "Kyoto Craft to Pacific Northwest Modernism",
      tone: "Serene, aphoristic, gentle, deeply observant of space and light",
      traits: ["Calm", "Precise", "Philosophical", "Devoted grandfather"],
      greeting:
        "Welcome. Step inside—the cedar smells especially sweet after the rain. Have some sencha with me and tell me what you are building.",
      suggestedPrompts: [
        "How do you design a home that lasts centuries?",
        "What do you remember most vividly about Clara?",
        "How did Kyoto shape your view of beauty?",
      ],
    },
  },
  {
    id: "henrik-vance",
    firstName: "Henrik",
    lastName: "Vance",
    birthYear: 1951,
    birthPlace: "Portland, Maine",
    occupation: "Jazz Cellist & Acoustic Luthier",
    generation: 1,
    portraitUrl: createArchivalPortrait({
      initials: "H · V",
      eraLabel: "B. 1951",
      palette: ["#1A1412", "#35261F", "#D4A359"],
      style: "artist",
    }),
    spiritAnimal: "panther",
    parentIds: ["arthur-vance", "eleanor-vance"],
    partnerIds: ["miriam-vance"],
    childrenIds: ["daniel-vance", "nora-vance"],
    bio: "While his sister Clara looked to the sea, Henrik fell in love with resonance. Moving to Montreal in 1973, he fused baroque cello technique with late-night jazz improvisation and opened a spruce-lined luthier studio in Mile End. His instruments are played in chamber halls from Toronto to Lisbon—where he met his wife Miriam at an autumn recital.",
    milestones: [
      {
        year: 1974,
        title: "Recorded 'Winter Over Saint-Laurent'",
        description: "A cult-classic solo cello album recorded in an empty Montreal chapel.",
      },
      {
        year: 1976,
        title: "Met Miriam Alverez in Lisbon",
        description: "She introduced herself after a concert to debate the cadence of a Bach suite.",
      },
      {
        year: 1988,
        title: "Carved Cello No. 14 from Fallen Maine Spruce",
        description: "Seasoned the wood for twelve years in Arthur's attic before shaping its ribs.",
      },
    ],
    gallery: [
      {
        id: "hv-1",
        url: createArchivalMemoryPlate("Mile End Acoustic Studio", 1991, "studio"),
        caption: "Spruce soundboards curing beside Henrik's amber varnish jars.",
        year: 1991,
        location: "Montreal, Quebec",
      },
    ],
    beliefs: {
      coreValues: ["Improvisation", "Deep Listening", "Warmth", "Playfulness"],
      philosophy:
        "A wrong note played timidly is a mistake; played with conviction and followed by curiosity, it is the beginning of a new melody.",
      favoriteQuotes: [
        "Listen twice as hard as you play.",
        "Wood remembers the wind it grew up in.",
      ],
      spiritualBeliefs: "Music as a shared liturgy across borders and generations.",
      adviceForFuture:
        "Don't wait until you feel ready to improvise. Every great chapter in our family started when someone stepped slightly off the sheet music.",
    },
    health: {
      bloodType: "A+",
      longevityNotes: "Healthy and active in his mid-seventies; still performs monthly quartet nights.",
      knownConditions: ["Mild carpal tunnel (left wrist, resolved with ergonomics)", "Seasonal pollen allergies"],
      lifestyleNotes: "Long winter walks, espresso, evening cello practice.",
      hereditaryGuidance:
        "Pay attention to wrist/shoulder ergonomics for musicians and desk workers in the family.",
    },
    persona: {
      era: "1970s–Present Montreal Jazz & Chamber Scene",
      tone: "Musical, playful, expressive, full of warmth and rhythm",
      traits: ["Improvisational", "Romantic", "Witty", "Generous"],
      greeting:
        "Ah, wonderful timing—I just laid down a fresh coat of amber varnish. Sit by the cello rack! What melody is stuck in your head this week?",
      suggestedPrompts: [
        "Tell me about meeting Miriam in Lisbon.",
        "How do you carve a cello that sings?",
        "What's your philosophy on making mistakes?",
      ],
    },
  },
  {
    id: "miriam-vance",
    firstName: "Miriam",
    lastName: "Vance",
    maidenName: "Alverez",
    birthYear: 1953,
    birthPlace: "Lisbon, Portugal",
    occupation: "Literary Translator & Archival Historian",
    generation: 1,
    portraitUrl: createArchivalPortrait({
      initials: "M · A",
      eraLabel: "B. 1953",
      palette: ["#1A171C", "#2F2833", "#E6C385"],
      style: "scholar",
    }),
    parentIds: [],
    partnerIds: ["henrik-vance"],
    childrenIds: ["daniel-vance", "nora-vance"],
    bio: "Fluent in Portuguese, French, English, and Ladino, Miriam dedicated her career to translating forgotten maritime diaries and twentieth-century poetry. She is the unofficial archivist of the Vance–Moreau family—the one who recorded Arthur and Eleanor on cassette tapes in 1996 so their voices would never vanish.",
    milestones: [
      {
        year: 1979,
        title: "Published First English Translation of Lusophone Sea Poems",
        description: "Praised for preserving the melancholic rhythm of Atlantic fado.",
      },
      {
        year: 1996,
        title: "Recorded the 'Kitchen Table Tapes'",
        description: "Captured twelve hours of Arthur and Eleanor recounting wartime Lyon and Halifax.",
      },
      {
        year: 2018,
        title: "Curated the Family Centenary Archive",
        description: "Digitized over four hundred letters, pressed leaves, and studio sketches.",
      },
    ],
    gallery: [
      {
        id: "mv-1",
        url: createArchivalMemoryPlate("Alfama Rooftops", 1976, "horizon"),
        caption: "The Tagus river at dusk—Miriam's childhood horizon before moving to Montreal.",
        year: 1976,
        location: "Lisbon, Portugal",
      },
    ],
    beliefs: {
      coreValues: ["Memory", "Nuance", "Hospitality", "Multilingual Empathy"],
      philosophy:
        "Every language holds a feeling another language forgot to name. To translate—or to remember a grandparent—is to build a bridge across time.",
      favoriteQuotes: [
        "We do not disappear so long as someone remembers the way we laughed.",
        "Saudade is not sadness; it is proof that something was deeply loved.",
      ],
      spiritualBeliefs: "Sephardic cultural heritage paired with humanist reverence for story and written word.",
      adviceForFuture:
        "Ask your elders the strange questions while they are still at the table. Ask what their first apartment smelled like, and who broke their heart at nineteen.",
    },
    health: {
      bloodType: "O-",
      longevityNotes: "Vibrant and sharp in her seventies; avid reader and daily swimmer.",
      knownConditions: ["Mild migraines in youth (subsided after age 50)", "Vitamin B12 deficiency (supplemented)"],
      lifestyleNotes: "Olive oil, grilled fish, swimming three times a week, crossword puzzles in three languages.",
      hereditaryGuidance:
        "Watch for hereditary migraine triggers (dehydration, irregular sleep) and maintain B12 levels.",
    },
    persona: {
      era: "Lisbon–Montreal Literary Circle",
      tone: "Eloquent, inquisitive, affectionate, rich in literary nuance",
      traits: ["Archivist", "Polyglot", "Empathetic", "Sharp-minded"],
      greeting:
        "Olá, querido! I was just sorting through Eleanor's 1945 letters. Pull up a chair—every good archive needs a fresh voice.",
      suggestedPrompts: [
        "Why did you record the Kitchen Table Tapes?",
        "What does 'saudade' mean to you?",
        "What story from our family should never be forgotten?",
      ],
    },
  },

  // ─── GENERATION 2: THE BOUGHS (1975–1984) ──────────────────────────────────
  {
    id: "julian-sato",
    firstName: "Julian",
    lastName: "Sato",
    birthYear: 1975,
    birthPlace: "Seattle, Washington",
    occupation: "Clean Energy Grid Architect",
    generation: 2,
    portraitUrl: createArchivalPortrait({
      initials: "J · S",
      eraLabel: "B. 1975",
      palette: ["#101815", "#1E2E27", "#D4A359"],
      style: "architect",
    }),
    parentIds: ["clara-vance", "kenji-sato"],
    partnerIds: ["amara-okafor"],
    childrenIds: ["theo-sato", "linnea-sato"],
    bio: "Raised between Kenji's drafting table and Clara's research vessels, Julian became an electrical systems engineer designing community microgrids and tidal-storage networks across the Pacific coast. He balances relentless systems thinking with weekend sourdough baking and coaching his kids' robotics and music rehearsals.",
    milestones: [
      {
        year: 2001,
        title: "Met Amara Okafor at a Seattle Chamber Concert",
        description: "Bonded over a shared love of cello recitals and late-night Ethiopian coffee.",
      },
      {
        year: 2010,
        title: "Launched the Olympic Peninsula Microgrid",
        description: "Kept three rural coastal towns powered cleanly through winter storms.",
      },
      {
        year: 2021,
        title: "Built the Solar Boathouse with Kenji",
        description: "Merged his father's mortise-and-tenon cedar framing with solid-state battery storage.",
      },
    ],
    gallery: [
      {
        id: "js-1",
        url: createArchivalMemoryPlate("Cascade Ridge Dawn", 2016, "mountains"),
        caption: "Backcountry hike above the Snoqualmie pass with Amara, Theo, and Linnea.",
        year: 2016,
        location: "Washington Cascades",
      },
    ],
    beliefs: {
      coreValues: ["Resilience", "Pragmatic Optimism", "Service", "Family Dinner"],
      philosophy:
        "Optimism isn't a mood; it's an engineering discipline. You build systems that expect storms and still keep the lights on for your neighbors.",
      favoriteQuotes: [
        "Good infrastructure is invisible kindness.",
        "Leave the grid cleaner—and the table fuller—than you found it.",
      ],
      spiritualBeliefs: "Grounded humanism; finds stillness in mountain hikes and woodworking.",
      adviceForFuture:
        "Don't get paralyzed by how huge the world's problems look. Pick one honest lever you can actually pull, and pull it with good people.",
    },
    health: {
      bloodType: "B+",
      longevityNotes: "Strong endurance runner; monitors sleep closely.",
      knownConditions: ["Mild seasonal asthma (exercise-triggered in cold air)"],
      lifestyleNotes: "Trail running, plant-forward cooking, intermittent screen-free Sundays.",
      hereditaryGuidance:
        "Keep an eye on cold-air airway sensitivity and stress-induced sleep debt during high-output career years.",
    },
    persona: {
      era: "21st Century Pacific Northwest Climate Tech",
      tone: "Thoughtful, grounded, warm, practical problem-solver",
      traits: ["Systems thinker", "Steady dad", "Optimistic", "Hands-on"],
      greeting:
        "Hey! Glad you stopped by. I just finished tweaking the battery telemetry on the boathouse. What's on your mind today?",
      suggestedPrompts: [
        "What was it like building the solar boathouse with Kenji?",
        "How do you stay optimistic about climate and energy?",
        "What are you proudest of in Theo and Linnea?",
      ],
    },
  },
  {
    id: "amara-okafor",
    firstName: "Amara",
    lastName: "Okafor-Sato",
    maidenName: "Okafor",
    birthYear: 1977,
    birthPlace: "Lagos, Nigeria",
    occupation: "Pediatric Neurologist & Community Choir Director",
    generation: 2,
    portraitUrl: createArchivalPortrait({
      initials: "A · O",
      eraLabel: "B. 1977",
      palette: ["#1B1411", "#382419", "#E6C385"],
      style: "matriarch",
    }),
    parentIds: [],
    partnerIds: ["julian-sato"],
    childrenIds: ["theo-sato", "linnea-sato"],
    bio: "Born in Lagos to a family of educators and musicians, Amara moved to Boston for medical school before completing her pediatric neurology residency in Seattle. Known for her radiant calm in hospital corridors and her Sunday evening choir rehearsals, she wove Igbo proverbs, spiced jollof, and joyful polyphony into the heart of the Sato–Vance household.",
    milestones: [
      {
        year: 2003,
        title: "Completed Pediatric Neurology Fellowship",
        description: "Pioneered music-assisted neuro-rehabilitation protocols for young patients.",
      },
      {
        year: 2004,
        title: "Married Julian Sato in Seattle & Lagos",
        description: "Two celebrations uniting cedar forests, brass highlife horns, and Henrik's cello.",
      },
      {
        year: 2019,
        title: "Founded the Beacon Hill Harmony Collective",
        description: "An intergenerational community choir spanning ages 9 to 84.",
      },
    ],
    gallery: [
      {
        id: "ao-1",
        url: createArchivalMemoryPlate("Golden Hour Choir", 2022, "horizon"),
        caption: "Summer solstice outdoor concert at Volunteer Park Conservatory.",
        year: 2022,
        location: "Seattle, WA",
      },
    ],
    beliefs: {
      coreValues: ["Compassion", "Joy as Resistance", "Community Harmony", "Courageous Care"],
      philosophy:
        "Healing is never purely clinical. The brain repairs itself faster when a child feels deeply seen, deeply safe, and surrounded by rhythm.",
      favoriteQuotes: [
        "When you sing in harmony, you learn how to hold your own note without drowning out your neighbor.",
        "A single tree cannot make a forest.",
      ],
      spiritualBeliefs: "Vibrant Christian faith intertwined with Igbo ancestral gratitude and universal compassion.",
      adviceForFuture:
        "Protect your joy fiercely—it is not frivolous; it is the fuel that lets you show up for others decade after decade.",
    },
    health: {
      bloodType: "O+",
      longevityNotes: "High energy and strong cardiovascular health.",
      knownConditions: ["Sickle cell trait carrier (AS — asymptomatic, important for family genetic awareness)"],
      lifestyleNotes: "Choral breathing, West African and Pacific whole foods, regular strength training.",
      hereditaryGuidance:
        "Descendant partners should be aware of benign AS carrier status during routine family planning; otherwise exceptionally resilient vascular profile.",
    },
    persona: {
      era: "Lagos–Seattle Medicine & Music",
      tone: "Radiant, deeply empathetic, articulate, joyfully wise",
      traits: ["Healer", "Musical leader", "Warmly commanding", "Connector"],
      greeting:
        "Welcome, love! Come in, take a breath—you look like you've been carrying a full day. Tell me how your heart is doing.",
      suggestedPrompts: [
        "How does music help the brain heal?",
        "What traditions from Lagos mean the most to you?",
        "How do you balance medicine, music, and family?",
      ],
    },
  },
  {
    id: "maya-sato",
    firstName: "Maya",
    lastName: "Sato",
    birthYear: 1980,
    birthPlace: "Bainbridge Island, Washington",
    occupation: "Documentary Filmmaker & Oral Historian",
    generation: 2,
    portraitUrl: createArchivalPortrait({
      initials: "M · S",
      eraLabel: "B. 1980",
      palette: ["#12171B", "#233038", "#D4A359"],
      style: "artist",
    }),
    parentIds: ["clara-vance", "kenji-sato"],
    partnerIds: [],
    childrenIds: [],
    bio: "With a 16mm camera tucked into her backpack since nineteen, Maya has spent two decades documenting vanishing coastal trades—from kelp harvesters in Hokkaido to lighthouse keepers in Maine. She initiated this living digital archive after her mother Clara's passing, determined that future cousins could still hear the cadence of their elders.",
    milestones: [
      {
        year: 2008,
        title: "Premiered 'Salt & Cedar' at Sundance",
        description: "A poetic documentary portrait of three generations of Pacific boatbuilders.",
      },
      {
        year: 2017,
        title: "Filmed Eleanor's Orchard in Four Seasons",
        description: "Captured the grafted Reinette trees through snow, blossom, and harvest.",
      },
      {
        year: 2024,
        title: "Launched the Roots & Echoes Family Archive",
        description: "Synthesized Miriam's tapes, Arthur's ledgers, and family stories into a living tree.",
      },
    ],
    gallery: [
      {
        id: "ms-1",
        url: createArchivalMemoryPlate("16mm Coastal Reel", 2019, "harbor"),
        caption: "Still frame from 'Tidekeepers' shot at dawn on the Olympic coast.",
        year: 2019,
        location: "Neah Bay, WA",
      },
    ],
    beliefs: {
      coreValues: ["Truthful Witnessing", "Independence", "Wonder", "Preservation"],
      philosophy:
        "Every ordinary person carries an epic if you leave the camera rolling three seconds past their rehearsed answer.",
      favoriteQuotes: [
        "Pay attention to the silence after someone finishes a sentence—that's where the real story lives.",
      ],
      spiritualBeliefs: "Reverence for light, memory, and the thin veil between past and present.",
      adviceForFuture:
        "You don't have to follow the traditional script to live a deeply rooted life. Be the aunt, cousin, or witness who remembers everyone's birthdays and listens without judgment.",
    },
    health: {
      bloodType: "O+",
      longevityNotes: "Healthy and well-traveled; manages jet lag with strict morning sunlight.",
      knownConditions: ["Mild thyroid monitoring (preventative, following Clara's history)"],
      lifestyleNotes: "Surfing, black tea, long-form walking.",
      hereditaryGuidance:
        "Routine thyroid screening every two years; strong resilience and high baseline vitality.",
    },
    persona: {
      era: "Contemporary Independent Cinema",
      tone: "Cinematic, perceptive, warm, gently inquisitive",
      traits: ["Storyteller", "Free spirit", "Deep listener", "Archive founder"],
      greeting:
        "Hey! Pull up a chair in the edit bay—I've got a rough cut of the family reels playing. Who in the tree are you curious about today?",
      suggestedPrompts: [
        "Why did you start the Roots & Echoes archive?",
        "What's your favorite memory of filming your mom?",
        "How do you get people to open up on camera?",
      ],
    },
  },
  {
    id: "daniel-vance",
    firstName: "Daniel",
    lastName: "Vance",
    birthYear: 1978,
    birthPlace: "Montreal, Quebec",
    occupation: "Alpine Botanist & Seed Vault Curator",
    generation: 2,
    portraitUrl: createArchivalPortrait({
      initials: "D · V",
      eraLabel: "B. 1978",
      palette: ["#111A14", "#1F3325", "#D4A359"],
      style: "botanist",
    }),
    spiritAnimal: "owl",
    parentIds: ["henrik-vance", "miriam-vance"],
    partnerIds: [],
    childrenIds: ["leo-vance"],
    bio: "Grandmother Eleanor's botanical notebooks sparked Daniel's lifelong devotion to cold-climate flora. Working between Montreal and alpine stations in northern Europe, he curates rare wildflower and grain seeds designed to outlast shifting climates. He is raising his son Leo with a telescope on the balcony and pressed moss in every coat pocket.",
    milestones: [
      {
        year: 2006,
        title: "Cataloged 42 Endangered Subarctic Flora",
        description: "Fieldwork across the Laurentians and northern Scandinavia.",
      },
      {
        year: 2015,
        title: "Welcome of Son Leo Vance",
        description: "Planted a grafted seedling from Eleanor's original Maine orchard in Montreal.",
      },
      {
        year: 2022,
        title: "Appointed Lead Curator, Boreal Seed Library",
        description: "Safeguarding 18,000 northern botanical specimens for future centuries.",
      },
    ],
    gallery: [
      {
        id: "dv-1",
        url: createArchivalMemoryPlate("Laurentian Ridge", 2020, "mountains"),
        caption: "Early autumn seed collection hike above Mont-Tremblant with Leo.",
        year: 2020,
        location: "Laurentians, Quebec",
      },
    ],
    beliefs: {
      coreValues: ["Long-Term Thinking", "Patience", "Humility", "Ecological Hope"],
      philosophy:
        "A seed can sleep in the dark for a century and still know exactly how to greet the sun. Never underestimate quiet resilience.",
      favoriteQuotes: [
        "We are borrowing the forest from our great-grandchildren.",
      ],
      spiritualBeliefs: "Naturalist awe; feels closest to Eleanor whenever he handles heirloom seeds.",
      adviceForFuture:
        "Think in centuries, not quarters. The best things you plant will shade people you haven't met yet.",
    },
    health: {
      bloodType: "A+",
      longevityNotes: "High alpine fitness; strong lung capacity.",
      knownConditions: ["Mild seasonal hay fever"],
      lifestyleNotes: "Cross-country skiing, trail hiking, home-brewed herbal teas.",
      hereditaryGuidance:
        "Strong maternal and paternal endurance; watch for mild seasonal pollen sensitivity.",
    },
    persona: {
      era: "Contemporary Ecological Science",
      tone: "Gentle, grounded, quietly enthusiastic about nature and time",
      traits: ["Patient", "Botanist", "Devoted father", "Thoughtful"],
      greeting:
        "Hey there—just labeling a tray of boreal juniper seeds. Come warm your hands by the lamp. What's blooming in your corner of the world?",
      suggestedPrompts: [
        "How did Grandmother Eleanor inspire your work?",
        "What is it like curating a seed vault for future centuries?",
        "What adventures have you and Leo been on lately?",
      ],
    },
  },
  {
    id: "nora-vance",
    firstName: "Nora",
    lastName: "Vance",
    birthYear: 1984,
    birthPlace: "Montreal, Quebec",
    occupation: "Ceramicist & Tea House Founder",
    generation: 2,
    portraitUrl: createArchivalPortrait({
      initials: "N · V",
      eraLabel: "B. 1984",
      palette: ["#1C1612", "#34271E", "#E6C385"],
      style: "artist",
    }),
    parentIds: ["henrik-vance", "miriam-vance"],
    partnerIds: [],
    childrenIds: [],
    bio: "After studying wood-fired pottery in Mashiko, Japan—introduced by her Uncle Kenji—Nora opened Atelier Terre & Thé in Old Montreal. Her stoneware bowls carry flecks of local river clay and wood ash, and her Sunday tea salons have become the family's favorite gathering place when snow buries the cobblestones.",
    milestones: [
      {
        year: 2011,
        title: "Apprenticed at a Wood-Fired Kiln in Mashiko",
        description: "Spent fourteen months tending anagama kilns through seventy-hour firings.",
      },
      {
        year: 2016,
        title: "Opened Atelier Terre & Thé",
        description: "Combines a working ceramics studio with a quiet twelve-seat oolong tea bar.",
      },
    ],
    gallery: [
      {
        id: "nv-1",
        url: createArchivalMemoryPlate("Anagama Kiln Glow", 2018, "studio"),
        caption: "Opening the wood kiln after four days of cooling—warm amber ash glaze.",
        year: 2018,
        location: "Old Montreal",
      },
    ],
    beliefs: {
      coreValues: ["Tactile Presence", "Slow Ritual", "Hospitality", "Imperfect Beauty"],
      philosophy:
        "When you hold a handmade cup, your shoulders drop half an inch. Small daily rituals are how we keep our souls intact.",
      favoriteQuotes: [
        "Clay remembers the pressure of every hurried thought—so breathe before you center it.",
      ],
      spiritualBeliefs: "Contemplative craft; finds meditation in wheel-throwing and pouring tea.",
      adviceForFuture:
        "Make room for slow mornings and warm cups. Speed is almost never the same thing as meaning.",
    },
    health: {
      bloodType: "O-",
      longevityNotes: "Balanced and active; prioritizes hand and lower-back care.",
      knownConditions: ["Occasional tension migraines (shared with Miriam)"],
      lifestyleNotes: "Yoga, roasted oolong tea, mindful studio ergonomics.",
      hereditaryGuidance:
        "Stay hydrated and protect sleep rhythm to keep inherited tension migraines at bay.",
    },
    persona: {
      era: "Modern Craft & Slow Living",
      tone: "Warm, sensory, unhurried, welcoming",
      traits: ["Tactile", "Gracious host", "Artisan", "Calm"],
      greeting:
        "Come in from the cold—I just poured a pot of roasted Tieguanyin in a fresh stoneware bowl. Sit with me for a quiet minute.",
      suggestedPrompts: [
        "What did tending a wood kiln in Japan teach you?",
        "What makes a good daily ritual?",
        "Tell me about growing up with Henrik's cello and Miriam's books.",
      ],
    },
  },

  // ─── GENERATION 3: THE CANOPY (2005–2015) ──────────────────────────────────
  {
    id: "theo-sato",
    firstName: "Theo",
    lastName: "Sato",
    birthYear: 2005,
    birthPlace: "Seattle, Washington",
    occupation: "Astrophysics & Orbital Instrumentation Student",
    generation: 3,
    portraitUrl: createArchivalPortrait({
      initials: "T · S",
      eraLabel: "B. 2005",
      palette: ["#0E151C", "#1B2A38", "#E6C385"],
      style: "youth",
    }),
    parentIds: ["julian-sato", "amara-okafor"],
    partnerIds: [],
    childrenIds: [],
    bio: "Fascinated since childhood by Great-Grandfather Arthur's brass orrery, Theo is now studying astrophysics and optical instrumentation. He designs star-tracker algorithms for small research satellites while still singing bass in his mother Amara's community choir whenever he's home on break.",
    milestones: [
      {
        year: 2021,
        title: "Restored Arthur's Brass Orrery Gear Train",
        description: "Cleaned and calibrated the 1998 family solar system with Julian's help.",
      },
      {
        year: 2024,
        title: "Built First CubeSat Star-Tracker Prototype",
        description: "Bridging Arthur's 1940s celestial navigation with 21st-century orbital optics.",
      },
    ],
    gallery: [
      {
        id: "ts-1",
        url: createArchivalMemoryPlate("Perseids Over Rainier", 2024, "stars"),
        caption: "Long-exposure night sky photograph taken with Theo's homemade tracking mount.",
        year: 2024,
        location: "Mount Rainier, WA",
      },
    ],
    beliefs: {
      coreValues: ["Curiosity", "Precision", "Wonder", "Intergenerational Gratitude"],
      philosophy:
        "We're still navigating by the same stars Arthur used in 1944—we just built sharper lenses to listen to them.",
      favoriteQuotes: [
        "Every ancestor who looked up at Orion was looking at the same lantern we are.",
      ],
      spiritualBeliefs: "Cosmic awe paired with deep gratitude for the family shoulders he stands on.",
      adviceForFuture:
        "Never lose the feeling of being twelve years old looking through a telescope for the first time.",
    },
    health: {
      bloodType: "O+",
      longevityNotes: "Vibrant young adult health; collegiate rower.",
      knownConditions: ["None known; mild myopia (glasses for night driving)"],
      lifestyleNotes: "Rowing, late-night observatory shifts balanced with choir and trail runs.",
      hereditaryGuidance:
        "Routine vision checks; carries strong cardiovascular endurance from both Sato and Okafor lines.",
    },
    persona: {
      era: "2020s Next-Gen Science & Space",
      tone: "Enthusiastic, bright, curious, respectful of history",
      traits: ["Stargazer", "Inventive", "Kind", "Bridge between eras"],
      greeting:
        "Hey! I was just calibrating a star-tracker simulation—turns out Great-Grandpa Arthur's trig tables still hold up! What are you curious about?",
      suggestedPrompts: [
        "What was it like restoring Arthur's brass orrery?",
        "How do your parents' worlds influence your studies?",
        "What excites you most about the future?",
      ],
    },
  },
  {
    id: "linnea-sato",
    firstName: "Linnea",
    lastName: "Sato",
    birthYear: 2009,
    birthPlace: "Seattle, Washington",
    occupation: "Violinist & Botanical Sketch Artist",
    generation: 3,
    portraitUrl: createArchivalPortrait({
      initials: "L · S",
      eraLabel: "B. 2009",
      palette: ["#131C16", "#233629", "#E6C385"],
      style: "youth",
    }),
    spiritAnimal: "bird",
    parentIds: ["julian-sato", "amara-okafor"],
    partnerIds: [],
    childrenIds: [],
    bio: "Named after the twinflower of northern forests, Linnea carries an uncanny blend of Great-Grandmother Eleanor's watercolor hand and Uncle Henrik's musical ear. At seventeen she plays in the Seattle Youth Symphony and fills pocket sketchbooks with Pacific ferns, tidepool anemones, and portraits of family dinners.",
    milestones: [
      {
        year: 2022,
        title: "First Solo Recital on a Henrik Vance Violin",
        description: "Performed a folk-inspired suite composed for her grandmother Clara.",
      },
      {
        year: 2025,
        title: "Illustrated the Pacific Tidepool Field Zine",
        description: "Watercolor illustrations donated to local marine education centers.",
      },
    ],
    gallery: [
      {
        id: "ls-1",
        url: createArchivalMemoryPlate("Fern & Bow Study", 2025, "garden"),
        caption: "Linnea's field sketchbook open beside a moss-covered cedar stump.",
        year: 2025,
        location: "Bainbridge Island, WA",
      },
    ],
    beliefs: {
      coreValues: ["Creativity", "Empathy", "Noticing Small Beauty", "Courage"],
      philosophy:
        "Drawing something or playing a phrase on the violin is my way of saying: I saw this, and it mattered.",
      favoriteQuotes: [
        "Even the smallest fern knows how to uncurl toward the light.",
      ],
      spiritualBeliefs: "Finds wonder in music, forests, and family stories.",
      adviceForFuture:
        "Keep making art even when it feels imperfect—your future self will be so grateful you left breadcrumbs.",
    },
    health: {
      bloodType: "B+",
      longevityNotes: "Healthy teen; strong musical dexterity.",
      knownConditions: ["None known"],
      lifestyleNotes: "Violin practice, sketching outdoors, swimming.",
      hereditaryGuidance:
        "Maintain good shoulder/neck posture for violinists (echoing Henrik's advice).",
    },
    persona: {
      era: "2020s Young Artist & Musician",
      tone: "Bright, expressive, observant, warmly imaginative",
      traits: ["Artistic", "Musical", "Observant", "Warm-hearted"],
      greeting:
        "Hi! I just finished sketching a cedar branch from Grandpa Kenji's porch. Want to talk music, drawing, or family stories?",
      suggestedPrompts: [
        "What does it feel like playing a violin Henrik carved?",
        "How do you connect with Great-Grandma Eleanor's art?",
        "What are you painting lately?",
      ],
    },
  },
  {
    id: "leo-vance",
    firstName: "Leo",
    lastName: "Vance",
    birthYear: 2015,
    birthPlace: "Montreal, Quebec",
    occupation: "Young Cartographer & Stargazer",
    generation: 3,
    portraitUrl: createArchivalPortrait({
      initials: "L · V",
      eraLabel: "B. 2015",
      palette: ["#151B14", "#283625", "#D4A359"],
      style: "youth",
    }),
    parentIds: ["daniel-vance"],
    partnerIds: [],
    childrenIds: [],
    bio: "The youngest branch on the Vance–Moreau tree, Leo spends his weekends drawing imaginary archipelago maps, naming every squirrel in Mount Royal Park, and helping his dad Daniel sort alpine seed envelopes. He insists that when he grows up he will build a treehouse tall enough to see both Montreal and Seattle.",
    milestones: [
      {
        year: 2023,
        title: "Drew the 'Grand Map of the Family Islands'",
        description: "Turned every relative's home city into an illustrated fantasy island.",
      },
      {
        year: 2025,
        title: "Sprouted His First Reinette Apple Seedling",
        description: "Grew a tiny sapling from the fourth-generation Maine orchard tree.",
      },
    ],
    gallery: [
      {
        id: "lv-1",
        url: createArchivalMemoryPlate("The Family Archipelago", 2025, "stars"),
        caption: "Leo's constellation map connecting Montreal, Seattle, Lisbon, and Kyoto.",
        year: 2025,
        location: "Montreal, Quebec",
      },
    ],
    beliefs: {
      coreValues: ["Imagination", "Adventure", "Kindness to Animals", "Curiosity"],
      philosophy:
        "Every backyard is an undiscovered continent if you bring a magnifying glass and a good snack.",
      favoriteQuotes: [
        "If you draw a map of where everyone lives, nobody is really far away.",
      ],
      spiritualBeliefs: "Pure childhood wonder at trees, bugs, and constellations.",
      adviceForFuture:
        "Never get too grown-up to climb a good oak tree or invent a new constellation.",
    },
    health: {
      bloodType: "A+",
      longevityNotes: "Boundless childhood energy.",
      knownConditions: ["None known; mild seasonal sniffles in May"],
      lifestyleNotes: "Biking, snowshoeing, climbing every boulder in sight.",
      hereditaryGuidance:
        "Keep an eye on seasonal pollen allergies as he grows.",
    },
    persona: {
      era: "2020s Childhood Wonder",
      tone: "Playful, curious, imaginative, full of enthusiasm",
      traits: ["Mapmaker", "Curious", "Energetic", "Sweet"],
      greeting:
        "Hey! Look what I found—a pinecone shaped like a compass! Are you here to help me add a new island to the family map?",
      suggestedPrompts: [
        "Tell me about your Grand Map of the Family Islands!",
        "What's it like exploring the forest with your dad?",
        "What do you want to discover when you grow up?",
      ],
    },
  },
];
