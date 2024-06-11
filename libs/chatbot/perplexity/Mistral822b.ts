import {PerplexityBot, PerplexitySession} from "~libs/chatbot/perplexity/PerplexityBase";
import type {BotConstructorParams} from "~libs/chatbot/IBot";

class Mistral822bSessionSingleton {
    static model = "";
    private static sessionInstance: PerplexitySession | null;
    static globalConversationId: string;

    protected constructor() {
        // ignore
    }

    static getInstance(params: BotConstructorParams, model: string): PerplexitySession {
        Mistral822bSessionSingleton.model = model;

        if (Mistral822bSessionSingleton?.sessionInstance?.wsClosed) {
            Mistral822bSessionSingleton.destroy();
        }

        if (this.globalConversationId !== params.globalConversationId) {
            Mistral822bSessionSingleton.destroy();
        }

        if (!Mistral822bSessionSingleton.sessionInstance) {
            Mistral822bSessionSingleton.sessionInstance = new PerplexitySession(Mistral822bSessionSingleton.model);
        }

        this.globalConversationId = params.globalConversationId;

        return Mistral822bSessionSingleton.sessionInstance;
    }

    static destroy() {
        void Mistral822bSessionSingleton?.sessionInstance?.wsClose();
        Mistral822bSessionSingleton.sessionInstance = null;
    }
}

export class Mistral822b extends PerplexityBot {
    static botName = 'mistral-8×22b';
    model = "mixtral-8x22b-instruct";
    static desc = 'Suitable for natural language processing tasks, including chatbots, content generation, and more complex tasks that require a deeper understanding of language.';
    static maxTokenLimit = 16 * 1000;

    constructor(params: BotConstructorParams) {
        super(params);
        this.perplexitySession = Mistral822bSessionSingleton.getInstance(params, this.model);
    }

    getBotName(): string {
        return Mistral822b.botName;
    }

    getMaxTokenLimit(): number {
        return Mistral822b.maxTokenLimit;
    }
}
