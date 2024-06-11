import type {BotConstructorParams} from "~libs/chatbot/IBot";
import type {ChatError} from "~utils/errors";

export class FileRef<T> {
    err: any;
    ref: T | null;
    file?: File;

    constructor(err: any, ref: T | null, file?: File) {
        this.err = err;
        this.ref = ref;
        this.file = file;
    }
}


export enum BotSupportedMimeType {
    PDF = 'application/pdf',
    PNG = 'image/png',
    JPEG = 'image/jpeg',
    JPG = 'image/jpg',
    GIF = 'image/gif',
    TXT = 'text/plain',
    WEBP = 'image/webp',
    ANY = "*"
}

export const getLabelFromMimeType = (mimeType: BotSupportedMimeType) => {
    switch (mimeType) {
    case BotSupportedMimeType.PDF:
        return 'PDF';
    case BotSupportedMimeType.PNG:
        return 'PNG';
    case BotSupportedMimeType.JPEG:
    case BotSupportedMimeType.JPG:
        return 'JPG';
    case BotSupportedMimeType.TXT:
        return 'TXT';
    }
};

export interface BotFileInstance<T> {
    refs: Map<string, FileRef<T>>
    uploadFile: (file: File, supportedTypes: BotSupportedMimeType[], conversationId?: string, initErr?: ChatError) => Promise<string>
}

export abstract class BotBase {
    static botName = 'BotBase';
    static logoSrc = 'logo.png';
    static loginUrl = '';
    static requireLogin = true;
    static supportUploadPDF = false;
    static supportUploadImage = false;
    static desc = "";
    static maxTokenLimit = 2048;
    static paidModel = false;
    static newModel = false;
    conversationId: BotConstructorParams['globalConversationId'];
    parentMessageId: BotConstructorParams['parentMessageId'];

    static checkIsLogin(): Promise<[ChatError | null, boolean]> {
        return Promise.resolve([null, false]);
    }

    static checkModelCanUse(): Promise<boolean> {
        return Promise.resolve(true);
    }

    protected constructor(params: BotConstructorParams) {
        this.conversationId = params.globalConversationId;
        this.parentMessageId = params.parentMessageId;
    }
}
