import {PerplexityBot, PerplexitySession} from "~libs/chatbot/perplexity/PerplexityBase";
import type {BotConstructorParams} from "~libs/chatbot/IBot";

class Claude3HaikuSessionSingleton {
    static model = "";
    private static sessionInstance: PerplexitySession | null;
    static globalConversationId: string;

    protected constructor() {
        // ignore
    }

    static getInstance(params: BotConstructorParams, model: string): PerplexitySession {
        Claude3HaikuSessionSingleton.model = model;

        if (Claude3HaikuSessionSingleton?.sessionInstance?.wsClosed) {
            Claude3HaikuSessionSingleton.destroy();
        }

        if (this.globalConversationId !== params.globalConversationId) {
            Claude3HaikuSessionSingleton.destroy();
        }

        if (!Claude3HaikuSessionSingleton.sessionInstance) {
            Claude3HaikuSessionSingleton.sessionInstance = new PerplexitySession(Claude3HaikuSessionSingleton.model);
        }

        this.globalConversationId = params.globalConversationId;

        return Claude3HaikuSessionSingleton.sessionInstance;
    }

    static destroy() {
        void Claude3HaikuSessionSingleton?.sessionInstance?.wsClose();
        Claude3HaikuSessionSingleton.sessionInstance = null;
    }
}

export class Claude3Haiku extends PerplexityBot {
    model = "claude-3-haiku-20240307";
    static botName = "claude-3-haiku";
    static desc = 'Suitable for swiftly answering simple questions, such as customer interactions and content';
    static maxTokenLimit = 8 * 1000;

    constructor(params: BotConstructorParams) {
        super(params);
        this.perplexitySession = Claude3HaikuSessionSingleton.getInstance(params, this.model);
    }

    getBotName(): string {
        return Claude3Haiku.botName;
    }

    getMaxTokenLimit(): number {
        return Claude3Haiku.maxTokenLimit;
    }
}
