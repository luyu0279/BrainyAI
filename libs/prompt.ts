export const formatAskAi = (lang: string, quote: string, q: string) => {
    return `Your role is an AI assistant, proficient in solving various problems. Remember, no need to repeat what i asked. Answer this following question and respond in the ${lang} language: the background and my question is ${quote ?? ""} ,${q ?? ""}.`;
};

export const formatTranslate = (lang: string, c: string) => {
    return `I want you to act as an ${lang}translator, spelling corrector and improver. Remember, no need to repeat what i asked. Translate ${c ?? ""} into ${lang ?? ""}.`;
};

export const formatSummary = (lang: string, quotes: string, selection: string) => {
    return `I want you to act as a text summarizer to help me create a concise summary of the text I provide. The summary expressing the key points and concepts written in the original text without adding your interpretations. Please respond in the ${lang}.My first request is: ${quotes?? ""} ${selection ?? ""}.`;
};

export const formatExplain = (lang: string, quotes: string, selection: string) => {
    return `I want you to act as a simple explanation provider for difficult concepts. I will provide a brief description of a concept, and you will respond with a clear and concise explanation in layman’s terms. Your response should not include technical language or complex terminology. Instead, you must focus on breaking down the concept into easy-to-understand language. Remember, only respond in ${lang} language, no need to repeat what i asked. My first request is:  ${quotes ?? ""} ${selection ?? ""}`;
};

export const formatRephrase = (lang: string, quotes: string, selection: string) => {
    return `Rephrase the paragraph, focusing on the core topic. Please respond in the ${lang}.The paragraph is: ${quotes ?? ""} ${selection ?? ""}.`;
};

export const formatGammaCheck = (lang: string, quotes: string, selection: string) => {
    return `Your role is a spoken ${lang} teacher and improver. You will reply to me in {{lang}} . I want you to strictly correct my grammar mistakes, typos, and factual errors. Remember, no need to repeat what i asked. My first sentence is ${quotes ?? ""} ${selection ?? ""}.`;
};
