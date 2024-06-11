import {MESSAGE_ACTION_OPEN_PANEL, STORAGE_OPEN_PANEL_INIT_DATA} from "~utils";
import {Storage} from '@plasmohq/storage';
import {Logger} from "~utils/logger";
import {FileTypes} from "~options/constant/FileTypes";

export enum PromptTemplate {
    JUST_OPEN = 'JUST_OPEN',
    DEFAULT = 'DEFAULT',
    RELATED_QUESTIONS = 'RELATED_QUESTIONS',
    ASK_AI = 'ASK_AI',
    EXPLAIN = 'Explain',
    TRANSLATE = 'Translate',
    SUMMARY = 'Summarize',
    REPHRASE = 'Rephrase',
    GAMMA_CHECK = 'Gamma_check'
}

export class IAskAi {
    /** Additional information, if no value, it means there is no additional information */
    appendix?: string;
    /** Prompt template */
    prompt: string;
    /** Text used to assemble the prompt, the reference part has been merged here */
    promptText?: string | null;
    /** Language */
    lang: string;
    /** User input text or selected text for card display */
    text?: string | null;
    /** Prompt image address Note: When type=2, use ant design <icon/>, when type=1, use <img/> */
    promptImageUri?: string | null;
    /** Prompt title */
    promptImageTitle?: string | null;
    /** 1=default, 2=custom When type=2, use ant design <icon/>, when type=1, use <img/> */
    promptType?: number;
    /** [Upload resource Icon, Upload file name, refs, File type, File object] */
    uploadFile?: [string, string, Map<string, string>, FileTypes, File | null] | null;
    /** Whether there is an uploaded file */
    isHaveUploadFile?: boolean;


    constructor({appendix, prompt, promptText = null, lang, text = null, promptImageUri = null, promptImageTitle = null, promptType = 1, uploadFile = null, isHaveUploadFile = false}: {
        appendix?: string,
        prompt: string,
        promptText?: string | null,
        lang?: string,
        text?: string | null,
        promptImageUri?: string | null,
        promptImageTitle?: string | null,
        promptType?: number,
        uploadFile?: [string, string, Map<string,string>, FileTypes,File|null] | null,
        isHaveUploadFile?: boolean
    }) {
        this.prompt = prompt;
        this.promptText = promptText;
        this.lang = lang || 'en';
        this.text = text;
        this.appendix = appendix;
        this.promptImageUri = promptImageUri;
        this.promptImageTitle = promptImageTitle;
        this.promptType = promptType;
        this.uploadFile = uploadFile;
        this.isHaveUploadFile = isHaveUploadFile;
        return this;
    }
}

export const openPanelAskAi = function (askAi: IAskAi) {
    Logger.log('openPanelAskAi============', JSON.stringify(askAi));
    openPanel(OpenPanelType.AI_ASK, askAi);
};

export const openPanelSearchInContent = function (text: string) {
    Logger.log(`openPanelSearchInContent(Performing a search)============${text}`);
    openPanel(OpenPanelType.SEARCH, text);
};

export enum OpenPanelType {
    SEARCH = 'search',
    AI_ASK = 'ai_ask',
}

export interface IOpenPanelData {
    openType: OpenPanelType;
    data: IAskAi | string;
}

// when openType === search， data is string
const openPanel = function (openType: OpenPanelType, data: IAskAi | string) {
    const storage = new Storage();

    storage.set(STORAGE_OPEN_PANEL_INIT_DATA, {
        openType: openType,
        data: data
    } as IOpenPanelData).then(() => {
        void chrome.runtime.sendMessage({action: MESSAGE_ACTION_OPEN_PANEL, data: data});
    });
};

export const justOpenPanel = function () {
    void chrome.runtime.sendMessage({action: MESSAGE_ACTION_OPEN_PANEL});
};
