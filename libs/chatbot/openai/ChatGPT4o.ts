import {OpenaiBot} from "~libs/chatbot/openai/index";
import {OpenAIAuth} from "~libs/open-ai/open-ai-auth";
import {BotSession} from "~libs/chatbot/BotSessionBase";
import type {BotCompletionParams, BotConstructorParams} from "~libs/chatbot/IBot";
import {ConversationResponse, ResponseMessageType} from "~libs/open-ai/open-ai-interface";
import {ChatError, ErrorCode} from "~utils/errors";
import {Logger} from "~utils/logger";
import {BotSupportedMimeType} from "~libs/chatbot/BotBase";

class ChatGPT4OAuthSingleton {
    private static instance: ChatGPT4OAuthSingleton;
    auth: OpenAIAuth;

    protected constructor() {
        // ignore
    }

    static getInstance(): ChatGPT4OAuthSingleton {
        if (!ChatGPT4OAuthSingleton.instance) {
            ChatGPT4OAuthSingleton.instance = new ChatGPT4OAuthSingleton();
            ChatGPT4OAuthSingleton.instance.auth = new OpenAIAuth();
        }

        return ChatGPT4OAuthSingleton.instance;
    }
}

class ChatGPT4OSessionSingleton {
    private static instance: ChatGPT4OSessionSingleton | null;
    static globalConversationId: string;
    session: BotSession;

    private constructor() {
        this.session = new BotSession(ChatGPT4OSessionSingleton.globalConversationId);
    }

    static destroy() {
        ChatGPT4OSessionSingleton.globalConversationId = "";
        ChatGPT4OSessionSingleton.instance = null;
    }

    static getInstance(globalConversationId: string) {
        if (globalConversationId !== ChatGPT4OSessionSingleton.globalConversationId) {
            ChatGPT4OSessionSingleton.destroy();
        }

        ChatGPT4OSessionSingleton.globalConversationId = globalConversationId;

        if (!ChatGPT4OSessionSingleton.instance) {
            ChatGPT4OSessionSingleton.instance = new ChatGPT4OSessionSingleton();
        }

        return ChatGPT4OSessionSingleton.instance;
    }
}

const modelSlug = "gpt-4o";

export default class ChatGPT4O extends OpenaiBot {
    static botName = 'GPT-4o';
    model = modelSlug;
    static requireLogin = true;
    static maxTokenLimit = 32 * 1000;
    static desc = 'Suitable for complex problem-solving and visual content analysis.';
    supportedUploadTypes = [BotSupportedMimeType.ANY];

    static async checkModelCanUse() {
        const modelInfo = await this.modelInfo.getModelInfo();
        Logger.log("modelInfo", modelInfo);
        if(!modelInfo) return false;

        return modelInfo.models.map(item => item.slug).includes(modelSlug) ?? false;
    }

    constructor(params: BotConstructorParams) {
        super(params);
        this.botSession = ChatGPT4OSessionSingleton.getInstance(params.globalConversationId);
        this.authInstance = ChatGPT4OAuthSingleton.getInstance();
    }

    async completion({prompt, rid, cb, fileRef}: BotCompletionParams): Promise<void> {
        const [checkErr, isLogin] = await ChatGPT4O.checkIsLogin();

        if(checkErr || !isLogin) {
            return cb(rid, new ConversationResponse({
                conversation_id: this.botSession.session.botConversationId,
                parent_message_id: this.botSession.session.getParentMessageId(),
                message_type: ResponseMessageType.ERROR,
                error: checkErr ?? new ChatError(ErrorCode.UNAUTHORIZED)
            }));
        }

        if(!await ChatGPT4O.checkModelCanUse()) {
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
        return ChatGPT4O.botName;
    }

    getRequireLogin(): boolean {
        return ChatGPT4O.requireLogin;
    }

    uploadFile(file: File): Promise<string> {
        return this.fileInstance.uploadFile(file, this.supportedUploadTypes);
    }

    getMaxTokenLimit(): number {
        return ChatGPT4O.maxTokenLimit;
    }
}
