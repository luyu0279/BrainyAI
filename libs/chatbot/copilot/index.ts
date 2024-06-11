import type {IBot, BotConstructorParams, BotCompletionParams} from "~libs/chatbot/IBot";
import {ChatError, ErrorCode} from "~utils/errors";
import type {CopilotConversation} from "~background/messages/copilot/init-copilot-conversation";
import {sendToBackground} from "@plasmohq/messaging";
import {ConversationResponse, ResponseMessageType} from "~libs/open-ai/open-ai-interface";
import {getConversationResponseFromRaw, initWss, sendFirstMessage} from "~libs/copilot/copilot-helper";
import {BotBase} from "~libs/chatbot/BotBase";
import {SimpleBotMessage} from "~libs/chatbot/BotSessionBase";
import CopilotSessionSingleton from "~libs/chatbot/copilot/copilotSession";
import IconOpenAI1 from "data-base64:~assets/simple-icons_openai-1.svg";
import {
    appendParamToUrl,
    createUuid,
    IS_OPEN_IN_CHAT_AUTH_WINDOW, IS_OPEN_IN_CHAT_CAPTCHA_WINDOW,
    MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS, MESSAGE_ACTION_CHAT_PROVIDER_CAPTCHA_SUCCESS,
    WINDOW_FOR_REMOVE_STORAGE_KEY
} from "~utils";
import {Storage} from "@plasmohq/storage";
import {Logger} from "~utils/logger";
import {CopilotFileSingleton, CopilotSupportedMimeTypes} from "~libs/chatbot/copilot/fileInstance";
import {checkModelSupportUploadImage, checkModelSupportUploadPDF} from "~libs/chatbot/utils";

export const COPILOT_BUNDLE_VERSION = "1.1725.0";

export class CopilotBot extends BotBase implements IBot {
    static botName = 'GPT-4-turbo';
    static logoSrc = IconOpenAI1;
    static desc = 'Suitable for complex problem-solving and visual content analysis.';
    static loginUrl = 'https://copilot.microsoft.com';
    static AUTH_WINDOW_KEY = 'cawk';
    static CAPTCHA_WINDOW_KEY = 'ccwk';
    static maxTokenLimit = 32 * 1000;
    static get supportUploadPDF() {
        return checkModelSupportUploadPDF(CopilotSupportedMimeTypes);
    }
    static get supportUploadImage() {
        return checkModelSupportUploadImage(CopilotSupportedMimeTypes);
    }
    tempError: ChatError;
    private fileInstance: CopilotFileSingleton;
    private fileRefs: string[];

    botSession: CopilotSessionSingleton;

    constructor(params: BotConstructorParams) {
        super(params);
        this.botSession = CopilotSessionSingleton.getInstance(params.globalConversationId);
        this.fileInstance = CopilotFileSingleton.getInstance();
    }

    get supportedUploadTypes() {
        return CopilotSupportedMimeTypes;
    }

    async uploadFile(file: File): Promise<string> {
        const [err, copilotConversation]: [ChatError, CopilotConversation] = await sendToBackground({
            name: "copilot/init-copilot-conversation",
            body: {
                conversationId: this.botSession.session.getBotConversationId(),
                withRun: true
            }
        });

        if (copilotConversation && copilotConversation.conversationId) {
            this.botSession.session.setBotConversationId(copilotConversation.conversationId);
        }

        return this.fileInstance.uploadFile(file, this.supportedUploadTypes, this.botSession.session.getBotConversationId(), err);
    }

    static checkModelCanUse(): Promise<boolean> {
        return Promise.resolve(true);
    }

    static async checkIsLogin(): Promise<[ChatError | null, boolean]> {
        return await sendToBackground({
            name: "copilot/check-login",
        });
    }

    async startAuth(): Promise<boolean> {
        const randomKey = '__window_key_' + Math.random() * 1000;
        const copilotAuthValue = createUuid();

        Logger.log("hello hello");

        const url = appendParamToUrl(appendParamToUrl(
            appendParamToUrl(CopilotBot.loginUrl, IS_OPEN_IN_CHAT_AUTH_WINDOW, '1'),
            WINDOW_FOR_REMOVE_STORAGE_KEY, randomKey
        ), CopilotBot.AUTH_WINDOW_KEY, copilotAuthValue);

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
                    if (message.authKey === copilotAuthValue) {
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(true);
                    }
                }
            };
            chrome.runtime.onMessage.addListener(listener);
        });
    }

    async completion({prompt, rid, cb, fileRef, file}: BotCompletionParams): Promise<void> {
        let fileSource = "";

        if (fileRef) {
            const refObj = this.fileInstance.getRef(fileRef);

            if (!refObj || refObj.err) {
                return cb(rid, new ConversationResponse({
                    error: refObj?.err ?? new ChatError(ErrorCode.UNKNOWN_ERROR),
                    message_type: ResponseMessageType.ERROR
                }));
            }

            Logger.trace('file ref', refObj);

            fileSource = refObj!.ref!.blobId;
        } else {
            if(file) {
                let refObj = this.fileInstance.getRefByFile(file);

                if(!refObj) {
                    const newRef = await this.uploadFile(file);
                    refObj = this.fileInstance.getRef(newRef);
                }

                if(!refObj || refObj.err) {
                    return cb(rid, new ConversationResponse({
                        error: refObj?.err || new ChatError(ErrorCode.UNKNOWN_ERROR),
                        message_type: ResponseMessageType.ERROR
                    }));
                }

                fileSource = refObj!.ref!.blobId;
            }
        }

        Logger.log('file ref', fileSource);

        Logger.log('this.botSession.getBotConversationId() copilot', this.botSession.session.getBotConversationId());

        const [err, copilotConversation]: [ChatError, CopilotConversation] = await sendToBackground({
            name: "copilot/init-copilot-conversation",
            body: {
                conversationId: this.botSession.session.getBotConversationId(),
                withRun: true
            }
        });

        if (copilotConversation && copilotConversation.conversationId) {
            this.botSession.session.setBotConversationId(copilotConversation.conversationId);
        }

        Logger.trace('copilotConversation', copilotConversation, err);

        if (err) {
            return cb(
                rid,
                new ConversationResponse({
                    conversation_id: this.botSession.session.getBotConversationId(),
                    parent_message_id: this.botSession.session.getParentMessageId(),
                    message_type: ResponseMessageType.ERROR,
                    error: err
                }
                )
            );
        }

        const [connectError, wss] = await initWss(copilotConversation);

        if (connectError) {
            const cr = new ConversationResponse({
                conversation_id: this.botSession.session.getBotConversationId(),
                message_type: ResponseMessageType.ERROR,
                error: connectError
            });

            return cb(rid, cr);
        }

        wss.onmessage = (event) => {
            const data = getConversationResponseFromRaw(event.data, copilotConversation);

            if (data) {
                if (data?.error) {
                    this.tempError = data.error;
                }

                if (!data?.error) {
                    data.error = this.tempError;
                }

                if (data) {
                    switch (data.message_type) {
                    case ResponseMessageType.DONE:
                    case ResponseMessageType.ERROR:
                        wss.close();
                        break;
                    }
                    this.botSession.session.addMessage(new SimpleBotMessage(data.message_text ?? "", data.message_id ?? ""));

                    cb(rid, data);
                }
            }

        };

        wss.onclose = () => {
            // ignore
        };

        wss.onerror = () => {
            wss.close();
        };

        sendFirstMessage(prompt, copilotConversation, wss, fileSource);
        // sendFirstMessage(prompt, copilotConversation, wss);


        return Promise.resolve(undefined);
    }

    async startCaptcha(): Promise<boolean> {
        const randomKey = '__window_key_' + Math.random() * 1000;
        const copilotCaptchaValue = createUuid();

        const url = appendParamToUrl(appendParamToUrl(
            appendParamToUrl(CopilotBot.loginUrl, IS_OPEN_IN_CHAT_CAPTCHA_WINDOW, '1'),
            WINDOW_FOR_REMOVE_STORAGE_KEY, randomKey
        ), CopilotBot.CAPTCHA_WINDOW_KEY, copilotCaptchaValue);

        const res = await sendToBackground({
            name: "open-new-window",
            body: {
                url,
                width: 1100,
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
                if (message.action === MESSAGE_ACTION_CHAT_PROVIDER_CAPTCHA_SUCCESS) {
                    Logger.trace('openaiCaptchaValue', copilotCaptchaValue, message.authKey);
                    if (message.authKey === copilotCaptchaValue) {
                        chrome.runtime.onMessage.removeListener(listener);
                        resolve(true);
                    }
                }
            };
            chrome.runtime.onMessage.addListener(listener);
        });
    }

    getBotName(): string {
        return CopilotBot.botName;
    }

    getLoginUrl(): string {
        return CopilotBot.loginUrl;
    }

    getLogoSrc(): string {
        return CopilotBot.logoSrc;
    }

    getRequireLogin(): boolean {
        return CopilotBot.requireLogin;
    }

    getSupportUploadImage(): boolean {
        return CopilotBot.supportUploadPDF;
    }

    getSupportUploadPDF(): boolean {
        return CopilotBot.supportUploadPDF;
    }

    getMaxTokenLimit(): number {
        return CopilotBot.maxTokenLimit;
    }

    getPaidModel(): boolean {
        return CopilotBot.paidModel;
    }

    getNewModel(): boolean {
        return CopilotBot.newModel;
    }
}
