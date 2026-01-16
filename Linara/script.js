// =========================
// Core data
// =========================

// Base bilingual dictionary: English lemma ↔ Linara root
// You can expand this as Linara grows.
const lexicon = {
    nouns: {
        "i": "mi",      // pronoun
        "you": "ta",
        "house": "palo",
        "water": "nalu",
        "friend": "suni",
        "food": "kera",
        "day": "dina"
    },
    verbs: {
        "eat": "kema",
        "drink": "nema",
        "see": "liso",
        "go": "vani",
        "come": "ravi",
        "sleep": "soma",
        "speak": "tari"
    },
    adjectives: {
        "good": "meli",
        "bad": "sari",
        "big": "tova",
        "small": "neli"
    }
};

// Reverse lexicon (Linara → English)
const reverseLexicon = {
    nouns: {},
    verbs: {},
    adjectives: {}
};

for (const pos of ["nouns", "verbs", "adjectives"]) {
    for (const [en, lin] of Object.entries(lexicon[pos])) {
        reverseLexicon[pos][lin] = en;
    }
}

// Linara morphology rules
const linaraMorph = {
    // tense suffixes
    past: "ta",
    future: "lo",
    // plural suffix
    plural: "n",
    // negation prefix
    negPrefix: "ma"
};

// =========================
// Utility helpers
// =========================

function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^a-zA-Z\s']/g, "")
        .split(/\s+/)
        .filter(Boolean);
}

function isAuxiliary(word) {
    return ["will", "did", "do", "does", "am", "is", "are", "was", "were"].includes(word);
}

function isNegation(word) {
    return ["not", "don't", "dont", "didn't", "didnt", "no"].includes(word);
}

function isPluralEnglish(word) {
    // naive plural detection: ends with "s" and not "is"
    return word.endsWith("s") && !word.endsWith("is");
}

function stripPluralEnglish(word) {
    if (isPluralEnglish(word)) {
        return word.slice(0, -1);
    }
    return word;
}

// =========================
// Part-of-speech tagging (very simple)
// =========================

function tagEnglish(tokens) {
    // returns array of {word, pos}
    return tokens.map(token => {
        if (lexicon.nouns[token]) return { word: token, pos: "N" };
        if (lexicon.verbs[token]) return { word: token, pos: "V" };
        if (lexicon.adjectives[token]) return { word: token, pos: "ADJ" };
        if (["i", "you", "he", "she", "we", "they"].includes(token)) return { word: token, pos: "PRON" };
        if (isAuxiliary(token)) return { word: token, pos: "AUX" };
        if (isNegation(token)) return { word: token, pos: "NEG" };
        return { word: token, pos: "X" }; // unknown
    });
}

// =========================
// English → Linara
// =========================

function englishToLinara(input) {
    const tokens = tokenize(input);
    if (tokens.length === 0) return "";

    const tagged = tagEnglish(tokens);

    // Very simple clause model: [SUBJ] [AUX?] [NEG?] [VERB] [OBJ?]
    let subject = null;
    let verb = null;
    let object = null;
    let tense = "present";
    let negated = false;
    let objectPlural = false;

    // crude parse
    for (let i = 0; i < tagged.length; i++) {
        const t = tagged[i];

        if (!subject && (t.pos === "PRON" || t.pos === "N")) {
            subject = t.word;
            continue;
        }

        if (t.pos === "AUX") {
            if (t.word === "will") tense = "future";
            if (t.word === "did" || t.word === "was" || t.word === "were") tense = "past";
            continue;
        }

        if (t.pos === "NEG") {
            negated = true;
            continue;
        }

        if (!verb && (t.pos === "V" || t.pos === "X")) {
            verb = t.word;
            continue;
        }

        if (!object && (t.pos === "N" || t.pos === "X")) {
            object = t.word;
            objectPlural = isPluralEnglish(object);
            object = stripPluralEnglish(object);
            continue;
        }
    }

    // Map subject
    let linSubj = subject && lexicon.nouns[subject] ? lexicon.nouns[subject] : subject;

    // Map verb root
    let linVerbRoot = verb && lexicon.verbs[verb] ? lexicon.verbs[verb] : verb;

    // Apply tense
    let linVerb = linVerbRoot || "";
    if (tense === "past") linVerb += linaraMorph.past;
    if (tense === "future") linVerb += linaraMorph.future;

    // Apply negation
    if (negated && linVerb) {
        linVerb = linaraMorph.negPrefix + "-" + linVerb;
    }

    // Map object
    let linObj = object && lexicon.nouns[object] ? lexicon.nouns[object] : object;
    if (linObj && objectPlural) {
        linObj += linaraMorph.plural;
    }

    // Build SOV order: Subject Object Verb
    const parts = [];
    if (linSubj) parts.push(capitalize(linSubj));
    if (linObj) parts.push(linObj);
    if (linVerb) parts.push(linVerb);

    return parts.join(" ") + ".";
}

// =========================
// Linara → English
// =========================

function linaraToEnglish(input) {
    const tokens = tokenize(input);
    if (tokens.length === 0) return "";

    // SOV: [SUBJ] [OBJ] [VERB]
    let linSubj = tokens[0] || null;
    let linObj = tokens[1] || null;
    let linVerb = tokens[2] || null;

    let negated = false;
    let tense = "present";

    // Handle negation prefix on verb
    if (linVerb && linVerb.startsWith(linaraMorph.negPrefix + "-")) {
        negated = true;
        linVerb = linVerb.slice((linaraMorph.negPrefix + "-").length);
    }

    // Detect tense suffix on verb
    if (linVerb && linVerb.endsWith(linaraMorph.past)) {
        tense = "past";
        linVerb = linVerb.slice(0, -linaraMorph.past.length);
    } else if (linVerb && linVerb.endsWith(linaraMorph.future)) {
        tense = "future";
        linVerb = linVerb.slice(0, -linaraMorph.future.length);
    }

    // Map subject
    let enSubj = mapLinaraToEnglishWord(linSubj);

    // Map object and plural
    let enObj = null;
    let objPlural = false;
    if (linObj) {
        if (linObj.endsWith(linaraMorph.plural)) {
            objPlural = true;
            linObj = linObj.slice(0, -linaraMorph.plural.length);
        }
        enObj = mapLinaraToEnglishWord(linObj);
    }

    // Map verb
    let enVerb = mapLinaraToEnglishWord(linVerb, "verb");

    // Build English SVO with auxiliaries
    const parts = [];

    if (enSubj) {
        parts.push(capitalize(enSubj));
    }

    if (tense === "future") {
        parts.push("will");
    } else if (tense === "past") {
        // naive past: "did" + base verb
        parts.push("did");
    }

    if (negated) {
        parts.push("not");
    }

    if (enVerb) {
        parts.push(enVerb);
    }

    if (enObj) {
        if (objPlural) {
            parts.push(pluralizeEnglish(enObj));
        } else {
            parts.push(enObj);
        }
    }

    return parts.join(" ") + ".";
}

function mapLinaraToEnglishWord(word, forcePos = null) {
    if (!word) return null;

    if (!forcePos || forcePos === "noun") {
        if (reverseLexicon.nouns[word]) return reverseLexicon.nouns[word];
    }
    if (!forcePos || forcePos === "verb") {
        if (reverseLexicon.verbs[word]) return reverseLexicon.verbs[word];
    }
    if (!forcePos || forcePos === "adj") {
        if (reverseLexicon.adjectives[word]) return reverseLexicon.adjectives[word];
    }
    return word;
}

function pluralizeEnglish(word) {
    // naive pluralization
    if (word.endsWith("y")) return word.slice(0, -1) + "ies";
    if (word.endsWith("s")) return word + "es";
    return word + "s";
}

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// =========================
// UI wiring
// =========================

let mode = "en-lin"; // or "lin-en"

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
