// =========================
// Core data: Linara <-> English
// =========================

// Base bilingual lexicon (lemmas)
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
        "tired": "soma-li" // example derived form
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

// Greetings and phrases
const greetingWordsEn = ["hello", "hi", "hey"];
const greetingLin = "sava";

// =========================
// Utilities
// =========================

function tokenize(text) {
    return text
        .trim()
        .split(/\s+/)
        .filter(Boolean);
}

function normalizeWord(word) {
    return word.toLowerCase().replace(/[^a-z']/g, "");
}

function isCapitalized(word) {
    return /^[A-Z][a-zA-Z]*$/.test(word);
}

function isAuxiliary(word) {
    const w = normalizeWord(word);
    return ["will", "did", "do", "does", "am", "is", "are", "was", "were"].includes(w);
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

// =========================
// POS tagging (English)
// =========================

function tagEnglish(tokens) {
    return tokens.map(raw => {
        const word = normalizeWord(raw);

        if (lexicon.pronouns[word]) return { raw, word, pos: "PRON" };
        if (lexicon.nouns[word]) return { raw, word, pos: "N" };
        if (lexicon.verbs[word]) return { raw, word, pos: "V" };
        if (lexicon.adjectives[word]) return { raw, word, pos: "ADJ" };
        if (greetingWordsEn.includes(word)) return { raw, word, pos: "GREETING" };
        if (isAuxiliary(word)) return { raw, word, pos: "AUX" };
        if (isNegation(word)) return { raw, word, pos: "NEG" };
        if (isCapitalized(raw)) return { raw, word: raw, pos: "NAME" };
        return { raw, word, pos: "X" };
    });
}

// =========================
// English → Linara
// =========================

function englishToLinara(input) {
    if (!input.trim()) return "";

    const isQuestion = isQuestionMark(input);
    const rawTokens = tokenize(input);
    const tagged = tagEnglish(rawTokens);

    // 1. Handle greetings + "I am NAME"
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
        if (t.raw.toLowerCase() === "i'm" && next.pos === "NAME") {
            nameAfterIam = next.raw;
            break;
        }
    }

    if (greetingToken && nameAfterIam) {
        // "Hello, I am Nyxen." -> "Sava mi Nyxen."
        return `${capitalize(greetingLin)} mi ${nameAfterIam}.`;
    }

    // 2. General clause parsing: SVO
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
            if (["did", "was", "were"].includes(t.word)) tense = "past";
            continue;
        }

        if (t.pos === "NEG") {
            negated = true;
            continue;
        }

        if (!verb && (t.pos === "V" || t.pos === "X")) {
            verb = t;
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

    // Build SOV: Subject Object (Adjectives) Verb
    const parts = [];
    if (linSubj) parts.push(capitalize(linSubj));
    if (linObj) {
        parts.push(linObj);
        if (linAdj.length) parts.push(linAdj.join(" "));
    }
    if (linVerb) parts.push(linVerb);

    // If no verb but we have "I am NAME" style without greeting
    if (!linVerb && subject && object && object.pos === "NAME") {
        // "I am Nyxen." -> "Mi Nyxen."
        return `${capitalize(linSubj)} ${object.raw}.`;
    }

    // Question particle
    if (isQuestion) parts.push(lexicon.particles.question);

    return parts.join(" ") + ".";
}

// =========================
// Linara → English
// =========================

function linaraToEnglish(input) {
    if (!input.trim()) return "";

    const isQuestion = isQuestionMark(input);
    let tokens = tokenize(input).map(t => t.replace(/[.?!]/g, ""));

    if (tokens.length === 0) return "";

    // Handle greeting pattern: "Sava mi Name"
    if (normalizeWord(tokens[0]) === greetingLin) {
        if (tokens[1] && normalizeWord(tokens[1]) === "mi" && tokens[2]) {
            const name = tokens[2];
            return `Hello, I am ${name}.`;
        }
        return "Hello.";
    }

    // Assume SOV: [SUBJ] [OBJ ... ADJ?] [VERB?] [ka?]
    // Strip question particle if present
    if (normalizeWord(tokens[tokens.length - 1]) === lexicon.particles.question) {
        tokens = tokens.slice(0, -1);
    }

    let linSubj = tokens[0] || null;
    let linVerb = null;
    let linObj = null;
    let linAdj = [];

    if (tokens.length === 1) {
        // Single word: try to map directly
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
    let enSubj = mapLinaraToEnglishWord(linSubj, ["pronouns", "nouns"]) || linSubj;

    // Map object + plural
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

    // Map adjectives
    let enAdj = linAdj.map(a => mapLinaraToEnglishWord(a, ["adjectives"]) || a);

    // Map verb
    let enVerb = linVerb ? mapLinaraToEnglishWord(linVerb, ["verbs"]) || linVerb : null;

    // If no verb and we have "Mi Nyxen" style
    if (!enVerb && enSubj && enObj && isCapitalized(enObj)) {
        return `I am ${enObj}.`;
    }

    // Build English SVO
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
