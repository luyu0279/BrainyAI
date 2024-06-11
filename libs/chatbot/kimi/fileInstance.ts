import {type BotFileInstance, BotSupportedMimeType, FileRef} from "~libs/chatbot/BotBase";
import {ChatError, ErrorCode} from "~utils/errors";
import {sendToBackground} from "@plasmohq/messaging";
import {customChatFetch} from "~utils/custom-fetch-for-chat";
import {Logger} from "~utils/logger";
import {createUuid} from "~utils";
import {KimiBot} from "~libs/chatbot/kimi/index";

interface FileInfo {
    id: string;
    name: string;
    type: string;
    content_type: string;
    status: string;
    size: number;
    token_size: number;
    failed_reason?: string;
}

interface FileProcessRes {
    event: string;
    file_info: FileInfo;
    id: string;
    status: string;
}

interface LinkFileResponse {
    id: string;
    name: string;
    parent_path: string;
    type: string;
    size: number;
    status: string;
    presigned_url: string;
    text_presigned_url: string;
    uploaded_at: string; // Assuming the date is in ISO 8601 format
    created_at: string; // Assuming the date is in a specific format including timezone info
    updated_at: string; // Assuming the date is in a specific format including timezone info
}

interface KimiFilePreSignResponse {
    url: string;
    object_name: string;
}

export const KimiSupportedMimeTypes =  [
    "image/jpeg", // JPEG
    "image/png", // PNG
    "image/gif", // GIF
    "image/bmp", // BMP
    "image/webp", // WebP
    "image/avif", // AVIF
    "image/svg+xml", // SVG
    "image/heic", // HEIC
    "image/heif", // HEIF
    "text/markdown", // Markdown
    "application/pdf", // PDF
    "text/plain", // plain text
    "text/csv", // CSV
    "application/msword", // Word old version
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
    "application/vnd.ms-excel", // Excel old version
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-powerpoint", // PowerPoint
    "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PowerPoint (.pptx)
    "application/javascript", // JavaScript
    "text/x-java-source", // Java
    "text/x-go", // Go
    "text/x-csrc", // C
    "text/x-c++src", // C++
    "text/html", // HTML
    "application/json", // JSON
    "text/x-python", // Python
    "text/css", // CSS
    "text/typescript", // TypeScript
    "text/tsx", // TSX
    "application/yaml", // YAML
    "application/x-jsp", // JSP
    "application/x-httpd-php", // PHP
    "text/asp", // ASP
    "application/x-mobi", // MOBI
    "application/epub+zip" // EPUB
] as BotSupportedMimeType[];

export class KimiFileSingleton implements BotFileInstance<LinkFileResponse> {
    private static instance: KimiFileSingleton;
    refs = {} as BotFileInstance<LinkFileResponse>['refs'];
    tempRefKey: string;

    private constructor() {
        // ignore
    }

    static getInstance(): KimiFileSingleton {
        if (!KimiFileSingleton.instance) {
            KimiFileSingleton.instance = new KimiFileSingleton();
        }

        return KimiFileSingleton.instance;
    }

    getRef(key: string): FileRef<LinkFileResponse> {
        return this.refs[key];
    }

    getRefByFile(file: File): FileRef<LinkFileResponse> | null {
        for (const key in this.refs) {
            if (this.refs[key]?.file?.name === file.name) {
                return this.refs[key];
            }
        }

        return null;
    }

    private async _getSignUrl(file: File): Promise<[ChatError, KimiFilePreSignResponse]> {
        const [err, res] = await sendToBackground({
            name: "kimi/pre-sign-url",
            body: {
                fileName: file.name
            }
        });

        return [err, res];
    }

    private async preSignUploadUrl(file: File): Promise<[ChatError, KimiFilePreSignResponse | null]> {
        const [err, res] = await this._getSignUrl(file);

        if (err && err.code === ErrorCode.UNAUTHORIZED) {
            const [refreshErr] = await sendToBackground({
                name: "kimi/refresh-access-token",
            });

            if (refreshErr) {
                return [refreshErr, null];
            }

            return this._getSignUrl(file);
        }

        return [err, res];
    }

    private async parseProcess(id: string): Promise<[ChatError | null]> {
        const myHeaders = new Headers();
        myHeaders.append("content-type", "application/json");
        myHeaders.append("origin", "https://kimi.moonshot.cn");
        // todo
        myHeaders.append("r-timezone", "Asia/Shanghai");
        // myHeaders.append("x-traffic-id", "co3939ucp7fct0va4ocg");

        const accessToken = await KimiBot.getAccessToken();

        if (accessToken) {
            myHeaders.append("authorization", "Bearer " + accessToken);
        }

        const raw = JSON.stringify({
            "ids": [
                id
            ]
        });

        const request = await customChatFetch("https://kimi.moonshot.cn/api/file/parse_process", {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        });

        if(request.error) {
            return [request.error];
        }

        Logger.log('request', request);
        const stream = request?.response?.body;
        const reader = stream?.getReader();

        return new Promise((resolve) => {
            function readStream() {
                reader?.read().then(async ({done, value}) => {
                    if (done) {
                        return;
                    }

                    const enc = new TextDecoder("utf-8");
                    const str = enc.decode(value.buffer);

                    for (const line of str.split("\n")) {
                        const raw = line.replace("data: ", "").replace("\n", "");

                        try {
                            const data = JSON.parse(raw) as FileProcessRes;
                            Logger.log('data', data);

                            if(data.status === "failed") {
                                resolve([new ChatError(ErrorCode.FILE_OTHER)]);

                                return;
                            }

                            resolve([null]);
                        } catch (e) {
                            resolve([new ChatError(ErrorCode.UNKNOWN_ERROR)]);
                        }
                    }
                    readStream();
                });
            }

            readStream();
        });
    }

    private async upload(file: File, uploadUrl: string): Promise<ChatError | null> {
        const theHeaders = new Headers();
        theHeaders.append("accept", "*/*");
        theHeaders.append("content-type", file.type);
        theHeaders.append("origin", "https://kimi.moonshot.cn");
        // TODO
        theHeaders.append("r-timezone", "Asia/Shanghai");
        theHeaders.append("referer", "https://kimi.moonshot.cn/");
        theHeaders.append("Origin", "https://kimi.moonshot.cn");

        const r = await customChatFetch(uploadUrl, {
            method: "PUT",
            headers: theHeaders,
            body: file,
        });

        if (r.error) {
            return r.error;
        }

        return null;

        // try {
        //     const result = await r.response.json()
        //     res.send([null, result])
        // } catch (e) {
        //     res.send([new ChatError(ErrorCode.UNKNOWN_ERROR), null])
        // }
    }

    private async linkFile(fileName: string, objectName: string): Promise<[ChatError | null, LinkFileResponse | null]> {
        const myHeaders = new Headers();
        myHeaders.append("content-type", "application/json");
        //TODO
        myHeaders.append("r-timezone", "Asia/Shanghai");
        // myHeaders.append("x-traffic-id", "co3939ucp7fct0va4ocg");

        const accessToken = await KimiBot.getAccessToken();

        if (accessToken) {
            myHeaders.append("authorization", "Bearer " + accessToken);
        }

        const raw = JSON.stringify({
            "type": "file",
            "name": fileName,
            "object_name": objectName
        });

        const request = await customChatFetch("https://kimi.moonshot.cn/api/file", {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        });

        if (request.error) {
            return [request.error, null];
        }

        try {
            const result = await request?.response?.json();
            return [null, result];
        } catch (e) {
            return [new ChatError(ErrorCode.UNKNOWN_ERROR), null];
        }
    }

    async uploadFile(file: File, supportedTypes: BotSupportedMimeType[]): Promise<string> {
        this.tempRefKey = createUuid();

        Logger.log("file.type", file.type, supportedTypes);

        if (file.type && !supportedTypes.includes(file.type as BotSupportedMimeType)) {
            this.refs[this.tempRefKey] = new FileRef<LinkFileResponse>(new ChatError(ErrorCode.UPLOAD_FILE_NOT_SUPPORTED), null);
            return this.tempRefKey;
        }

        Logger.log('file.type', file);

        const [preSignErr, sign] = await this.preSignUploadUrl(file);

        if (preSignErr) {
            this.refs[this.tempRefKey] = new FileRef<LinkFileResponse>(preSignErr, null);
            return this.tempRefKey;
        }

        const uploadError = await this.upload(file, sign!.url);

        if (uploadError) {
            this.refs[this.tempRefKey] = new FileRef<LinkFileResponse>(uploadError, null);
            return this.tempRefKey;
        }

        const [linkErr, linkRes] = await this.linkFile(file.name, sign!.object_name);

        if (linkErr) {
            this.refs[this.tempRefKey] = new FileRef<LinkFileResponse>(linkErr, null);
            return this.tempRefKey;
        }

        const [parseErr] = await this.parseProcess(linkRes!.id);

        Logger.log('parseErr', parseErr);

        if(parseErr) {
            this.refs[this.tempRefKey] = new FileRef<LinkFileResponse>(parseErr, null);
            return this.tempRefKey;
        }

        this.refs[this.tempRefKey] = new FileRef(null, linkRes, file);

        return this.tempRefKey;
    }
}
