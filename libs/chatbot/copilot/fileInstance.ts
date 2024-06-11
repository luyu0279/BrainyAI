import {type BotFileInstance, BotSupportedMimeType, FileRef} from "~libs/chatbot/BotBase";
import { ChatError, ErrorCode} from "~utils/errors";
import {sendToBackground} from "@plasmohq/messaging";
import {createUuid} from "~utils";
import {Logger} from "~utils/logger";

interface CopilotUploadResponse {
    blobId: string;
    processedBlobId: string;
}

export const CopilotSupportedMimeTypes: BotSupportedMimeType[] = [
    BotSupportedMimeType.JPG,
    BotSupportedMimeType.JPEG,
    BotSupportedMimeType.PNG,
    BotSupportedMimeType.GIF,
    BotSupportedMimeType.WEBP
];

export class CopilotFileSingleton implements BotFileInstance<CopilotUploadResponse> {
    private static instance: CopilotFileSingleton;
    private tempRefKey: string;
    refs = {} as BotFileInstance<CopilotUploadResponse>['refs'];

    static getInstance(): CopilotFileSingleton {
        if (!CopilotFileSingleton.instance) {
            CopilotFileSingleton.instance = new CopilotFileSingleton();
        }

        return CopilotFileSingleton.instance;
    }

    private convertImageToBase64(image: File): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(image);
        });
    }

    async uploadFile(file: File, supportedTypes: BotSupportedMimeType[], conversationId: string, initErr: ChatError): Promise<string> {
        this.tempRefKey = createUuid();

        if(initErr) {
            this.refs[this.tempRefKey] = new FileRef<CopilotUploadResponse>(initErr, null);
            return this.tempRefKey;
        }

        if (file.type && !supportedTypes.includes(file.type as BotSupportedMimeType)) {
            this.refs[this.tempRefKey] = new FileRef<CopilotUploadResponse>(new ChatError(ErrorCode.UPLOAD_FILE_NOT_SUPPORTED), null);
            return this.tempRefKey;
        }

        Logger.log('file', file);
        Logger.log(await this.convertImageToBase64(file));

        const imageBase64 = (await this.convertImageToBase64(file)).split(',')[1];

        const [err, uploadRes]: [ChatError, CopilotUploadResponse] = await sendToBackground({
            name: "copilot/upload-file",
            body: {
                conversationId: conversationId,
                imageBase64
            }
        });

        if(err) {
            this.refs[this.tempRefKey] = new FileRef<CopilotUploadResponse>(err, null);
            return this.tempRefKey;
        }

        this.refs[this.tempRefKey] = new FileRef<CopilotUploadResponse>(null, uploadRes, file);

        return this.tempRefKey;
    }

    getRef(key: string): FileRef<CopilotUploadResponse> | null{
        return this.refs[key];
    }

    getRefByFile(file: File): FileRef<CopilotUploadResponse> | null {
        for(const key in this.refs) {
            if(this.refs[key]?.file?.name === file.name) {
                return this.refs[key];
            }
        }

        return null;
    }
}
