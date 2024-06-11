import {PerplexityBot, PerplexitySession} from "~libs/chatbot/perplexity/PerplexityBase";
import type {BotConstructorParams} from "~libs/chatbot/IBot";

class Gemma7BLTSessionSingleton {
    static model = "";
    private static sessionInstance: PerplexitySession | null;
    static globalConversationId: string;

    protected constructor() {
        // ignore
    }

    static getInstance(params: BotConstructorParams, model: string): PerplexitySession {
        Gemma7BLTSessionSingleton.model = model;

        if (Gemma7BLTSessionSingleton?.sessionInstance?.wsClosed) {
            Gemma7BLTSessionSingleton.destroy();
        }

        if (this.globalConversationId !== params.globalConversationId) {
            Gemma7BLTSessionSingleton.destroy();
        }

        if (!Gemma7BLTSessionSingleton.sessionInstance) {
            Gemma7BLTSessionSingleton.sessionInstance = new PerplexitySession(Gemma7BLTSessionSingleton.model);
        }

        this.globalConversationId = params.globalConversationId;

        return Gemma7BLTSessionSingleton.sessionInstance;
    }

    static destroy() {
        void Gemma7BLTSessionSingleton?.sessionInstance?.wsClose();
        Gemma7BLTSessionSingleton.sessionInstance = null;
    }
}


export class Gemma7bIt extends PerplexityBot {
    static botName = 'gemma-7b-it';
    model = "gemma-7b-it";
    static desc = 'Suitable for more complex text generation tasks that require advanced natural language understanding and processing.';
    static maxTokenLimit = 8 * 1000;

    constructor(params: BotConstructorParams) {
        super(params);
        this.perplexitySession = Gemma7BLTSessionSingleton.getInstance(params, this.model);
    }

    getBotName(): string {
        return Gemma7bIt.botName;
    }

    getMaxTokenLimit(): number {
        return Gemma7bIt.maxTokenLimit;
    }
}
