import {BotSession} from "~libs/chatbot/BotSessionBase";

export default class CopilotSessionSingleton {
    private static instance: CopilotSessionSingleton | undefined;
    static globalConversationId = "";
    session: BotSession;

    private constructor() {
        this.session = new BotSession(CopilotSessionSingleton.globalConversationId);
    }

    static destroy() {
        CopilotSessionSingleton.globalConversationId = "";
        CopilotSessionSingleton.instance = undefined;
    }

    static getInstance(globalConversationId: string) {
        if (globalConversationId !== CopilotSessionSingleton.globalConversationId) {
            CopilotSessionSingleton.destroy();
        }

        CopilotSessionSingleton.globalConversationId = globalConversationId;

        if (!CopilotSessionSingleton.instance) {
            CopilotSessionSingleton.instance = new CopilotSessionSingleton();
        }

        return CopilotSessionSingleton.instance;
    }
}
