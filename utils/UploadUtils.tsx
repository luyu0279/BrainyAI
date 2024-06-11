import type {IBot} from "~libs/chatbot/IBot";
import {Logger} from "~utils/logger";

export class UploadUtils {

    /**
     * @param currentBots
     * @param file
     * @param conversationId
     */
    static async uploadFiles(
        currentBots: any[],
        file: File,
        conversationId: string
    ): Promise<Map<string, string>> {
        const promises = await Promise.all(currentBots.map(async (Bot) => {
            return await UploadUtils.uploadOne(Bot, conversationId, file);
        }));
        Logger.log('uploadFiles========', promises);
        return promises.reduce((result, [name, value]) => {
            result.set(name, value);
            return result;
        }, new Map());
    }

    static async uploadOne(Bot: any, conversationId: string, file: File): Promise<[string, string]> {
        const result = await (new Bot({ globalConversationId: conversationId }) as IBot).uploadFile(file);
        Logger.log('uploadOne========', result);
        return [Bot.botName, result];
    }

    static getFileRefToken(message,name):string | undefined{
        if(message.data.isHaveUploadFile && message.data.uploadFile[2].has(name)&&message.data.uploadFile[2].get(name)){
            return message.data.uploadFile[2].get(name);
        }
        return undefined;
    }

    private static canDownload(file:File) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(true);
            reader.onerror = () => resolve(false);
            reader.readAsArrayBuffer(file);
        });
    }

    static async checkFile(file:File) {
        return await UploadUtils.canDownload(file);
    }

    static isImageFile(file: File): boolean {
        return file.type.startsWith('image/');
    }

}
