import {Logger} from "~utils/logger";

export class SimpleBotMessage {
    text: string;
    id: string;

    constructor(text: string, id: string) {
        this.text = text;
        this.id = id;
    }
}

export interface IBotSessionSingleton {
    botConversationId: string;
    messages: SimpleBotMessage[];

    addMessage(message: SimpleBotMessage): void;

    getBotConversationId(): string;

    setBotConversationId(conversationId: string): void;

    getParentMessageId(): string | undefined;
}

export class BotSession implements IBotSessionSingleton {
    botConversationId: string;
    globalConversationId: string;
    messages: SimpleBotMessage[] = [];

    constructor(globalConversationId: string) {
        this.globalConversationId = globalConversationId;
    }

    // static destroy() {
    //     BotSessionSingleton.globalConversationId = undefined
    //     BotSessionSingleton.instance = null
    // }

    addMessage(message: SimpleBotMessage) {
        this.messages.push(message);
    }

    getBotConversationId() {
        return this.botConversationId;
    }

    setBotConversationId(conversationId: string) {
        this.botConversationId = conversationId;
    }

    getParentMessageId() {
        Logger.log("this.messages", this.messages);
        if (this.messages?.length) {
            return this.messages[this.messages.length - 1].id;
        }
    }

    // static getInstance(globalConversationId: string): BotSessionSingleton {
    //     Logger.log("getInstance BotSessionSingleton", globalConversationId, BotSessionSingleton.globalConversationId, BotSessionSingleton.instance?.botConversationId)
    //     if (globalConversationId !== BotSessionSingleton.globalConversationId) {
    //         Logger.log()
    //         BotSessionSingleton.destroy()
    //     }
    //
    //     if (!BotSessionSingleton.instance) {
    //         BotSessionSingleton.instance = new BotSessionSingleton()
    //     }
    //
    //     BotSessionSingleton.globalConversationId = globalConversationId
    //
    //     return BotSessionSingleton.instance
    // }
}
