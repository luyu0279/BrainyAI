import {PerplexityBot, PerplexitySession} from "~libs/chatbot/perplexity/PerplexityBase";
import type {BotConstructorParams} from "~libs/chatbot/IBot";

class Llama370bInstructSessionSingleton {
    static model = "";
    private static sessionInstance: PerplexitySession | null;
    static globalConversationId: string;

    protected constructor() {
        // ignore
    }

    static getInstance(params: BotConstructorParams, model: string): PerplexitySession {
        Llama370bInstructSessionSingleton.model = model;

        if (Llama370bInstructSessionSingleton?.sessionInstance?.wsClosed) {
            Llama370bInstructSessionSingleton.destroy();
        }

        if (this.globalConversationId !== params.globalConversationId) {
            Llama370bInstructSessionSingleton.destroy();
        }

        if (!Llama370bInstructSessionSingleton.sessionInstance) {
            Llama370bInstructSessionSingleton.sessionInstance = new PerplexitySession(Llama370bInstructSessionSingleton.model);
        }

        this.globalConversationId = params.globalConversationId;

        return Llama370bInstructSessionSingleton.sessionInstance;
    }

    static destroy() {
        void Llama370bInstructSessionSingleton?.sessionInstance?.wsClose();
        Llama370bInstructSessionSingleton.sessionInstance = null;
    }
}

export class Llama370bInstruct extends PerplexityBot {
    model = "llama-3-70b-instruct";
    static botName = "llama-3-70b-instruct";
    static desc = 'Suitable for advanced dialogue tasks, such as complex conversational AI, data analysis, and content creation.';
    static maxTokenLimit = 8 * 1000;

    constructor(params: BotConstructorParams) {
        super(params);
        this.perplexitySession = Llama370bInstructSessionSingleton.getInstance(params, this.model);
    }

    getBotName(): string {
        return Llama370bInstruct.botName;
    }

    getMaxTokenLimit(): number {
        return Llama370bInstruct.maxTokenLimit;
    }
}
