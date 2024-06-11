import {PerplexityBot, PerplexitySession} from "~libs/chatbot/perplexity/PerplexityBase";
import type {BotConstructorParams} from "~libs/chatbot/IBot";

class Llama3SonarLarge32kOnlineSessionSingleton {
    static model = "";
    private static sessionInstance: PerplexitySession | null;
    static globalConversationId: string;

    protected constructor() {
        // ignore
    }

    static getInstance(params: BotConstructorParams, model: string): PerplexitySession {
        Llama3SonarLarge32kOnlineSessionSingleton.model = model;

        if (Llama3SonarLarge32kOnlineSessionSingleton?.sessionInstance?.wsClosed) {
            Llama3SonarLarge32kOnlineSessionSingleton.destroy();
        }

        if (this.globalConversationId !== params.globalConversationId) {
            Llama3SonarLarge32kOnlineSessionSingleton.destroy();
        }

        if (!Llama3SonarLarge32kOnlineSessionSingleton.sessionInstance) {
            Llama3SonarLarge32kOnlineSessionSingleton.sessionInstance = new PerplexitySession(Llama3SonarLarge32kOnlineSessionSingleton.model);
        }

        this.globalConversationId = params.globalConversationId;

        return Llama3SonarLarge32kOnlineSessionSingleton.sessionInstance;
    }

    static destroy() {
        void Llama3SonarLarge32kOnlineSessionSingleton?.sessionInstance?.wsClose();
        Llama3SonarLarge32kOnlineSessionSingleton.sessionInstance = null;
    }
}

export class Llama3SonarLarge32kOnline extends PerplexityBot {
    model = "llama-3-sonar-large-32k-online";
    static botName = "llama-3-sonar-large-32k-online";
    static desc = 'Suitable for engaging online chat and dialogue, with a focus on providing helpful and factual responses.';
    static maxTokenLimit = 32 * 1000;

    constructor(params: BotConstructorParams) {
        super(params);
        this.perplexitySession = Llama3SonarLarge32kOnlineSessionSingleton.getInstance(params, this.model);
    }

    getBotName(): string {
        return Llama3SonarLarge32kOnline.botName;
    }

    getMaxTokenLimit(): number {
        return Llama3SonarLarge32kOnline.maxTokenLimit;
    }
}
