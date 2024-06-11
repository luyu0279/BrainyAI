import {OpenaiBot} from "~libs/chatbot/openai/index";
import type {BotCompletionParams, BotConstructorParams} from "../IBot";
import {OpenAIAuth} from "~libs/open-ai/open-ai-auth";
import {BotSession} from "~libs/chatbot/BotSessionBase";
import {ConversationResponse, ResponseMessageType} from "~libs/open-ai/open-ai-interface";
import {ChatError, ErrorCode} from "~utils/errors";
import {Logger} from "~utils/logger";
import {BotSupportedMimeType} from "~libs/chatbot/BotBase";

class ChatGPT4AuthSingleton {
    private static instance: ChatGPT4AuthSingleton;
    auth: OpenAIAuth;

    protected constructor() {
        // ignore
    }

    static getInstance(): ChatGPT4AuthSingleton {
        if (!ChatGPT4AuthSingleton.instance) {
            ChatGPT4AuthSingleton.instance = new ChatGPT4AuthSingleton();
            ChatGPT4AuthSingleton.instance.auth = new OpenAIAuth();
        }

        return ChatGPT4AuthSingleton.instance;
    }
}

class ChatGPT4SessionSingleton {
    private static instance: ChatGPT4SessionSingleton | null;
    static globalConversationId: string;
    session: BotSession;

    private constructor() {
        this.session = new BotSession(ChatGPT4SessionSingleton.globalConversationId);
    }

    static destroy() {
        ChatGPT4SessionSingleton.globalConversationId = "";
        ChatGPT4SessionSingleton.instance = null;
    }

    static getInstance(globalConversationId: string) {
        if (globalConversationId !== ChatGPT4SessionSingleton.globalConversationId) {
            ChatGPT4SessionSingleton.destroy();
        }

        ChatGPT4SessionSingleton.globalConversationId = globalConversationId;

        if (!ChatGPT4SessionSingleton.instance) {
            ChatGPT4SessionSingleton.instance = new ChatGPT4SessionSingleton();
        }

        return ChatGPT4SessionSingleton.instance;
    }
}

const modelSlug = "gpt-4";

export default class ChatGPT4Turbo extends OpenaiBot {
    static botName = 'GPT-4';
    static requireLogin = true;
    static desc = 'Suitable for complex problem-solving and visual content analysis.';
    static paidModel = true;
    static maxTokenLimit = 32 * 1000;
    model = modelSlug;
    supportedUploadTypes = [BotSupportedMimeType.PNG, BotSupportedMimeType.JPG, BotSupportedMimeType.JPEG, BotSupportedMimeType.GIF, BotSupportedMimeType.PDF, BotSupportedMimeType.WEBP];

    static async checkModelCanUse() {
        const modelInfo = await this.modelInfo.getModelInfo();
        Logger.log("modelInfo", modelInfo);
        if(!modelInfo) return false;

        return modelInfo.models.map(item => item.slug).includes(modelSlug) ?? false;
    }

    constructor(params: BotConstructorParams) {
        super(params);
        this.botSession = ChatGPT4SessionSingleton.getInstance(params.globalConversationId);
        this.authInstance = ChatGPT4AuthSingleton.getInstance();
    }

    async completion({prompt, rid, cb, fileRef}: BotCompletionParams): Promise<void> {
        const [checkErr, isLogin] = await ChatGPT4Turbo.checkIsLogin();
        if(checkErr || !isLogin) {
            return cb(rid, new ConversationResponse({
                conversation_id: this.botSession.session.botConversationId,
                parent_message_id: this.botSession.session.getParentMessageId(),
                message_type: ResponseMessageType.ERROR,
                error: checkErr ?? new ChatError(ErrorCode.UNAUTHORIZED)
            }));
        }

        if(!await ChatGPT4Turbo.checkModelCanUse()) {
            return cb(rid, new ConversationResponse({
                conversation_id: this.botSession.session.botConversationId,
                parent_message_id: this.botSession.session.getParentMessageId(),
                message_type: ResponseMessageType.ERROR,
                error: new ChatError(ErrorCode.MODEL_NO_PERMISSION)
            }));
        }

        return super.completion({prompt, rid, cb, fileRef});
    }

    getBotName(): string {
        return ChatGPT4Turbo.botName;
    }

    getRequireLogin(): boolean {
        return ChatGPT4Turbo.requireLogin;
    }

    getPaidModel(): boolean {
        return ChatGPT4Turbo.paidModel;
    }

    uploadFile(file: File): Promise<string> {
        return this.fileInstance.uploadFile(file, this.supportedUploadTypes);
    }

    getMaxTokenLimit(): number {
        return ChatGPT4Turbo.maxTokenLimit;
    }
}
