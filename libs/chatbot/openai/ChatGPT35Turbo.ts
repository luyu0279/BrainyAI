import {OpenaiBot} from "~libs/chatbot/openai/index";
import {OpenAIAuth} from "~libs/open-ai/open-ai-auth";
import {BotSession} from "~libs/chatbot/BotSessionBase";
import type { BotConstructorParams} from "~libs/chatbot/IBot";
import {Logger} from "~utils/logger";
import {checkModelSupportUploadImage, checkModelSupportUploadPDF} from "~libs/chatbot/utils";

class ChatGPT35TurboAuthSingleton {
    private static instance: ChatGPT35TurboAuthSingleton;
    auth: OpenAIAuth;

    protected constructor() {
        // ignore
    }

    static getInstance(): ChatGPT35TurboAuthSingleton {
        if (!ChatGPT35TurboAuthSingleton.instance) {
            ChatGPT35TurboAuthSingleton.instance = new ChatGPT35TurboAuthSingleton();
            ChatGPT35TurboAuthSingleton.instance.auth = new OpenAIAuth();
        }

        return ChatGPT35TurboAuthSingleton.instance;
    }
}

class ChatGPT35TurboSessionSingleton {
    private static instance: ChatGPT35TurboSessionSingleton | null;
    static globalConversationId: string;
    session: BotSession;

    private constructor() {
        this.session = new BotSession(ChatGPT35TurboSessionSingleton.globalConversationId);
    }

    static destroy() {
        ChatGPT35TurboSessionSingleton.globalConversationId = "";
        ChatGPT35TurboSessionSingleton.instance = null;
    }

    static getInstance(globalConversationId: string) {
        if (globalConversationId !== ChatGPT35TurboSessionSingleton.globalConversationId) {
            ChatGPT35TurboSessionSingleton.destroy();
        }

        ChatGPT35TurboSessionSingleton.globalConversationId = globalConversationId;

        if (!ChatGPT35TurboSessionSingleton.instance) {
            ChatGPT35TurboSessionSingleton.instance = new ChatGPT35TurboSessionSingleton();
        }

        return ChatGPT35TurboSessionSingleton.instance;
    }
}

const modelSlug = "text-davinci-002-render-sha";

export default class ChatGPT35Turbo extends OpenaiBot {
    static botName = 'GPT-3.5-turbo';
    model = modelSlug;
    static requireLogin = false;
    static desc = 'Suitable for general dialogue and basic text generation.';
    supportedUploadTypes = [];

    static async checkModelCanUse() {
        const modelInfo = await this.modelInfo.getModelInfo();
        Logger.trace("modelInfo", modelInfo);
        if(!modelInfo) return false;

        return modelInfo.models.map(item => item.slug).includes(modelSlug) ?? false;
    }

    constructor(params: BotConstructorParams) {
        super(params);
        this.botSession = ChatGPT35TurboSessionSingleton.getInstance(params.globalConversationId);
        this.authInstance = ChatGPT35TurboAuthSingleton.getInstance();
    }

    static get supportUploadPDF() {
        return checkModelSupportUploadPDF([]);
    }

    static get supportUploadImage() {
        return checkModelSupportUploadImage([]);
    }

    getBotName(): string {
        return ChatGPT35Turbo.botName;
    }

    getRequireLogin(): boolean {
        return ChatGPT35Turbo.requireLogin;
    }

    uploadFile(file: File): Promise<string> {

        return this.fileInstance.uploadFile(file, this.supportedUploadTypes);
    }
}
