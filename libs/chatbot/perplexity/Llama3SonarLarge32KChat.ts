import {PerplexityBot, PerplexitySession} from "~libs/chatbot/perplexity/PerplexityBase";
import type {BotConstructorParams} from "~libs/chatbot/IBot";

class Llama3SonarLarge32KChatSessionSingleton {
    static model = "";
    private static sessionInstance: PerplexitySession | null;
    static globalConversationId: string;

    protected constructor() {
        // ignore
    }

    static getInstance(params: BotConstructorParams, model: string): PerplexitySession {
        Llama3SonarLarge32KChatSessionSingleton.model = model;

        if (Llama3SonarLarge32KChatSessionSingleton?.sessionInstance?.wsClosed) {
            Llama3SonarLarge32KChatSessionSingleton.destroy();
        }

        if (this.globalConversationId !== params.globalConversationId) {
            Llama3SonarLarge32KChatSessionSingleton.destroy();
        }

        if (!Llama3SonarLarge32KChatSessionSingleton.sessionInstance) {
            Llama3SonarLarge32KChatSessionSingleton.sessionInstance = new PerplexitySession(Llama3SonarLarge32KChatSessionSingleton.model);
        }

        this.globalConversationId = params.globalConversationId;

        return Llama3SonarLarge32KChatSessionSingleton.sessionInstance;
    }

    static destroy() {
        void Llama3SonarLarge32KChatSessionSingleton?.sessionInstance?.wsClose();
        Llama3SonarLarge32KChatSessionSingleton.sessionInstance = null;
    }
}

export class Llama3SonarLarge32KChat extends PerplexityBot {
    model = "llama-3-sonar-large-32k-chat";
    static botName = 'llama-3-sonar-large-32k-chat';
    static desc = 'Suitable for tasks that require sophisticated dialogue capabilities, such as virtual assistants, chatbots, and interactive AI companions.';
    static maxTokenLimit = 32 * 1000;

    constructor(params: BotConstructorParams) {
        super(params);
        this.perplexitySession = Llama3SonarLarge32KChatSessionSingleton.getInstance(params, this.model);
    }

    getBotName(): string {
        return Llama3SonarLarge32KChat.botName;
    }

    getMaxTokenLimit(): number {
        return Llama3SonarLarge32KChat.maxTokenLimit;
    }
}
