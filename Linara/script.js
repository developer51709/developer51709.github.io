// =========================
// Linara Translator – Advanced Rule-Based Engine
// =========================
//
// Features:
// - English ⇄ Linara
// - SVO (English) ↔ SOV (Linara)
// - Tense (past/future), negation, plural
// - Adjectives (EN: before noun, LN: after noun)
// - Copula handling ("to be")
// - Greetings & greeting-questions
// - Names, contractions, simple idioms
// - Question detection & particle "ka"
//
// This file assumes existing index.html + style.css with:
// - mode buttons: #mode-en-lin, #mode-lin-en
// - labels: #inputLabel, #outputLabel
// - textareas: #inputText, #outputText
// - button: #translateBtn
// =========================


// =========================
// Core Data
// =========================

const lexicon = {
    pronouns: {
        "i": "mi",
        "you": "ta",
        "he": "li",
        "she": "li",
        "we": "nu",
        "they": "lin",
        "you_pl": "tun"
    },
    nouns: {
        "house": "palo",
        "water": "nalu",
        "friend": "suni",
        "food": "kera",
        "day": "dina",
        "morning": "mora"
    },
    verbs: {
        "eat": "kema",
        "drink": "nema",
        "see": "liso",
        "go": "vani",
        "come": "ravi",
        "sleep": "soma",
        "speak": "tari",
        "be": "es" // copula particle
    },
    adjectives: {
        "good": "meli",
        "bad": "sari",
        "big": "tova",
        "small": "neli",
        "tired": "somali" // example derived form
    },
    particles: {
        "hello": "sava",
        "question": "ka"
    }
};

// Reverse lexicon (Linara -> English)
const reverseLexicon = {
    pronouns: {},
    nouns: {},
    verbs: {},
    adjectives: {},
    particles: {}
};

for (const pos of Object.keys(lexicon)) {
    for (const [en, lin] of Object.entries(lexicon[pos])) {
        reverseLexicon[pos][lin] = en;
    }
}

// Morphology rules
const linaraMorph = {
    past: "ta",
    future: "lo",
    plural: "n",
    negPrefix: "ma"
};

// Phrase-level dictionary (English → Linara)
const phraseDictEnToLin = [
    { en: ["good", "morning"], lin: "sava dina" },
    { en: ["thank", "you"], lin: "ta meli" },
    { en: ["see", "you", "later"], lin: "ta ravi-lo" }
];

// Greeting-questions (English → Linara)
const greetingQuestionsEn = [
    "how are you",
    "how are you doing",
    "how's it going",
    "hows it going",
    "how have you been",
    "what's up",
    "whats up"
];

// Linara greeting-questions → English
const greetingQuestionsLin = [
    "sava ta ka",
    "sava ta",
    "sava ka"
];

const greetingLin = "sava";


// =========================
// Utility Functions
// =========================

function normalizeWord(word) {
    return word.toLowerCase().replace(/[^a-z']/g, "");
}

function isCapitalized(word) {
    return /^[A-Z][a-zA-Z]*$/.test(word);
}

function tokenize(text) {
    return text
        .replace(/([.?!,])/g, " $1 ")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
}

function detokenize(tokens) {
    return tokens
        .join(" ")
        .replace(/\s+([.?!,])/g, "$1");
}

function isAuxiliary(word) {
    const w = normalizeWord(word);
    return ["will", "did", "do", "does", "am", "is", "are", "was", "were", "have", "has"].includes(w);
}

function isNegation(word) {
    const w = normalizeWord(word);
    return ["not", "don't", "dont", "didn't", "didnt", "no"].includes(w);
}

function isQuestionMark(text) {
    return /\?$/.test(text.trim());
}

function isPluralEnglish(word) {
    const w = normalizeWord(word);
    return w.endsWith("s") && !w.endsWith("is");
}

function stripPluralEnglish(word) {
    if (isPluralEnglish(word)) return word.slice(0, -1);
    return word;
}

function pluralizeEnglish(word) {
    if (word.endsWith("y")) return word.slice(0, -1) + "ies";
    if (word.endsWith("s")) return word + "es";
    return word + "s";
}

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function expandContractions(text) {
    return text
        .replace(/\bI'm\b/gi, "I am")
        .replace(/\byou're\b/gi, "you are")
        .replace(/\bhe's\b/gi, "he is")
        .replace(/\bshe's\b/gi, "she is")
        .replace(/\bthey're\b/gi, "they are")
        .replace(/\bwe're\b/gi, "we are")
        .replace(/\bit's\b/gi, "it is")
        .replace(/\bthat's\b/gi, "that is")
        .replace(/\bwhat's\b/gi, "what is")
        .replace(/\bhow's\b/gi, "how is")
        .replace(/\bdon't\b/gi, "do not")
        .replace(/\bdidn't\b/gi, "did not")
        .replace(/\bcan't\b/gi, "cannot")
        .replace(/\bwon't\b/gi, "will not");
}

function normalizeVerbEnglish(word) {
    const w = normalizeWord(word);

    const irregular = {
        "ate": "eat",
        "eaten": "eat",
        "drank": "drink",
        "drunk": "drink",
        "went": "go",
        "gone": "go",
        "came": "come",
        "seen": "see",
        "saw": "see",
        "slept": "sleep",
        "spoke": "speak",
        "spoken": "speak"
    };
    if (irregular[w]) return irregular[w];

    if (w.endsWith("ing")) return w.slice(0, -3);
    if (w.endsWith("ed")) return w.slice(0, -2);
    if (w.endsWith("es")) return w.slice(0, -2);
    if (w.endsWith("s")) return w.slice(0, -1);

    return w;
}


// =========================
// Phrase Matching (English)
// =========================

function matchPhraseEnglish(tokens) {
    const lowerTokens = tokens.map(t => normalizeWord(t));
    for (const entry of phraseDictEnToLin) {
        const phrase = entry.en;
        for (let i = 0; i <= lowerTokens.length - phrase.length; i++) {
            const slice = lowerTokens.slice(i, i + phrase.length);
            if (JSON.stringify(slice) === JSON.stringify(phrase)) {
                return { start: i, end: i + phrase.length, lin: entry.lin };
            }
        }
    }
    return null;
}


// =========================
// POS Tagging (English)
// =========================

function tagEnglish(tokens) {
    return tokens.map(raw => {
        const word = normalizeWord(raw);

        if (lexicon.pronouns[word]) return { raw, word, pos: "PRON" };
        if (lexicon.nouns[word]) return { raw, word, pos: "N" };
        if (lexicon.verbs[word]) return { raw, word, pos: "V" };
        if (lexicon.adjectives[word]) return { raw, word, pos: "ADJ" };
        if (greetingQuestionsEn.includes(tokens.join(" ").toLowerCase())) return { raw, word, pos: "GREETINGQ" };
        if (["hello", "hi", "hey"].includes(word)) return { raw, word, pos: "GREETING" };
        if (isAuxiliary(word)) return { raw, word, pos: "AUX" };
        if (isNegation(word)) return { raw, word, pos: "NEG" };
        if (isCapitalized(raw)) return { raw, word: raw, pos: "NAME" };
        if (["how", "what", "why", "where", "when"].includes(word)) return { raw, word, pos: "WH" };
        return { raw, word, pos: "X" };
    });
}


// =========================
// English → Linara
// =========================

function englishToLinara(input) {
    if (!input.trim()) return "";

    // Expand contractions
    input = expandContractions(input);

    const isQuestion = isQuestionMark(input);
    const lower = input.toLowerCase().replace(/[.?!]/g, "").trim();

    // 1. Greeting-questions
    for (const phrase of greetingQuestionsEn) {
        if (lower.includes(phrase)) {
            return "Sava ta ka.";
        }
    }

    // 2. Simple greeting + "I am NAME"
    const rawTokens = tokenize(input);
    const tagged = tagEnglish(rawTokens);

    const greetingToken = tagged.find(t => t.pos === "GREETING");
    let nameAfterIam = null;

    for (let i = 0; i < tagged.length - 2; i++) {
        const t = tagged[i];
        const next = tagged[i + 1];
        const next2 = tagged[i + 2];

        if (t.word === "i" && next.word === "am" && next2.pos === "NAME") {
            nameAfterIam = next2.raw;
            break;
        }
    }

    if (greetingToken && nameAfterIam) {
        return `${capitalize(greetingLin)} mi ${nameAfterIam}.`;
    }

    // 3. Phrase-level match
    const phraseMatch = matchPhraseEnglish(rawTokens);
    if (phraseMatch) {
        const before = rawTokens.slice(0, phraseMatch.start);
        const after = rawTokens.slice(phraseMatch.end);
        const parts = [];
        if (before.length) parts.push(englishToLinara(before.join(" ")).replace(/[.]/g, ""));
        parts.push(phraseMatch.lin);
        if (after.length) parts.push(englishToLinara(after.join(" ")).replace(/[.]/g, ""));
        return parts.join(" ") + ".";
    }

    // 4. General clause parsing: SVO
    let subject = null;
    let verb = null;
    let object = null;
    let adjectivesForObject = [];
    let tense = "present";
    let negated = false;
    let objectPlural = false;

    for (let i = 0; i < tagged.length; i++) {
        const t = tagged[i];

        if (!subject && (t.pos === "PRON" || t.pos === "N" || t.pos === "NAME")) {
            subject = t;
            continue;
        }

        if (t.pos === "AUX") {
            if (t.word === "will") tense = "future";
            if (["did", "was", "were", "had", "has", "have"].includes(t.word)) tense = "past";
            continue;
        }

        if (t.pos === "NEG") {
            negated = true;
            continue;
        }

        if (!verb && (t.pos === "V" || t.pos === "X")) {
            const lemma = normalizeVerbEnglish(t.raw);
            verb = { ...t, word: lemma };
            continue;
        }

        if (!object && (t.pos === "N" || t.pos === "NAME" || t.pos === "X")) {
            object = t;
            objectPlural = isPluralEnglish(t.raw);
            continue;
        }

        if (object && t.pos === "ADJ") {
            adjectivesForObject.push(t);
        }
    }

    // Map subject
    let linSubj = null;
    if (subject) {
        if (subject.pos === "PRON") {
            linSubj = lexicon.pronouns[subject.word] || subject.raw;
        } else if (subject.pos === "N") {
            linSubj = lexicon.nouns[subject.word] || subject.raw;
        } else if (subject.pos === "NAME") {
            linSubj = subject.raw;
        } else {
            linSubj = subject.raw;
        }
    }

    // Map verb
    let linVerbRoot = null;
    if (verb) {
        if (lexicon.verbs[verb.word]) {
            linVerbRoot = lexicon.verbs[verb.word];
        } else {
            linVerbRoot = verb.word;
        }
    }

    let linVerb = linVerbRoot || "";
    if (tense === "past") linVerb += linaraMorph.past;
    if (tense === "future") linVerb += linaraMorph.future;
    if (negated && linVerb) linVerb = linaraMorph.negPrefix + "-" + linVerb;

    // Map object
    let linObj = null;
    if (object) {
        if (object.pos === "N") {
            linObj = lexicon.nouns[object.word] || object.raw;
        } else if (object.pos === "NAME") {
            linObj = object.raw;
        } else {
            linObj = object.raw;
        }
        if (objectPlural) linObj += linaraMorph.plural;
    }

    // Map adjectives (after noun)
    let linAdj = adjectivesForObject.map(a => lexicon.adjectives[a.word] || a.raw);

    // If no verb and "I am NAME" style without greeting
    if (!linVerb && subject && object && object.pos === "NAME") {
        return `${capitalize(linSubj)} ${object.raw}.`;
    }

    // Build SOV: Subject Object (Adjectives) Verb
    const parts = [];
    if (linSubj) parts.push(capitalize(linSubj));
    if (linObj) {
        parts.push(linObj);
        if (linAdj.length) parts.push(linAdj.join(" "));
    }
    if (linVerb) parts.push(linVerb);

    if (isQuestion) parts.push(lexicon.particles.question);

    if (!parts.length) return input; // fallback

    return parts.join(" ") + ".";
}


// =========================
// Linara → English
// =========================

function linaraToEnglish(input) {
    if (!input.trim()) return "";

    const isQuestion = isQuestionMark(input);
    let tokens = tokenize(input).map(t => t.replace(/[.?!]/g, ""));
    if (!tokens.length) return "";

    const lowerLin = tokens.join(" ").toLowerCase();

    // Greeting-questions
    if (greetingQuestionsLin.includes(lowerLin.replace(/[.?!]/g, ""))) {
        return "How are you doing?";
    }

    // Greeting + "mi Name"
    if (normalizeWord(tokens[0]) === greetingLin) {
        if (tokens[1] && normalizeWord(tokens[1]) === "mi" && tokens[2]) {
            const name = tokens[2];
            return `Hello, I am ${name}.`;
        }
        return "Hello.";
    }

    // Assume SOV: [SUBJ] [OBJ ... ADJ?] [VERB?] [ka?]
    if (normalizeWord(tokens[tokens.length - 1]) === lexicon.particles.question) {
        tokens = tokens.slice(0, -1);
    }

    let linSubj = tokens[0] || null;
    let linVerb = null;
    let linObj = null;
    let linAdj = [];

    if (tokens.length === 1) {
        linSubj = tokens[0];
    } else if (tokens.length === 2) {
        linSubj = tokens[0];
        linVerb = tokens[1];
    } else {
        linSubj = tokens[0];
        linVerb = tokens[tokens.length - 1];
        linObj = tokens[1];

        if (tokens.length > 3) {
            linAdj = tokens.slice(2, tokens.length - 1);
        }
    }

    let negated = false;
    let tense = "present";

    // Negation
    if (linVerb && linVerb.startsWith(linaraMorph.negPrefix + "-")) {
        negated = true;
        linVerb = linVerb.slice((linaraMorph.negPrefix + "-").length);
    }

    // Tense
    if (linVerb && linVerb.endsWith(linaraMorph.past)) {
        tense = "past";
        linVerb = linVerb.slice(0, -linaraMorph.past.length);
    } else if (linVerb && linVerb.endsWith(linaraMorph.future)) {
        tense = "future";
        linVerb = linVerb.slice(0, -linaraMorph.future.length);
    }

    // Subject
    let enSubj = mapLinaraToEnglishWord(linSubj, ["pronouns", "nouns"]) || linSubj;

    // Object + plural
    let enObj = null;
    let objPlural = false;
    if (linObj) {
        let baseObj = linObj;
        if (baseObj.endsWith(linaraMorph.plural)) {
            objPlural = true;
            baseObj = baseObj.slice(0, -linaraMorph.plural.length);
        }
        enObj = mapLinaraToEnglishWord(baseObj, ["nouns"]) || baseObj;
    }

    // Adjectives
    let enAdj = linAdj.map(a => mapLinaraToEnglishWord(a, ["adjectives"]) || a);

    // Verb
    let enVerb = linVerb ? mapLinaraToEnglishWord(linVerb, ["verbs"]) || linVerb : null;

    // "Mi Name" style
    if (!enVerb && enSubj && enObj && isCapitalized(enObj)) {
        return `I am ${enObj}.`;
    }

    const parts = [];

    if (enSubj) {
        parts.push(capitalize(enSubj));
    }

    if (tense === "future") {
        parts.push("will");
    } else if (tense === "past") {
        parts.push("did");
    }

    if (negated) {
        parts.push("not");
    }

    if (enVerb) {
        parts.push(enVerb);
    }

    if (enObj) {
        let objStr = enObj;
        if (objPlural) objStr = pluralizeEnglish(objStr);
        if (enAdj.length) {
            objStr = `${enAdj.join(" ")} ${objStr}`;
        }
        parts.push(objStr);
    }

    let sentence = parts.join(" ");
    if (isQuestion) sentence += "?";
    else sentence += ".";

    return sentence;
}

function mapLinaraToEnglishWord(word, posList) {
    if (!word) return null;
    for (const pos of posList) {
        if (reverseLexicon[pos][word]) return reverseLexicon[pos][word];
    }
    return null;
}


// =========================
// UI Wiring
// =========================

let mode = "en-lin";

const modeEnLinBtn = document.getElementById("mode-en-lin");
const modeLinEnBtn = document.getElementById("mode-lin-en");
const inputLabel = document.getElementById("inputLabel");
const outputLabel = document.getElementById("outputLabel");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const translateBtn = document.getElementById("translateBtn");

modeEnLinBtn.addEventListener("click", () => {
    mode = "en-lin";
    modeEnLinBtn.classList.add("active");
    modeLinEnBtn.classList.remove("active");
    inputLabel.textContent = "English";
    outputLabel.textContent = "Linara";
    inputText.placeholder = "Type English here...";
    outputText.placeholder = "Linara translation appears here...";
    inputText.value = "";
    outputText.value = "";
});

modeLinEnBtn.addEventListener("click", () => {
    mode = "lin-en";
    modeLinEnBtn.classList.add("active");
    modeEnLinBtn.classList.remove("active");
    inputLabel.textContent = "Linara";
    outputLabel.textContent = "English";
    inputText.placeholder = "Type Linara here...";
    outputText.placeholder = "English translation appears here...";
    inputText.value = "";
    outputText.value = "";
});

translateBtn.addEventListener("click", () => {
    const text = inputText.value;
    let result = "";

    if (mode === "en-lin") {
        result = englishToLinara(text);
    } else {
        result = linaraToEnglish(text);
    }

    outputText.value = result;
});
