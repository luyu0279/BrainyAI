import  {BotSupportedMimeType} from "~libs/chatbot/BotBase";

export function checkModelSupportUploadImage(types: BotSupportedMimeType[]) {
    return !!types.find(type=> type.startsWith('image'));
}

export function checkModelSupportUploadPDF(types: BotSupportedMimeType[]) {
    return !!types.find(type=> type === BotSupportedMimeType.PDF);
}
