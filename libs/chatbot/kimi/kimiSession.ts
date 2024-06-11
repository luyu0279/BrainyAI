import  {BotSession} from "~libs/chatbot/BotSessionBase";

export default class KimiSessionSingleton {
    private static instance: KimiSessionSingleton | null;
    static globalConversationId: string;
    session: BotSession;

    private constructor() {
        this.session = new BotSession(KimiSessionSingleton.globalConversationId);
    }

    static destroy() {
        KimiSessionSingleton.globalConversationId = "";
        KimiSessionSingleton.instance = null;
    }

    static getInstance(globalConversationId: string) {
        if (globalConversationId !== KimiSessionSingleton.globalConversationId) {
            KimiSessionSingleton.destroy();
        }

        KimiSessionSingleton.globalConversationId = globalConversationId;

        if (!KimiSessionSingleton.instance) {
            KimiSessionSingleton.instance = new KimiSessionSingleton();
        }

        return KimiSessionSingleton.instance;
    }
}
