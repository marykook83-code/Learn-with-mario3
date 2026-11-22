export const M = (text) => ({ who: "mario", text });
export const S = (text) => ({ who: "student", text });
export const Q = (ask, stem, options, answer, explain) => ({ question: { ask, stem, options, answer, explain } });
export const scene = (title, items) => ({ title, items });
export const Z = (prompt, options, answer, why) => ({ prompt, options, answer, why });
