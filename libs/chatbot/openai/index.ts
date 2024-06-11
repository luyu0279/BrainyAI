import {
    type IBot, type BotConstructorParams,
    type BotCompletionParams,
} from "~libs/chatbot/IBot";
import {ConversationResponse,  ResponseMessageType} from "~libs/open-ai/open-ai-interface";
import {OpenAIAuth} from "~libs/open-ai/open-ai-auth";
import {OpenAiApi} from "~libs/open-ai/open-ai-api";
import {ChatError, ErrorCode} from "~utils/errors";
import {BotBase, BotSupportedMimeType} from "~libs/chatbot/BotBase";
import {BotSession, SimpleBotMessage} from "~libs/chatbot/BotSessionBase";
import IconOpenAI from "data-base64:~assets/simple-icons_openai.svg";
import {sendToBackground} from "@plasmohq/messaging";
import  ArkoseGlobalSingleton from "~libs/chatbot/openai/Arkose";
import {Logger} from "~utils/logger";
import {
    appendParamToUrl,
    createUuid, IS_OPEN_IN_CHAT_AUTH_WINDOW,
    IS_OPEN_IN_CHAT_CAPTCHA_WINDOW, IS_OPEN_IN_PLUGIN, MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS,
    MESSAGE_ACTION_CHAT_PROVIDER_CAPTCHA_SUCCESS, R_SCP_PARAM,
    WINDOW_FOR_REMOVE_STORAGE_KEY
} from "~utils";
import XFramePerplexityChat from "~component/xframe/perplexity-chat";
import {OpenAiFileRef, OpenAiFileSingleton} from "~libs/chatbot/openai/fileInstance";
import {OpenAiUserModelInfoSingleton} from "~libs/chatbot/openai/ModelInstance";
import {Storage} from "@plasmohq/storage";

export class OpenaiAuthSingleton {
    private static instance: OpenaiAuthSingleton;
    auth: OpenAIAuth;

    protected constructor() {
        // ignore
    }

    static getInstance(): OpenaiAuthSingleton {
        if (!OpenaiAuthSingleton.instance) {
            OpenaiAuthSingleton.instance = new OpenaiAuthSingleton();
            OpenaiAuthSingleton.instance.auth = new OpenAIAuth();
        }

        return OpenaiAuthSingleton.instance;
    }
}

class OpenAiSessionSingleton {
    private static instance: OpenAiSessionSingleton | null;
    static globalConversationId: string;
    session: BotSession;

    private constructor() {
        this.session = new BotSession(OpenAiSessionSingleton.globalConversationId);
    }

    static destroy() {
        OpenAiSessionSingleton.globalConversationId = "";
        OpenAiSessionSingleton.instance = null;
    }

    static getInstance(globalConversationId: string) {
        if (globalConversationId !== OpenAiSessionSingleton.globalConversationId) {
            OpenAiSessionSingleton.destroy();
        }

        OpenAiSessionSingleton.globalConversationId = globalConversationId;

        if (!OpenAiSessionSingleton.instance) {
            OpenAiSessionSingleton.instance = new OpenAiSessionSingleton();
        }

        return OpenAiSessionSingleton.instance;
    }
}


export class OpenaiBot extends BotBase implements IBot {
    model = "text-davinci-002-render-sha";
    static logoSrc = IconOpenAI;
    static loginUrl = 'https://chatgpt.com';
    static requireLogin = true;
    static CAPTCHA_WINDOW_KEY = 'oai_captcha_window_key';
    static maxTokenLimit = 8191;
    static AUTH_WINDOW_KEY = 'oawk';
    static supportUploadPDF = true;
    static supportUploadImage = true;
    botSession: OpenAiSessionSingleton;
    authInstance: OpenaiAuthSingleton;
    arkoseInstance: ArkoseGlobalSingleton;
    private messageText: string;
    private messageID: string;
    static modelInfo = OpenAiUserModelInfoSingleton.getInstance();
    fileInstance: OpenAiFileSingleton;

    constructor(params: BotConstructorParams) {
        super(params);
        this.botSession = OpenAiSessionSingleton.getInstance(params.globalConversationId);
        this.authInstance = OpenaiAuthSingleton.getInstance();
        this.arkoseInstance = ArkoseGlobalSingleton.getInstance();
        this.fileInstance = OpenAiFileSingleton.getInstance();
    }

    static async checkIsLogin(): Promise<[ChatError | null, boolean]> {
        if(OpenaiAuthSingleton.getInstance().auth.authSessionInfo?.accessToken) {
            return Promise.resolve([null, true]);
        }

        const [err] = await OpenaiAuthSingleton.getInstance().auth.initSessionInfo();

        Logger.trace('checkIsLogin', err);

        if(err) {
            return [err, false];
        }

        return [null, !!OpenaiAuthSingleton.getInstance().auth.authSessionInfo?.accessToken];
    }

    async startAuth(): Promise<boolean> {
        const randomKey = '__window_key_' + Math.random() * 1000;
        const openAiAuthValue = createUuid();

        const url = appendParamToUrl(appendParamToUrl(
            appendParamToUrl(OpenaiBot.loginUrl, IS_OPEN_IN_CHAT_AUTH_WINDOW, '1'),
            WINDOW_FOR_REMOVE_STORAGE_KEY, randomKey
        ), OpenaiBot.AUTH_WINDOW_KEY, openAiAuthValue);

        const res = await sendToBackground({
            name: "open-new-window",
            body: {
                url,
                width: 800,
                height: 660,
                focused: true,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height
            },
        });

        const storage = new Storage();
        await storage.set(randomKey, res);
        return new Promise((resolve) => {
            const listener = function (message: any) {
                if (message.action === MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS) {
                    if (message.authKey === openAiAuthValue) {
                        Logger.trace('openAiAuthValue success', openAiAuthValue, message.authKey);
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(true);
                    }
                }
            };
            chrome.runtime.onMessage.addListener(listener);
        });
    }

    async completion({prompt, rid, cb, fileRef, file}: BotCompletionParams): Promise<void> {
        // await sendToBackground({
        //     name: "fix-partition-cookie",
        //     body: {
        //         domain: "chatgpt.com",
        //         url: "https://chatgpt.com"
        //     },
        // });
        let ref: OpenAiFileRef | null = null;

        if (fileRef) {
            const refObj = this.fileInstance.getRefs(fileRef);

            Logger.trace('refObj', refObj);

            if (!refObj || refObj.err) {
                return cb(rid, new ConversationResponse({
                    error: refObj?.err ?? new ChatError(ErrorCode.UNKNOWN_ERROR),
                    message_type: ResponseMessageType.ERROR
                }));
            }

            ref = refObj!.ref;
        } else {
            if(file) {
                let refObj = this.fileInstance.getRefByFile(file);

                if(!refObj) {
                    const newRef = await this.uploadFile(file);
                    refObj = this.fileInstance.getRefs(newRef);
                }

                if(!refObj || refObj.err) {
                    return cb(rid, new ConversationResponse({
                        error: refObj?.err || new ChatError(ErrorCode.UNKNOWN_ERROR),
                        message_type: ResponseMessageType.ERROR
                    }));
                }

                ref = refObj!.ref;
            }
        }

        Logger.trace('openai completion', ref);

        const opeAiAuthInstance = this.authInstance;
        const [err] = await opeAiAuthInstance.auth.init();

        if (err) {
            Logger.trace('openai auth error 123', err);
            cb(
                rid,
                new ConversationResponse({
                    conversation_id: this.botSession.session.botConversationId,
                    parent_message_id: this.botSession.session.getParentMessageId(),
                    message_type: ResponseMessageType.ERROR,
                    error: err
                }
                )
            );

            return;
        }

        const openAiApi = new OpenAiApi(opeAiAuthInstance.auth, this.model);

        // refresh requirements
        const [requirementsErr] = await openAiApi.chatRequirement();

        if (requirementsErr) {
            cb(
                rid,
                new ConversationResponse({
                    conversation_id: this.botSession.session.botConversationId,
                    parent_message_id: this.botSession.session.getParentMessageId(),
                    message_type: ResponseMessageType.ERROR,
                    error: requirementsErr
                }
                )
            );

            return;
        }

        if (openAiApi.requirementsData.arkose.required) {
            await this.arkoseInstance.loadArkoseScript(openAiApi.requirementsData);
            Logger.log('openAiApi.requirementsData', openAiApi.requirementsData);
        }

        void openAiApi.conversation((message) => {
            try {
                cb(
                    rid,
                    {
                        ...message,
                    }
                );

                if (message?.message_text) {
                    this.messageText = message.message_text;
                }

                if (message?.message_id) {
                    this.messageID = message.message_id;
                }

                if (message?.message_type === ResponseMessageType.DONE) {
                    this.botSession.session.addMessage(new SimpleBotMessage(this.messageText, this.messageID));
                }

                if (message?.conversation_id) {
                    this.botSession.session.setBotConversationId(message.conversation_id);
                }
            } catch (e) {
                cb(rid, new ConversationResponse(
                    {
                        conversation_id: this.botSession.session.botConversationId,
                        parent_message_id: this.botSession.session.getParentMessageId(),
                        message_type: ResponseMessageType.ERROR,
                        error: new ChatError(ErrorCode.UNKNOWN_ERROR, e.toString())
                    }
                ));
            }
        }, prompt, this.botSession.session.getParentMessageId(), this.botSession.session.botConversationId, ref);
    }

    async startCaptcha(): Promise<boolean> {
        const randomKey = '__window_key_' + Math.random() * 1000;
        const openaiCaptchaValue = createUuid();

        const url =
            appendParamToUrl(
                appendParamToUrl(
                    appendParamToUrl(
                        appendParamToUrl(
                            appendParamToUrl(OpenaiBot.loginUrl, IS_OPEN_IN_CHAT_CAPTCHA_WINDOW, '1'),
                            WINDOW_FOR_REMOVE_STORAGE_KEY, randomKey
                        ), OpenaiBot.CAPTCHA_WINDOW_KEY, openaiCaptchaValue), R_SCP_PARAM, "1"), IS_OPEN_IN_PLUGIN, "1");

        //     appendParamToUrl(appendParamToUrl(
        //     appendParamToUrl(OpenaiBot.loginUrl, IS_OPEN_IN_CHAT_CAPTCHA_WINDOW, '1'),
        //     WINDOW_FOR_REMOVE_STORAGE_KEY, randomKey
        // ), OpenaiBot.CAPTCHA_WINDOW_KEY, openaiCaptchaValue);

        // const res = await sendToBackground({
        //     name: "open-new-window",
        //     body: {
        //         url,
        //         width: 1100,
        //         height: 660,
        //         focused: true,
        //         screenWidth: window.screen.width,
        //         screenHeight: window.screen.height
        //     },
        // });

        const frame = new XFramePerplexityChat(url);
        frame.render();

        // const storage = new Storage();
        // await storage.set(randomKey, res);

        return new Promise((resolve) => {
            const listener = function (message: any) {
                Logger.log('openaiCaptchaValue', openaiCaptchaValue, message.authKey);
                if (message.action === MESSAGE_ACTION_CHAT_PROVIDER_CAPTCHA_SUCCESS) {
                    if (message.authKey === openaiCaptchaValue) {
                        frame.destroy();
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(true);
                    }
                }
            };
            chrome.runtime.onMessage.addListener(listener);
        });
    }

    supportedUploadTypes: BotSupportedMimeType[] = [];

    uploadFile(file: File): Promise<string> {
        return this.fileInstance.uploadFile(file, this.supportedUploadTypes);
    }

    getBotName(): string {
        return OpenaiBot.botName;
    }

    getLoginUrl(): string {
        return OpenaiBot.loginUrl;
    }

    getLogoSrc(): string {
        return OpenaiBot.logoSrc;
    }

    getRequireLogin(): boolean {
        return OpenaiBot.requireLogin;
    }

    getSupportUploadImage(): boolean {
        return OpenaiBot.supportUploadImage;
    }

    getSupportUploadPDF(): boolean {
        return OpenaiBot.supportUploadPDF;
    }

    getMaxTokenLimit(): number {
        return OpenaiBot.maxTokenLimit;
    }

    getPaidModel(): boolean {
        return OpenaiBot.paidModel;
    }

    getNewModel(): boolean {
        return OpenaiBot.newModel;
    }
}

