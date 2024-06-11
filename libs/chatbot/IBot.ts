import {ConversationResponse} from "~libs/open-ai/open-ai-interface";

export type BotBaseCompletion = (prompt: string, rid: string, cb: ConversationResponseCb) => Promise<void>
export type ConversationResponseCb = (rid: string, m: ConversationResponse) => void;

export interface BotConstructorParams {
    globalConversationId: string
    parentMessageId?: string
}

export interface BotCompletionParams {
    prompt: string
    rid: string
    cb: ConversationResponseCb,
    fileRef?: string,
    file?: File
    forceRefresh?: boolean
}

export interface IBot {
    conversationId: string
    // parentMessageId: string
    // fileInstance: BotFileInstance<any>
    // botSession: IBotSessionSingleton

    // return [error] if not available
    startAuth(): Promise<boolean>;
    completion(params: BotCompletionParams): Promise<void>;
    startCaptcha(): Promise<boolean>;
    uploadFile(file: File): Promise<string>;
    supportedUploadTypes: string[];
    getBotName(): string;
    getRequireLogin(): boolean;
    getLogoSrc(): string;
    getLoginUrl(): string;
    getSupportUploadPDF(): boolean;
    getSupportUploadImage(): boolean;
    getMaxTokenLimit(): number;
    getPaidModel(): boolean;
    getNewModel(): boolean;
}

// export abstract class BotBase {
//     static botName = 'BotBase'
//     static logoFile = 'logo.png'
//
//     constructor(params: BotConstructorParams) {
//         this.conversationId = params.conversationId
//         this.parentMessageId = params.parentMessageId
//     }
// }
