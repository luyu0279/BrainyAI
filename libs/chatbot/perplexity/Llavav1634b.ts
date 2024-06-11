import {PerplexityBot, PerplexitySession} from "~libs/chatbot/perplexity/PerplexityBase";
import type {BotConstructorParams} from "~libs/chatbot/IBot";

class Llavav1634bSessionSingleton {
    static model = "";
    private static sessionInstance: PerplexitySession | null;
    static globalConversationId: string;

    protected constructor() {
        // ignore
    }

    static getInstance(params: BotConstructorParams, model: string): PerplexitySession {
        Llavav1634bSessionSingleton.model = model;

        if (Llavav1634bSessionSingleton?.sessionInstance?.wsClosed) {
            Llavav1634bSessionSingleton.destroy();
        }

        if (this.globalConversationId !== params.globalConversationId) {
            Llavav1634bSessionSingleton.destroy();
        }

        if (!Llavav1634bSessionSingleton.sessionInstance) {
            Llavav1634bSessionSingleton.sessionInstance = new PerplexitySession(Llavav1634bSessionSingleton.model);
        }

        this.globalConversationId = params.globalConversationId;

        return Llavav1634bSessionSingleton.sessionInstance;
    }

    static destroy() {
        void Llavav1634bSessionSingleton?.sessionInstance?.wsClose();
        Llavav1634bSessionSingleton.sessionInstance = null;
    }
}


export class Llavav1634b extends PerplexityBot {
    static botName = 'llava-v1.6-34b';
    model = "llava-v1.6-34b";
    static desc = 'Suitable for tasks like visual question answering, image captioning, OCR and engaging in natural visual conversations.';
    static maxTokenLimit = 8 * 1000;

    constructor(params: BotConstructorParams) {
        super(params);
        this.perplexitySession = Llavav1634bSessionSingleton.getInstance(params, this.model);
    }

    getBotName(): string {
        return Llavav1634b.botName;
    }

    getMaxTokenLimit(): number {
        return Llavav1634b.maxTokenLimit;
    }
}
