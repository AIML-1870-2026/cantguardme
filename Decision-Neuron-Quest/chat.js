/* ==============================
   Decision Neuron Quest — Chat
   Interactive multi-choice Q&A chatbot
   ============================== */

const Chat = {
  messages: [],
  isThinking: false,
  conversationHistory: [],
  questionsAsked: 0,
  maxQuestions: 4,
  currentPhase: 'initial', // 'initial', 'context', 'questions', 'done'
  decisionContext: null,
  questionQueue: [],
  questionIndex: 0,

  presets: {
    college: "I'm trying to decide which college to attend",
    pet: "I'm thinking about whether I should adopt a dog",
    roadtrip: "Should I go on a road trip this summer?",
    tech: "I'm considering upgrading my laptop",
  },

  // Two-neuron detection patterns — when a decision involves external approval/gatekeeping
  twoNeuronPatterns: [
    /\b(wife|husband|spouse|partner)\b.*\b(approv|agree|okay|ok|permission|decide|say|think|allow)\b/i,
    /\b(approv|agree|okay|ok|permission|decide|say|think|allow)\b.*\b(wife|husband|spouse|partner)\b/i,
    /\b(boss|manager|supervisor)\b.*\b(approv|agree|sign off|allow|decide)\b/i,
    /\b(approv|agree|sign off|allow|decide)\b.*\b(boss|manager|supervisor)\b/i,
    /\b(parent|mom|dad|mother|father)\b.*\b(approv|agree|allow|permission|okay|ok|let me)\b/i,
    /\b(approv|agree|allow|permission|okay|ok|let me)\b.*\b(parent|mom|dad|mother|father)\b/i,
    /\bneed.*(approval|permission|sign.?off|green light|go.?ahead)\b/i,
    /\b(someone|somebody) else.*(decide|approve|agree)\b/i,
    /\b(has to|have to|need to|must).*(approve|agree|sign off|okay|ok)\b/i,
    /\b(depends on|up to|contingent).*(someone|wife|husband|boss|parent|partner|manager)\b/i,
  ],

  // "A vs B" choice patterns — when the user is choosing between two options
  vsPatterns: [
    /\bshould i\b.+\bor\b.+/i,
    /\bbetween\b.+\band\b.+/i,
    /\bchoose between\b/i,
    /\bdeciding between\b/i,
    /\b(\w[\w\s]*?)\s+(?:vs\.?|versus)\s+(\w[\w\s]*)/i,
    /\bchoice between\b/i,
    /\bpick between\b/i,
    /\bone or the other\b/i,
    /\bcan't decide (?:between|if)\b.+\bor\b/i,
    /\btorn between\b/i,
  ],

  // Extract two options from "A or B" / "A vs B" / "between A and B" patterns
  extractVsOptions(text) {
    let match;
    // "should I [do X] or [do Y]"
    match = text.match(/should i\s+(.+?)\s+or\s+(.+?)(?:\?|$)/i);
    if (match) return { optionA: match[1].trim(), optionB: match[2].trim() };
    // "between [X] and [Y]"
    match = text.match(/between\s+(.+?)\s+and\s+(.+?)(?:\?|$)/i);
    if (match) return { optionA: match[1].trim(), optionB: match[2].trim() };
    // "[X] vs [Y]"
    match = text.match(/(.+?)\s+(?:vs\.?|versus)\s+(.+?)(?:\?|$)/i);
    if (match) return { optionA: match[1].trim(), optionB: match[2].trim() };
    // "can't decide if [X] or [Y]"
    match = text.match(/can'?t decide (?:if|whether)\s+(.+?)\s+or\s+(.+?)(?:\?|$)/i);
    if (match) return { optionA: match[1].trim(), optionB: match[2].trim() };
    // "torn between [X] and [Y]"
    match = text.match(/torn between\s+(.+?)\s+and\s+(.+?)(?:\?|$)/i);
    if (match) return { optionA: match[1].trim(), optionB: match[2].trim() };
    return null;
  },

  detectVsDecision(text) {
    return this.vsPatterns.some(pattern => pattern.test(text));
  },

  // Gatekeeper label extraction
  detectGatekeeper(text) {
    const lower = text.toLowerCase();
    if (/\b(wife|spouse)\b/i.test(lower)) return 'Wife';
    if (/\bhusband\b/i.test(lower)) return 'Husband';
    if (/\bpartner\b/i.test(lower)) return 'Partner';
    if (/\b(boss|manager|supervisor)\b/i.test(lower)) return 'Boss';
    if (/\b(mom|mother)\b/i.test(lower)) return 'Mom';
    if (/\b(dad|father)\b/i.test(lower)) return 'Dad';
    if (/\bparent/i.test(lower)) return 'Parent';
    return 'Approver';
  },

  detectTwoNeuron(text) {
    return this.twoNeuronPatterns.some(pattern => pattern.test(text));
  },

  // Templates for contextual follow-up questions before the multi-choice phase
  contextQuestions: {
    car: [
      "What kind of car are you looking at? (e.g., sedan, SUV, sports car, truck)",
      "What's your budget range for this car?",
    ],
    college: [
      "What do you want to study or what field interests you most?",
      "Are you looking at schools close to home or are you open to going far away?",
    ],
    pet: [
      "Have you had pets before, or would this be your first?",
      "Do you live in a house with a yard or an apartment?",
    ],
    roadtrip: [
      "Where are you thinking of going and for how long?",
      "Who would you be traveling with?",
    ],
    tech: [
      "What do you mainly use your current device for?",
      "What specific issues are you having with your current setup?",
    ],
    job: [
      "What industry or role is this job in?",
      "How does the salary compare to what you're making now?",
    ],
    vs: [
      "What's drawing you most toward each option?",
      "Is there a deadline or time pressure on either choice?",
    ],
    generic: [
      "What are the top two things making this decision hard for you?",
      "What would your ideal outcome look like?",
    ],
  },

  // Multi-choice question templates that adjust sliders
  multiChoiceQuestions: {
    car: [
      {
        question: "How long have you been looking to buy this car?",
        options: [
          { label: "A. Couple weeks", effect: { 'Urgency': 0.3, 'Impulse Risk': 0.8 } },
          { label: "B. 1-6 months", effect: { 'Urgency': 0.5, 'Impulse Risk': 0.5 } },
          { label: "C. 6-11 months", effect: { 'Urgency': 0.7, 'Impulse Risk': 0.3 } },
          { label: "D. Over a year", effect: { 'Urgency': 0.9, 'Impulse Risk': 0.1 } },
        ],
      },
      {
        question: "How would you feel if you had to live the rest of your life without this car?",
        options: [
          { label: "A. Regret forever", effect: { 'Desire': 0.95, 'Emotional Need': 0.9 } },
          { label: "B. Upset for a couple months", effect: { 'Desire': 0.7, 'Emotional Need': 0.6 } },
          { label: "C. Sad for a week", effect: { 'Desire': 0.4, 'Emotional Need': 0.3 } },
          { label: "D. Wouldn't care at all", effect: { 'Desire': 0.1, 'Emotional Need': 0.1 } },
        ],
      },
      {
        question: "How comfortably can you afford this car right now?",
        options: [
          { label: "A. I'd have to stretch my budget thin", effect: { 'Budget': 0.2, 'Financial Risk': 0.85 } },
          { label: "B. It's a bit of a splurge but doable", effect: { 'Budget': 0.5, 'Financial Risk': 0.5 } },
          { label: "C. I can comfortably afford it", effect: { 'Budget': 0.75, 'Financial Risk': 0.2 } },
          { label: "D. Money is no issue", effect: { 'Budget': 0.95, 'Financial Risk': 0.05 } },
        ],
      },
      {
        question: "How reliable is your current transportation?",
        options: [
          { label: "A. It's breaking down constantly", effect: { 'Need Level': 0.95, 'Current Situation': 0.1 } },
          { label: "B. It works but has issues", effect: { 'Need Level': 0.7, 'Current Situation': 0.4 } },
          { label: "C. It's fine, just old", effect: { 'Need Level': 0.4, 'Current Situation': 0.6 } },
          { label: "D. It works perfectly fine", effect: { 'Need Level': 0.15, 'Current Situation': 0.9 } },
        ],
      },
    ],
    college: [
      {
        question: "How excited are you about this specific school's programs?",
        options: [
          { label: "A. It's my absolute dream school", effect: { 'Academics': 0.95, 'Passion': 0.9 } },
          { label: "B. Really excited about it", effect: { 'Academics': 0.75, 'Passion': 0.7 } },
          { label: "C. It's decent but not top choice", effect: { 'Academics': 0.5, 'Passion': 0.4 } },
          { label: "D. Not sure it's the right fit", effect: { 'Academics': 0.25, 'Passion': 0.2 } },
        ],
      },
      {
        question: "How big of a concern is the cost?",
        options: [
          { label: "A. It's a dealbreaker if too expensive", effect: { 'Cost': 0.9, 'Financial Stress': 0.9 } },
          { label: "B. Significant concern", effect: { 'Cost': 0.7, 'Financial Stress': 0.65 } },
          { label: "C. Some concern but manageable", effect: { 'Cost': 0.4, 'Financial Stress': 0.35 } },
          { label: "D. Cost isn't really an issue", effect: { 'Cost': 0.1, 'Financial Stress': 0.1 } },
        ],
      },
      {
        question: "How important is being near family and friends?",
        options: [
          { label: "A. I can't imagine being far away", effect: { 'Location': 0.2, 'Homesickness Risk': 0.9 } },
          { label: "B. I'd prefer staying close", effect: { 'Location': 0.4, 'Homesickness Risk': 0.6 } },
          { label: "C. I'm open to going farther", effect: { 'Location': 0.7, 'Homesickness Risk': 0.3 } },
          { label: "D. I want to go far and explore", effect: { 'Location': 0.9, 'Homesickness Risk': 0.1 } },
        ],
      },
      {
        question: "What matters more to you — campus social life or career prospects?",
        options: [
          { label: "A. Definitely social life", effect: { 'Social Life': 0.9, 'Career Prospects': 0.3 } },
          { label: "B. Slightly more social", effect: { 'Social Life': 0.7, 'Career Prospects': 0.5 } },
          { label: "C. Slightly more career", effect: { 'Social Life': 0.5, 'Career Prospects': 0.7 } },
          { label: "D. Definitely career prospects", effect: { 'Social Life': 0.3, 'Career Prospects': 0.9 } },
        ],
      },
    ],
    pet: [
      {
        question: "How many hours a day would you be home to care for a pet?",
        options: [
          { label: "A. Less than 4 hours", effect: { 'Time Available': 0.15, 'Care Capacity': 0.2 } },
          { label: "B. 4-8 hours", effect: { 'Time Available': 0.5, 'Care Capacity': 0.5 } },
          { label: "C. 8-12 hours", effect: { 'Time Available': 0.75, 'Care Capacity': 0.75 } },
          { label: "D. I work from home / always around", effect: { 'Time Available': 0.95, 'Care Capacity': 0.9 } },
        ],
      },
      {
        question: "How would you feel coming home to a pet every day?",
        options: [
          { label: "A. It would make my whole day better", effect: { 'Loneliness': 0.9, 'Emotional Need': 0.9 } },
          { label: "B. I'd really enjoy it", effect: { 'Loneliness': 0.7, 'Emotional Need': 0.65 } },
          { label: "C. It'd be nice sometimes", effect: { 'Loneliness': 0.4, 'Emotional Need': 0.4 } },
          { label: "D. I'm not sure I need that", effect: { 'Loneliness': 0.15, 'Emotional Need': 0.15 } },
        ],
      },
      {
        question: "How ready are you for the financial commitment? (vet bills, food, etc.)",
        options: [
          { label: "A. I have a dedicated pet fund", effect: { 'Budget': 0.9, 'Financial Readiness': 0.95 } },
          { label: "B. I can manage it comfortably", effect: { 'Budget': 0.7, 'Financial Readiness': 0.7 } },
          { label: "C. It would be tight but possible", effect: { 'Budget': 0.4, 'Financial Readiness': 0.35 } },
          { label: "D. I haven't really thought about costs", effect: { 'Budget': 0.15, 'Financial Readiness': 0.1 } },
        ],
      },
      {
        question: "Does anyone in your household have pet allergies?",
        options: [
          { label: "A. No allergies at all", effect: { 'Allergies': 0.05, 'Health Risk': 0.05 } },
          { label: "B. Mild allergies, manageable", effect: { 'Allergies': 0.4, 'Health Risk': 0.35 } },
          { label: "C. Moderate allergies", effect: { 'Allergies': 0.7, 'Health Risk': 0.65 } },
          { label: "D. Severe allergies", effect: { 'Allergies': 0.95, 'Health Risk': 0.9 } },
        ],
      },
    ],
    roadtrip: [
      {
        question: "How much vacation time / free days do you have right now?",
        options: [
          { label: "A. Basically none, would need to call in", effect: { 'Time Off': 0.1, 'Schedule Risk': 0.9 } },
          { label: "B. A few days I could squeeze out", effect: { 'Time Off': 0.4, 'Schedule Risk': 0.55 } },
          { label: "C. Enough for a solid trip", effect: { 'Time Off': 0.7, 'Schedule Risk': 0.25 } },
          { label: "D. Totally free, no obligations", effect: { 'Time Off': 0.95, 'Schedule Risk': 0.05 } },
        ],
      },
      {
        question: "How's your sense of adventure right now?",
        options: [
          { label: "A. I'm DYING to get out there", effect: { 'Adventure': 0.95, 'Excitement': 0.95 } },
          { label: "B. Pretty excited about it", effect: { 'Adventure': 0.75, 'Excitement': 0.7 } },
          { label: "C. Could go either way", effect: { 'Adventure': 0.45, 'Excitement': 0.4 } },
          { label: "D. Meh, I'd rather stay home", effect: { 'Adventure': 0.15, 'Excitement': 0.15 } },
        ],
      },
      {
        question: "How tight is your budget for this trip?",
        options: [
          { label: "A. Very tight, camping and ramen", effect: { 'Budget': 0.2, 'Financial Comfort': 0.15 } },
          { label: "B. Moderate, some treats allowed", effect: { 'Budget': 0.5, 'Financial Comfort': 0.5 } },
          { label: "C. Comfortable, can enjoy it fully", effect: { 'Budget': 0.8, 'Financial Comfort': 0.8 } },
          { label: "D. Sky's the limit", effect: { 'Budget': 0.95, 'Financial Comfort': 0.95 } },
        ],
      },
      {
        question: "What responsibilities would you be leaving behind?",
        options: [
          { label: "A. Major deadlines and commitments", effect: { 'Responsibilities': 0.9, 'Guilt Risk': 0.85 } },
          { label: "B. Some things that could wait", effect: { 'Responsibilities': 0.6, 'Guilt Risk': 0.5 } },
          { label: "C. Nothing that can't be handled", effect: { 'Responsibilities': 0.3, 'Guilt Risk': 0.2 } },
          { label: "D. Absolutely nothing", effect: { 'Responsibilities': 0.05, 'Guilt Risk': 0.05 } },
        ],
      },
    ],
    tech: [
      {
        question: "How often does your current device frustrate you?",
        options: [
          { label: "A. Every single day", effect: { 'Current Speed': 0.1, 'Frustration': 0.95 } },
          { label: "B. A few times a week", effect: { 'Current Speed': 0.35, 'Frustration': 0.65 } },
          { label: "C. Occasionally", effect: { 'Current Speed': 0.6, 'Frustration': 0.35 } },
          { label: "D. Rarely or never", effect: { 'Current Speed': 0.85, 'Frustration': 0.1 } },
        ],
      },
      {
        question: "How critical is this device for your work or school?",
        options: [
          { label: "A. It's essential — I can't function without it", effect: { 'Need Level': 0.95, 'Productivity Impact': 0.9 } },
          { label: "B. Very important for daily tasks", effect: { 'Need Level': 0.75, 'Productivity Impact': 0.7 } },
          { label: "C. Useful but not critical", effect: { 'Need Level': 0.45, 'Productivity Impact': 0.4 } },
          { label: "D. Mostly for entertainment", effect: { 'Need Level': 0.2, 'Productivity Impact': 0.15 } },
        ],
      },
      {
        question: "How do you feel about the price of the upgrade?",
        options: [
          { label: "A. It's a major financial stretch", effect: { 'Budget': 0.15, 'Financial Strain': 0.85 } },
          { label: "B. Pricey but I can manage", effect: { 'Budget': 0.45, 'Financial Strain': 0.5 } },
          { label: "C. Reasonable for what I'd get", effect: { 'Budget': 0.75, 'Financial Strain': 0.25 } },
          { label: "D. Totally within budget", effect: { 'Budget': 0.9, 'Financial Strain': 0.1 } },
        ],
      },
      {
        question: "Are there specific new features you're excited about?",
        options: [
          { label: "A. Yes, game-changing features I need", effect: { 'New Features': 0.95, 'Excitement': 0.9 } },
          { label: "B. Some cool improvements", effect: { 'New Features': 0.7, 'Excitement': 0.6 } },
          { label: "C. Marginal upgrades", effect: { 'New Features': 0.35, 'Excitement': 0.3 } },
          { label: "D. Not really, just want something newer", effect: { 'New Features': 0.15, 'Excitement': 0.15 } },
        ],
      },
    ],
    job: [
      {
        question: "How does the salary compare to your expectations?",
        options: [
          { label: "A. Way above what I expected", effect: { 'Salary': 0.95, 'Financial Motivation': 0.9 } },
          { label: "B. Good, meets my expectations", effect: { 'Salary': 0.7, 'Financial Motivation': 0.65 } },
          { label: "C. Slightly below what I'd like", effect: { 'Salary': 0.4, 'Financial Motivation': 0.35 } },
          { label: "D. Significantly less than I want", effect: { 'Salary': 0.15, 'Financial Motivation': 0.1 } },
        ],
      },
      {
        question: "How passionate are you about this type of work?",
        options: [
          { label: "A. It's my dream job", effect: { 'Passion': 0.95, 'Motivation': 0.9 } },
          { label: "B. I'm genuinely interested", effect: { 'Passion': 0.7, 'Motivation': 0.7 } },
          { label: "C. It's okay, not my passion", effect: { 'Passion': 0.4, 'Motivation': 0.4 } },
          { label: "D. Just need a paycheck", effect: { 'Passion': 0.1, 'Motivation': 0.15 } },
        ],
      },
      {
        question: "How is the work-life balance at this company?",
        options: [
          { label: "A. Amazing — very flexible", effect: { 'Work-Life': 0.9, 'Burnout Risk': 0.1 } },
          { label: "B. Pretty good", effect: { 'Work-Life': 0.7, 'Burnout Risk': 0.3 } },
          { label: "C. Average, some long hours expected", effect: { 'Work-Life': 0.4, 'Burnout Risk': 0.55 } },
          { label: "D. Known for being demanding", effect: { 'Work-Life': 0.15, 'Burnout Risk': 0.85 } },
        ],
      },
      {
        question: "What's the growth potential here?",
        options: [
          { label: "A. Clear path to advancement", effect: { 'Growth': 0.9, 'Career Value': 0.9 } },
          { label: "B. Good opportunities available", effect: { 'Growth': 0.7, 'Career Value': 0.7 } },
          { label: "C. Some room to grow", effect: { 'Growth': 0.45, 'Career Value': 0.45 } },
          { label: "D. Seems like a dead end", effect: { 'Growth': 0.1, 'Career Value': 0.15 } },
        ],
      },
    ],
    vs: [
      {
        question: "How excited are you about {optionA}?",
        options: [
          { label: "A. Extremely excited", effect: { 'Excitement A': 0.95, 'Gut Feeling A': 0.9 } },
          { label: "B. Pretty interested", effect: { 'Excitement A': 0.7, 'Gut Feeling A': 0.65 } },
          { label: "C. Somewhat interested", effect: { 'Excitement A': 0.4, 'Gut Feeling A': 0.35 } },
          { label: "D. Not very excited", effect: { 'Excitement A': 0.15, 'Gut Feeling A': 0.15 } },
        ],
      },
      {
        question: "How practical or affordable is {optionA}?",
        options: [
          { label: "A. Very practical and affordable", effect: { 'Practicality A': 0.9, 'Cost A': 0.9 } },
          { label: "B. Reasonable", effect: { 'Practicality A': 0.65, 'Cost A': 0.65 } },
          { label: "C. A bit of a stretch", effect: { 'Practicality A': 0.35, 'Cost A': 0.35 } },
          { label: "D. Impractical or expensive", effect: { 'Practicality A': 0.1, 'Cost A': 0.15 } },
        ],
      },
      {
        question: "How excited are you about {optionB}?",
        options: [
          { label: "A. Extremely excited", effect: { 'Excitement B': 0.95, 'Gut Feeling B': 0.9 } },
          { label: "B. Pretty interested", effect: { 'Excitement B': 0.7, 'Gut Feeling B': 0.65 } },
          { label: "C. Somewhat interested", effect: { 'Excitement B': 0.4, 'Gut Feeling B': 0.35 } },
          { label: "D. Not very excited", effect: { 'Excitement B': 0.15, 'Gut Feeling B': 0.15 } },
        ],
      },
      {
        question: "How practical or affordable is {optionB}?",
        options: [
          { label: "A. Very practical and affordable", effect: { 'Practicality B': 0.9, 'Cost B': 0.9 } },
          { label: "B. Reasonable", effect: { 'Practicality B': 0.65, 'Cost B': 0.65 } },
          { label: "C. A bit of a stretch", effect: { 'Practicality B': 0.35, 'Cost B': 0.35 } },
          { label: "D. Impractical or expensive", effect: { 'Practicality B': 0.1, 'Cost B': 0.15 } },
        ],
      },
      {
        question: "Which would you regret missing out on more?",
        options: [
          { label: "A. Definitely {optionA}", effect: { 'Regret A': 0.9, 'Regret B': 0.2 } },
          { label: "B. Slightly {optionA}", effect: { 'Regret A': 0.65, 'Regret B': 0.4 } },
          { label: "C. Slightly {optionB}", effect: { 'Regret A': 0.4, 'Regret B': 0.65 } },
          { label: "D. Definitely {optionB}", effect: { 'Regret A': 0.2, 'Regret B': 0.9 } },
        ],
      },
      {
        question: "How time-sensitive is this? Could you do both eventually?",
        options: [
          { label: "A. Must choose now, can only do one", effect: { 'Urgency': 0.9, 'Time Pressure': 0.9 } },
          { label: "B. Soon-ish, but no real rush", effect: { 'Urgency': 0.6, 'Time Pressure': 0.55 } },
          { label: "C. No rush, could do both over time", effect: { 'Urgency': 0.25, 'Time Pressure': 0.2 } },
          { label: "D. Could easily do both whenever", effect: { 'Urgency': 0.1, 'Time Pressure': 0.05 } },
        ],
      },
    ],
    generic: [
      {
        question: "How long have you been thinking about this decision?",
        options: [
          { label: "A. Just came up recently", effect: { 'Urgency': 0.3, 'Impulse Risk': 0.7 } },
          { label: "B. A few weeks", effect: { 'Urgency': 0.5, 'Impulse Risk': 0.4 } },
          { label: "C. Several months", effect: { 'Urgency': 0.7, 'Impulse Risk': 0.2 } },
          { label: "D. It's been on my mind for ages", effect: { 'Urgency': 0.9, 'Impulse Risk': 0.1 } },
        ],
      },
      {
        question: "How would you feel if you had to live without this forever?",
        options: [
          { label: "A. Regret forever", effect: { 'Desire': 0.95, 'Emotional Weight': 0.9 } },
          { label: "B. Upset for a couple months", effect: { 'Desire': 0.65, 'Emotional Weight': 0.6 } },
          { label: "C. Sad for a week", effect: { 'Desire': 0.35, 'Emotional Weight': 0.3 } },
          { label: "D. Wouldn't care at all", effect: { 'Desire': 0.1, 'Emotional Weight': 0.1 } },
        ],
      },
      {
        question: "What's the biggest risk if you go for it?",
        options: [
          { label: "A. Major financial or life consequence", effect: { 'Risk': 0.9, 'Anxiety': 0.85 } },
          { label: "B. Moderate setback possible", effect: { 'Risk': 0.6, 'Anxiety': 0.55 } },
          { label: "C. Minor inconvenience at worst", effect: { 'Risk': 0.3, 'Anxiety': 0.25 } },
          { label: "D. Basically no downside", effect: { 'Risk': 0.05, 'Anxiety': 0.05 } },
        ],
      },
      {
        question: "How much effort would this require from you?",
        options: [
          { label: "A. A massive commitment", effect: { 'Effort': 0.9, 'Energy Cost': 0.85 } },
          { label: "B. Significant but manageable", effect: { 'Effort': 0.65, 'Energy Cost': 0.6 } },
          { label: "C. Moderate effort", effect: { 'Effort': 0.4, 'Energy Cost': 0.35 } },
          { label: "D. Barely any effort", effect: { 'Effort': 0.1, 'Energy Cost': 0.1 } },
        ],
      },
    ],
  },

  // Multi-choice questions for the second neuron (gatekeeper/approval)
  neuron2Questions: [
    {
      question: "How likely is {gatekeeper} to approve this?",
      options: [
        { label: "A. Very likely — they're on board", effect: { 'Approval Likelihood': 0.9, 'Gatekeeper Mood': 0.85 } },
        { label: "B. Probably, with some convincing", effect: { 'Approval Likelihood': 0.65, 'Gatekeeper Mood': 0.6 } },
        { label: "C. It's a toss-up", effect: { 'Approval Likelihood': 0.4, 'Gatekeeper Mood': 0.4 } },
        { label: "D. Unlikely — they'll push back", effect: { 'Approval Likelihood': 0.15, 'Gatekeeper Mood': 0.2 } },
      ],
    },
    {
      question: "How strong is {gatekeeper}'s influence on this decision?",
      options: [
        { label: "A. Absolute veto power", effect: { 'Veto Power': 0.95, 'Autonomy': 0.1 } },
        { label: "B. Very influential", effect: { 'Veto Power': 0.75, 'Autonomy': 0.3 } },
        { label: "C. Some influence", effect: { 'Veto Power': 0.45, 'Autonomy': 0.6 } },
        { label: "D. I could go ahead anyway", effect: { 'Veto Power': 0.15, 'Autonomy': 0.85 } },
      ],
    },
  ],

  init() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');

    sendBtn.addEventListener('click', () => this.sendMessage());

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 80) + 'px';
    });

    document.querySelectorAll('.quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = this.presets[btn.dataset.preset];
        if (preset) {
          document.getElementById('chat-input').value = preset;
          this.sendMessage();
          document.getElementById('quick-starts').style.display = 'none';
        }
      });
    });
  },

  async sendMessage(overrideText) {
    const input = document.getElementById('chat-input');
    const text = overrideText || input.value.trim();
    if (!text || this.isThinking) return;

    if (!overrideText) {
      input.value = '';
      input.style.height = 'auto';
    }

    Audio.playSend();
    this.addMessageToUI(text, 'user');
    this.conversationHistory.push({ role: 'user', content: text });
    this.setThinking(true);

    try {
      await this.processUserInput(text);
    } catch (error) {
      console.error('Chat error:', error);
      this.addMessageToUI('Something went wrong. Please try again.', 'bot');
    }

    this.setThinking(false);
  },

  detectCategory(text) {
    const lower = text.toLowerCase();

    // Score each category — specific terms get priority over generic ones
    const categories = {
      tech:     { score: 0, specific: ['laptop', 'computer', 'phone', 'iphone', 'macbook', 'ipad', 'tablet', 'gpu', 'pc build', 'camera', 'console', 'playstation', 'xbox', 'nintendo', 'monitor', 'headphones'], general: ['tech', 'upgrade', 'device', 'gadget'] },
      college:  { score: 0, specific: ['college', 'university', 'school', 'degree', 'major', 'campus'], general: ['enroll', 'tuition'] },
      pet:      { score: 0, specific: ['dog', 'puppy', 'cat', 'kitten', 'pet', 'hamster', 'fish tank'], general: ['adopt', 'rescue'] },
      roadtrip: { score: 0, specific: ['road trip', 'roadtrip', 'vacation', 'travel', 'cancun', 'hawaii', 'europe', 'paris', 'tokyo', 'bali', 'caribbean', 'cruise', 'mexico', 'beach trip', 'spring break', 'backpacking'], general: ['trip', 'drive cross country', 'flight', 'getaway', 'destination'] },
      car:      { score: 0, specific: ['car', 'vehicle', 'truck', 'suv', 'sedan', 'motorcycle', 'tesla', 'honda', 'toyota', 'ford'], general: ['buy a car', 'new ride', 'dealership'] },
      job:      { score: 0, specific: ['job', 'career', 'job offer', 'position', 'employer'], general: ['quit', 'resign', 'work', 'salary offer'] },
    };

    for (const [cat, data] of Object.entries(categories)) {
      for (const term of data.specific) {
        if (lower.includes(term)) data.score += 3;
      }
      for (const term of data.general) {
        if (lower.includes(term)) data.score += 1;
      }
    }

    let best = 'generic';
    let bestScore = 0;
    for (const [cat, data] of Object.entries(categories)) {
      if (data.score > bestScore) {
        bestScore = data.score;
        best = cat;
      }
    }
    return best;
  },

  async processUserInput(text) {
    const hasNetwork = window.NeuronApp?.state?.network?.inputs?.length > 0;

    await new Promise(r => setTimeout(r, 600 + Math.random() * 800));

    if (!hasNetwork && this.currentPhase === 'initial') {
      // First message — detect category, detect vs decision, detect approval gatekeeper
      const isVsDecision = this.detectVsDecision(text);
      const vsOptions = isVsDecision ? this.extractVsOptions(text) : null;
      const category = isVsDecision ? 'vs' : this.detectCategory(text);
      const isTwoNeuron = isVsDecision || this.detectTwoNeuron(text);
      const gatekeeper = (!isVsDecision && isTwoNeuron) ? this.detectGatekeeper(text) : null;

      this.decisionContext = {
        category,
        userDescription: text,
        contextAnswers: [],
        twoNeuron: isTwoNeuron,
        gatekeeper,
        vsDecision: isVsDecision,
        vsOptions,
      };
      this.currentPhase = 'context';
      this.questionIndex = 0;

      const contextQs = this.contextQuestions[category] || this.contextQuestions.generic;
      this.questionQueue = contextQs;

      Audio.playReceive();
      let greeting = this.getContextGreeting(category, text);
      if (isVsDecision && vsOptions) {
        greeting += ` I'll model this as a two-neuron comparison — one for "${vsOptions.optionA}" and one for "${vsOptions.optionB}"!`;
      } else if (isTwoNeuron && gatekeeper) {
        greeting += ` I noticed ${gatekeeper} needs to approve — I'll model this as a two-neuron chain!`;
      }
      this.addMessageToUI(greeting, 'bot');

      // Ask first context question after a pause
      await new Promise(r => setTimeout(r, 1200));
      Audio.playReceive();
      this.addMessageToUI(this.questionQueue[0], 'bot');

    } else if (this.currentPhase === 'context') {
      // Gathering context answers
      this.decisionContext.contextAnswers.push(text);
      this.questionIndex++;

      if (this.questionIndex < this.questionQueue.length) {
        // Ask next context question
        await new Promise(r => setTimeout(r, 800));
        Audio.playReceive();
        this.addMessageToUI(this.questionQueue[this.questionIndex], 'bot');
      } else {
        // Done with context — build the network and start multi-choice
        const config = this.buildNetworkFromContext();
        if (config && window.NeuronApp) {
          Audio.playNetworkBuild();
          window.NeuronApp.updateNetwork(config);
        }

        await new Promise(r => setTimeout(r, 600));
        Audio.playReceive();
        const isTwoNeuron = this.decisionContext.twoNeuron;
        const isVs = this.decisionContext.vsDecision;
        let buildMsg;
        if (isVs && this.decisionContext.vsOptions) {
          const opts = this.decisionContext.vsOptions;
          buildMsg = `I've built a two-neuron comparison — Neuron 1 evaluates "${opts.optionA}" and Neuron 2 evaluates "${opts.optionB}". Let me ask some questions to fine-tune the weights...`;
        } else if (isTwoNeuron) {
          buildMsg = "I've built a two-neuron chain — Neuron 1 evaluates your personal preference, and Neuron 2 factors in approval. Let me fine-tune the weights...";
        } else {
          buildMsg = "Great, I've built your decision network! Now let me ask a few questions to fine-tune the weights...";
        }
        this.addMessageToUI(buildMsg, 'bot');

        // Transition to multi-choice phase
        this.currentPhase = 'questions';
        this.questionIndex = 0;
        const category = this.decisionContext.category;
        let questions = this.multiChoiceQuestions[category] || this.multiChoiceQuestions.generic;

        // Replace {optionA}/{optionB} placeholders for vs decisions
        if (this.decisionContext.vsDecision && this.decisionContext.vsOptions) {
          const opts = this.decisionContext.vsOptions;
          questions = questions.map(q => ({
            ...q,
            question: q.question.replace(/\{optionA\}/g, opts.optionA).replace(/\{optionB\}/g, opts.optionB),
            options: q.options.map(opt => ({
              ...opt,
              label: opt.label.replace(/\{optionA\}/g, opts.optionA).replace(/\{optionB\}/g, opts.optionB),
            })),
          }));
        }

        // Append neuron2 questions if approval-style two-neuron chain (not vs)
        if (isTwoNeuron && !this.decisionContext.vsDecision) {
          const gatekeeper = this.decisionContext.gatekeeper || 'Approver';
          const n2Qs = this.neuron2Questions.map(q => ({
            ...q,
            question: q.question.replace(/\{gatekeeper\}/g, gatekeeper),
            options: q.options.map(opt => ({ ...opt })),
            isNeuron2: true,
          }));
          questions = [...questions, ...n2Qs];
        }

        this.questionQueue = questions;
        this.questionsAsked = 0;

        // Ask first multi-choice question
        await new Promise(r => setTimeout(r, 1200));
        this.askMultipleChoice();
      }

    } else if (this.currentPhase === 'questions') {
      // This shouldn't happen normally since MC buttons handle it, but handle typed responses
      Audio.playReceive();
      this.addMessageToUI("Please select one of the options above to continue!", 'bot');

    } else if (this.currentPhase === 'done' || hasNetwork) {
      // Modification mode — handle adjustments
      const result = this.handleModification(text);
      await new Promise(r => setTimeout(r, 600));
      Audio.playReceive();
      this.addMessageToUI(result.chatText, 'bot');
      if (result.config && window.NeuronApp) {
        Audio.playNetworkBuild();
        window.NeuronApp.updateNetwork(result.config);
      }
    }
  },

  getContextGreeting(category, userText) {
    const greetings = {
      car: "A car purchase — that's a big one! Let me understand your situation better before we model this decision.",
      college: "Choosing a college is one of the biggest decisions you'll make! Let me learn more about what you're looking for.",
      pet: "Thinking about a furry friend! Let me ask you a couple things to understand your situation.",
      roadtrip: "Sounds like an adventure is calling! Let me learn a bit more about what you're planning.",
      tech: "A tech decision — let me dig into the details first.",
      job: "Career moves are important! Let me understand the full picture.",
      vs: "A tough choice between two options!",
      generic: "Interesting decision! Let me understand the context better before we break it down.",
    };
    return greetings[category] || greetings.generic;
  },

  buildNetworkFromContext() {
    const cat = this.decisionContext.category;

    const configs = {
      car: {
        title: 'Should I Buy This Car?',
        emoji: '\uD83D\uDE97',
        inputs: [
          { name: 'Budget', weight: -0.6, value: 0.5, description: 'Financial readiness' },
          { name: 'Need Level', weight: 0.8, value: 0.5, description: 'How much you need it' },
          { name: 'Desire', weight: 0.7, value: 0.5, description: 'How much you want it' },
          { name: 'Urgency', weight: 0.5, value: 0.5, description: 'Time pressure' },
          { name: 'Impulse Risk', weight: -0.6, value: 0.5, description: 'Risk of impulse buying' },
        ],
        bias: { value: 0, label: 'Neutral' },
        yesLabel: 'Buy it!',
        noLabel: 'Hold off',
        activationFunction: 'sigmoid',
      },
      college: {
        title: 'Which College to Choose?',
        emoji: '\uD83C\uDF93',
        inputs: [
          { name: 'Academics', weight: 0.85, value: 0.5, description: 'Program quality' },
          { name: 'Cost', weight: -0.7, value: 0.5, description: 'Tuition and expenses' },
          { name: 'Location', weight: 0.5, value: 0.5, description: 'Distance and setting' },
          { name: 'Social Life', weight: 0.4, value: 0.5, description: 'Campus culture' },
          { name: 'Career Prospects', weight: 0.75, value: 0.5, description: 'Job placement' },
        ],
        bias: { value: 0.1, label: 'Neutral' },
        yesLabel: 'Go for it!',
        noLabel: 'Keep looking',
        activationFunction: 'sigmoid',
      },
      pet: {
        title: 'Should I Adopt a Pet?',
        emoji: '\uD83D\uDC36',
        inputs: [
          { name: 'Time Available', weight: 0.8, value: 0.5, description: 'Free time for care' },
          { name: 'Living Space', weight: 0.6, value: 0.5, description: 'Size of your home' },
          { name: 'Budget', weight: 0.5, value: 0.5, description: 'Financial readiness' },
          { name: 'Allergies', weight: -0.7, value: 0.3, description: 'Allergy severity' },
          { name: 'Loneliness', weight: 0.9, value: 0.6, description: 'Companionship desire' },
        ],
        bias: { value: 0.3, label: 'Slight lean yes' },
        yesLabel: 'Adopt!',
        noLabel: 'Wait',
        activationFunction: 'sigmoid',
      },
      roadtrip: {
        title: 'Should I Take This Road Trip?',
        emoji: '\uD83D\uDE97',
        inputs: [
          { name: 'Time Off', weight: 0.7, value: 0.5, description: 'Available vacation days' },
          { name: 'Budget', weight: -0.5, value: 0.5, description: 'Travel costs' },
          { name: 'Adventure', weight: 0.8, value: 0.7, description: 'Desire for experiences' },
          { name: 'Responsibilities', weight: -0.6, value: 0.4, description: 'Obligations' },
        ],
        bias: { value: 0.2, label: 'Slight wanderlust' },
        yesLabel: 'Hit the road!',
        noLabel: 'Stay home',
        activationFunction: 'sigmoid',
      },
      tech: {
        title: 'Should I Upgrade My Tech?',
        emoji: '\uD83D\uDCBB',
        inputs: [
          { name: 'Current Speed', weight: -0.6, value: 0.3, description: 'Current device performance' },
          { name: 'Budget', weight: -0.5, value: 0.5, description: 'Can you afford it' },
          { name: 'Need Level', weight: 0.8, value: 0.6, description: 'How much you need it' },
          { name: 'New Features', weight: 0.4, value: 0.5, description: 'New capabilities' },
        ],
        bias: { value: -0.2, label: 'Slight caution' },
        yesLabel: 'Upgrade!',
        noLabel: 'Keep current',
        activationFunction: 'sigmoid',
      },
      job: {
        title: 'Should I Take This Job?',
        emoji: '\uD83D\uDCBC',
        inputs: [
          { name: 'Salary', weight: 0.7, value: 0.5, description: 'Pay and benefits' },
          { name: 'Growth', weight: 0.8, value: 0.5, description: 'Career advancement' },
          { name: 'Work-Life', weight: 0.6, value: 0.5, description: 'Balance and flexibility' },
          { name: 'Passion', weight: 0.5, value: 0.5, description: 'Interest in the work' },
        ],
        bias: { value: 0, label: 'Neutral' },
        yesLabel: 'Take it!',
        noLabel: 'Pass',
        activationFunction: 'sigmoid',
      },
      vs: {
        title: `${this.decisionContext.vsOptions?.optionA || 'Option A'} vs ${this.decisionContext.vsOptions?.optionB || 'Option B'}`,
        emoji: '\u2696\uFE0F',
        inputs: [
          { name: 'Excitement A', weight: 0.8, value: 0.5, description: `How excited you are about ${this.decisionContext.vsOptions?.optionA || 'Option A'}` },
          { name: 'Practicality A', weight: 0.6, value: 0.5, description: `How practical ${this.decisionContext.vsOptions?.optionA || 'Option A'} is` },
          { name: 'Regret A', weight: 0.7, value: 0.5, description: `Fear of missing ${this.decisionContext.vsOptions?.optionA || 'Option A'}` },
        ],
        bias: { value: 0, label: 'Neutral' },
        yesLabel: this.decisionContext.vsOptions?.optionA || 'Option A',
        noLabel: this.decisionContext.vsOptions?.optionB || 'Option B',
        activationFunction: 'sigmoid',
      },
      generic: {
        title: 'Decision Analysis',
        emoji: '\uD83E\uDD14',
        inputs: [
          { name: 'Benefit', weight: 0.7, value: 0.5, description: 'Potential upside' },
          { name: 'Risk', weight: -0.6, value: 0.4, description: 'Potential downside' },
          { name: 'Effort', weight: -0.4, value: 0.5, description: 'Required effort' },
          { name: 'Desire', weight: 0.8, value: 0.6, description: 'How much you want it' },
        ],
        bias: { value: 0, label: 'Neutral' },
        yesLabel: 'Do it!',
        noLabel: "Don't",
        activationFunction: 'sigmoid',
      },
    };

    const config = configs[cat] || configs.generic;

    // If two-neuron chain, add neuron2 config
    if (this.decisionContext.twoNeuron) {
      if (this.decisionContext.vsDecision && this.decisionContext.vsOptions) {
        // "A vs B" comparison — Neuron 1 evaluates Option A, Neuron 2 evaluates Option B
        const opts = this.decisionContext.vsOptions;
        config.twoNeuron = true;
        config.neuron2 = {
          label: `${opts.optionB} Score`,
          inputs: [
            { name: 'Excitement B', weight: 0.8, value: 0.5, description: `How excited you are about ${opts.optionB}` },
            { name: 'Practicality B', weight: 0.6, value: 0.5, description: `How practical ${opts.optionB} is` },
            { name: 'Regret B', weight: 0.7, value: 0.5, description: `Fear of missing ${opts.optionB}` },
          ],
          bias: { value: 0, label: 'Neutral' },
          chainWeight: -0.8,
        };
      } else {
        const gatekeeper = this.decisionContext.gatekeeper || 'Approver';
        config.twoNeuron = true;
        config.neuron2 = {
          label: `${gatekeeper} Approval`,
          inputs: [
            { name: 'Approval Likelihood', weight: 0.8, value: 0.5, description: `How likely ${gatekeeper} is to approve` },
            { name: 'Veto Power', weight: -0.7, value: 0.5, description: `${gatekeeper}'s influence over the decision` },
          ],
          bias: { value: -0.3, label: 'Cautious' },
          chainWeight: 0.7,
        };
      }
    }

    return config;
  },

  askMultipleChoice() {
    if (this.questionIndex >= this.questionQueue.length) {
      // All questions asked — give final summary
      this.currentPhase = 'done';
      Audio.playReceive();
      const network = window.NeuronApp.state.network;
      let output, summaryExtra = '';
      if (network.twoNeuron && network.neuron2) {
        const result = Utils.twoNeuronForward(network);
        output = result.output;
        const n1Pct = (result.a1 * 100).toFixed(0);
        if (this.decisionContext?.vsDecision) {
          // For vs decisions: a1 = Option A score, output = final combined. Compute Option B neuron score separately.
          const n2 = network.neuron2 || { inputs: [], bias: { value: 0 } };
          let n2z = n2.bias.value;
          for (const inp of (n2.inputs || [])) { n2z += inp.weight * inp.value; }
          const n2Score = Utils.activate(n2z, network.activationFunction);
          const n2Pct = (n2Score * 100).toFixed(0);
          summaryExtra = ` Neuron 1 scored ${n1Pct}% for "${network.yesLabel}", Neuron 2 scored ${n2Pct}% for "${network.noLabel}".`;
        } else {
          summaryExtra = ` Neuron 1 (your preference) scored ${n1Pct}%, then Neuron 2 factored in approval.`;
        }
      } else {
        output = Utils.forwardPass(network).output;
      }
      const isYes = output > 0.5;
      const pct = (output * 100).toFixed(0);
      const verdict = isYes ? network.yesLabel : network.noLabel;

      this.addMessageToUI(
        `Analysis complete! Based on your responses, the network says: ${verdict} (${pct}% confidence).${summaryExtra} You can still adjust the sliders to explore different scenarios, or tell me if anything has changed.`,
        'bot'
      );
      Audio.playMilestone();
      return;
    }

    const q = this.questionQueue[this.questionIndex];
    Audio.playReceive();
    this.addMultipleChoiceToUI(q);
  },

  addMultipleChoiceToUI(questionData) {
    const container = document.getElementById('chat-messages');

    // Question message
    const msgDiv = document.createElement('div');
    msgDiv.className = 'message bot-message';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = '<div class="neuron-icon small"></div>';
    msgDiv.appendChild(avatar);

    const content = document.createElement('div');
    content.className = 'message-content mc-question';
    content.innerHTML = `<p class="mc-question-text">${this.escapeHtml(questionData.question)}</p>`;

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'mc-options';

    questionData.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'mc-option-btn';
      btn.textContent = opt.label;
      btn.addEventListener('click', () => {
        // Disable all buttons in this set
        optionsDiv.querySelectorAll('.mc-option-btn').forEach(b => {
          b.disabled = true;
          b.classList.add('mc-disabled');
        });
        btn.classList.add('mc-selected');
        btn.classList.remove('mc-disabled');

        Audio.playClick();
        this.handleMultipleChoiceAnswer(questionData, opt);
      });
      optionsDiv.appendChild(btn);
    });

    content.appendChild(optionsDiv);
    msgDiv.appendChild(content);
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  },

  handleMultipleChoiceAnswer(questionData, selectedOption) {
    // Show user's selection as a message
    this.addMessageToUI(selectedOption.label, 'user');
    Audio.playSend();

    // Apply effects to network
    const network = window.NeuronApp.state.network;
    const effects = selectedOption.effect;

    for (const [factorName, targetValue] of Object.entries(effects)) {
      // Search neuron1 inputs first, then neuron2 inputs if applicable
      let input = network.inputs.find(inp =>
        inp.name.toLowerCase() === factorName.toLowerCase()
      );
      if (!input && network.twoNeuron && network.neuron2) {
        input = network.neuron2.inputs.find(inp =>
          inp.name.toLowerCase() === factorName.toLowerCase()
        );
      }
      if (input) {
        this.animateSliderChange(input, targetValue, network);
      }
    }

    // Advance to next question
    this.questionIndex++;
    this.questionsAsked++;

    // Brief pause then ask next question
    this.setThinking(true);
    setTimeout(() => {
      this.setThinking(false);

      // Provide brief reaction
      const reactions = [
        "Got it! That tells me a lot.",
        "Interesting — adjusting the weights...",
        "Noted! The network is recalibrating.",
        "That shifts things. Let me continue...",
        "Updating the model based on that.",
      ];
      Audio.playReceive();
      this.addMessageToUI(reactions[Math.floor(Math.random() * reactions.length)], 'bot');

      setTimeout(() => {
        this.askMultipleChoice();
      }, 1000);
    }, 800);
  },

  animateSliderChange(input, targetValue, network) {
    const startValue = input.value;
    const duration = 600;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      input.value = parseFloat((startValue + (targetValue - startValue) * eased).toFixed(2));

      window.NeuronApp.emit('networkUpdate', network);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        Audio.playSliderAdjust();
      }
    };
    requestAnimationFrame(animate);
  },

  handleModification(text) {
    const lower = text.toLowerCase();
    const network = JSON.parse(JSON.stringify(window.NeuronApp.state.network));

    // Reduce importance
    if (lower.includes("doesn't matter") || lower.includes("less important") || lower.includes("not important") || lower.includes("isn't an issue")) {
      for (const inp of network.inputs) {
        const nameLower = inp.name.toLowerCase();
        if (lower.includes(nameLower.split(' ')[0].toLowerCase())) {
          inp.weight = inp.weight * 0.3;
          return { chatText: `Got it — lowering the weight for "${inp.name}".`, config: network };
        }
      }
      network.inputs[0].weight *= 0.3;
      return { chatText: "Noted — I've reduced that factor's influence.", config: network };
    }

    // Increase importance
    if (lower.includes('really important') || lower.includes('matters a lot') || lower.includes('big factor') || lower.includes('most important')) {
      for (const inp of network.inputs) {
        const nameLower = inp.name.toLowerCase();
        if (lower.includes(nameLower.split(' ')[0].toLowerCase())) {
          inp.weight = Math.sign(inp.weight) * Math.min(Math.abs(inp.weight) * 1.5, 1);
          return { chatText: `"${inp.name}" is now weighted more heavily.`, config: network };
        }
      }
    }

    // Remove factor
    if (lower.includes('remove') || lower.includes('drop') || lower.includes("don't consider")) {
      for (let i = 0; i < network.inputs.length; i++) {
        const nameLower = network.inputs[i].name.toLowerCase();
        if (lower.includes(nameLower.split(' ')[0].toLowerCase())) {
          const removed = network.inputs.splice(i, 1)[0];
          return { chatText: `Removed "${removed.name}" from the analysis.`, config: network };
        }
      }
    }

    // Add factor
    if (lower.includes('also consider') || lower.includes('add') || lower.includes('what about') || lower.includes('factor in')) {
      const newFactor = {
        name: this.extractFactorName(lower),
        weight: lower.includes('negative') || lower.includes('against') || lower.includes("don't") ? -0.6 : 0.6,
        value: 0.5,
        description: 'User-added factor',
      };
      network.inputs.push(newFactor);
      return { chatText: `Added "${newFactor.name}" to your decision model.`, config: network };
    }

    return {
      chatText: "I'm listening — you can adjust the sliders directly, or tell me to add/remove/change factors. You can also say things like \"budget isn't an issue\" or \"passion is really important\".",
      config: null,
    };
  },

  extractFactorName(text) {
    const patterns = [
      /(?:consider|add|about|factor in)\s+(?:that\s+)?(?:my\s+)?(.+?)(?:\.|$)/i,
      /(?:also|and)\s+(.+?)(?:\.|$)/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let name = match[1].trim();
        name = name.charAt(0).toUpperCase() + name.slice(1);
        if (name.length > 20) name = name.substring(0, 20);
        return name;
      }
    }
    return 'New Factor';
  },

  addMessageToUI(text, type) {
    const container = document.getElementById('chat-messages');

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}-message`;

    if (type === 'bot') {
      const avatar = document.createElement('div');
      avatar.className = 'message-avatar';
      avatar.innerHTML = '<div class="neuron-icon small"></div>';
      msgDiv.appendChild(avatar);
    }

    const content = document.createElement('div');
    content.className = 'message-content';

    if (type === 'bot') {
      content.innerHTML = '<p></p>';
      msgDiv.appendChild(content);
      container.appendChild(msgDiv);
      this.typeText(content.querySelector('p'), text);
    } else {
      content.innerHTML = `<p>${this.escapeHtml(text)}</p>`;
      msgDiv.appendChild(content);
      container.appendChild(msgDiv);
    }

    container.scrollTop = container.scrollHeight;
  },

  typeText(element, text, speed = 12) {
    let i = 0;
    const escaped = this.escapeHtml(text);
    element.textContent = '';

    const type = () => {
      if (i < escaped.length) {
        element.textContent += escaped[i];
        i++;
        setTimeout(type, speed + Math.random() * 8);
        const container = document.getElementById('chat-messages');
        container.scrollTop = container.scrollHeight;
      }
    };
    type();
  },

  setThinking(isThinking) {
    this.isThinking = isThinking;
    const indicator = document.getElementById('thinking-indicator');
    const avatar = document.getElementById('chat-avatar');
    indicator.style.display = isThinking ? 'flex' : 'none';

    if (isThinking) {
      avatar.classList.add('thinking');
    } else {
      avatar.classList.remove('thinking');
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
};
