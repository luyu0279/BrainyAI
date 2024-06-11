import {PerplexityBot, PerplexitySession} from "~libs/chatbot/perplexity/PerplexityBase";
import type {BotConstructorParams} from "~libs/chatbot/IBot";

class CodeLlama70BSessionSingleton {
    static model = "";
    private static sessionInstance: PerplexitySession | null;
    static globalConversationId: string;

    protected constructor() {
        // ignore
    }

    static getInstance(params: BotConstructorParams, model: string): PerplexitySession {
        CodeLlama70BSessionSingleton.model = model;

        if (CodeLlama70BSessionSingleton?.sessionInstance?.wsClosed) {
            CodeLlama70BSessionSingleton.destroy();
        }

        if (this.globalConversationId !== params.globalConversationId) {
            CodeLlama70BSessionSingleton.destroy();
        }

        if (!CodeLlama70BSessionSingleton.sessionInstance) {
            CodeLlama70BSessionSingleton.sessionInstance = new PerplexitySession(CodeLlama70BSessionSingleton.model);
        }

        this.globalConversationId = params.globalConversationId;

        return CodeLlama70BSessionSingleton.sessionInstance;
    }

    static destroy() {
        void CodeLlama70BSessionSingleton?.sessionInstance?.wsClose();
        CodeLlama70BSessionSingleton.sessionInstance = null;
    }
}

export class CodeLlama70bInstruct extends PerplexityBot {
    static botName = 'codellama-70b-instruct';
    model = "codellama-70b-instruct";
    static desc = 'Suitable for tasks including code completion, code generation, code optimization, and debugging.';
    static maxTokenLimit = 16 * 1000;

    constructor(params: BotConstructorParams) {
        super(params);
        this.perplexitySession = CodeLlama70BSessionSingleton.getInstance(params, this.model);
    }

    getBotName(): string {
        return CodeLlama70bInstruct.botName;
    }

    getMaxTokenLimit(): number {
        return CodeLlama70bInstruct.maxTokenLimit;
    }
}
