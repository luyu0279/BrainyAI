import {type BotFileInstance, BotSupportedMimeType, FileRef} from "~libs/chatbot/BotBase";
import { ChatError, ErrorCode} from "~utils/errors";
import {createUuid} from "~utils";

export const PerplexitySupportedMimeTypes: BotSupportedMimeType[] = [];

export class PerplexityFileSingleton implements BotFileInstance<any> {
    refs = {} as Map<string, FileRef<any>>;
    tempRefKey: string;
    private static instance: PerplexityFileSingleton;

    static getInstance(): PerplexityFileSingleton {
        if (!PerplexityFileSingleton.instance) {
            PerplexityFileSingleton.instance = new PerplexityFileSingleton();
        }

        return PerplexityFileSingleton.instance;
    }

    uploadFile(file: File, supportedTypes: BotSupportedMimeType[]): Promise<string> {
        this.tempRefKey = createUuid();

        if (file.type && !supportedTypes.includes(file.type as BotSupportedMimeType)) {
            this.refs[this.tempRefKey] = new FileRef<any>(new ChatError(ErrorCode.UPLOAD_FILE_NOT_SUPPORTED), null);
        }

        return Promise.resolve(this.tempRefKey);
    }
}
