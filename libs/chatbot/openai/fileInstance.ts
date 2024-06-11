import {type BotFileInstance, BotSupportedMimeType, FileRef} from "~libs/chatbot/BotBase";
import {ChatError, ErrorCode} from "~utils/errors";
import {createUuid, getTimezoneOffsetMin} from "~utils";
import {OpenaiAuthSingleton} from "~libs/chatbot/openai/index";
import {OpenAIAuth} from "~libs/open-ai/open-ai-auth";
import {customChatFetch} from "~utils/custom-fetch-for-chat";
import {getUseCaseType} from "~libs/open-ai/use-case";

export const OpenAiSupportedMimeTypes  = [
    "image/jpeg", // JPEG
    "image/png", // PNG
    "image/gif", // GIF
    "image/bmp", // BMP
    "image/webp", // WebP
    "image/avif", // AVIF
    "image/svg+xml", // SVG
    "image/heic", // HEIC
    "image/heif", // HEIF
] as BotSupportedMimeType[];

interface PreUploadResponse {
    status: string
    upload_url: string
    file_id: string
}

interface AckUploadResponse {
    status: string
    download_url: string
    metadata: any
    file_name: string
    creation_time: string
}

export class OpenAiFileRef {
    id: string;
    mimeType: string;
    name: string;
    size: number;
    tokenSize: number;
    width?: number;
    height?: number;

    constructor({id, mimeType, name, size, tokenSize = 0, width, height}: {
        id: string,
        mimeType: string,
        name: string,
        size: number,
        tokenSize: number,
        width?: number,
        height?: number
    }) {
        this.id = id;
        this.mimeType = mimeType;
        this.name = name;
        this.size = size;
        this.tokenSize = tokenSize;
        this.width = width;
        this.height = height;
    }
}

interface OpenAiFileMetadata {
    id: string;
    name: string;
    creation_time: string;
    state: string;
    ready_time: string;
    size: number;
    metadata: {
        retrieval: {
            status: string;
            file_size_tokens: number;
            error_code: string;
        };
    };
    use_case: string;
    retrieval_index_status: string;
    file_size_tokens: number | null;
    variants: any[] | null;
}

interface RateLimitInfo {
    type: string;
    call_to_action: string;
    resets_after: string;
    limit_details: {
        type: string;
        feature_limit_name: string;
    };
    display_description: {
        type: string;
        description: string;
        title: string | null;
        markdown_description: string | null;
    };
}

interface ThrottledResponse {
    detail: {
        type: string;
        message: string;
        rate_limit_info: RateLimitInfo;
    };
}

export class OpenAiFileSingleton implements BotFileInstance<OpenAiFileRef> {
    refs = {} as Map<string, FileRef<OpenAiFileRef>>;
    tempRefKey: string;
    private static instance: OpenAiFileSingleton;

    getRefs(ref: string): FileRef<OpenAiFileRef> {
        return this.refs[ref] as FileRef<OpenAiFileRef>;
    }

    getRefByFile(file: File): FileRef<OpenAiFileRef> | null {
        for (const [, ref] of Object.entries(this.refs)) {
            if (ref?.file?.name === file.name) {
                return ref;
            }
        }
        return null;
    }

    static getInstance(): OpenAiFileSingleton {
        if (!OpenAiFileSingleton.instance) {
            OpenAiFileSingleton.instance = new OpenAiFileSingleton();
        }

        return OpenAiFileSingleton.instance;
    }

    private async preUpload(file: File): Promise<[ChatError | null, PreUploadResponse | null]> {
        const [err, authInfo] = await OpenaiAuthSingleton.getInstance().auth.initSessionInfo();

        if (err) {
            return [err, null];
        }

        const myHeaders = new Headers();
        myHeaders.append("authorization", "Bearer " + authInfo!.accessToken);
        myHeaders.append("oai-device-id", await OpenAIAuth.getOpenAiDeviceId());
        myHeaders.append("oai-language", "");
        myHeaders.append("content-type", "application/json");

        const raw = JSON.stringify({
            "file_name": file.name,
            "file_size": file.size,
            // todo
            "use_case": getUseCaseType(file),
            "timezone_offset_min": -getTimezoneOffsetMin(),
            "reset_rate_limits": false
        });

        const request = await customChatFetch("https://chatgpt.com/backend-api/files", {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        }, 20 * 1000);

        if (request.error) {
            try {
                const r = await request.response?.json() as ThrottledResponse;
                if(r.detail.type === 'throttled') {
                    return [new ChatError(ErrorCode.CONVERSATION_LIMIT, r.detail.message), null];
                }
            } catch (e) {
                // ignore
            }
            return [request.error, null];
        }

        try {
            const result = await request.response?.json() as PreUploadResponse;
            return [null, result];
        } catch (e) {
            return [new ChatError(ErrorCode.FILE_OTHER), null];
        }
    }

    private async upload(file: File, preUploadData: PreUploadResponse): Promise<ChatError | null> {
        const myHeaders = new Headers();
        myHeaders.append("accept", "application/json, text/plain, */*");
        myHeaders.append("content-length", file.size.toString());
        myHeaders.append("content-type", file.type);
        myHeaders.append("x-ms-blob-type", "BlockBlob");
        myHeaders.append("x-ms-version", "2020-04-08");

        const request = await customChatFetch(preUploadData.upload_url, {
            method: "PUT",
            headers: myHeaders,
            redirect: "follow",
            body: file
        }, 30 * 3000);

        if (request.error) {
            return request.error;
        }

        return null;
    }

    private async getMetaDataRecursive(fileId: string, token: string, tryCount: number): Promise<[ChatError | null, OpenAiFileMetadata | null]> {
        const myHeaders = new Headers();
        myHeaders.append("authorization", "Bearer " + token);
        myHeaders.append("oai-device-id", await OpenAIAuth.getOpenAiDeviceId());
        myHeaders.append("oai-language", "");

        const request = await customChatFetch("https://chatgpt.com/backend-api/files/" + fileId, {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        });

        if (request.error) {
            return [request.error, null];
        }

        try {
            const result = await request.response?.json() as OpenAiFileMetadata;

            if (["success", "failed"].includes(result.retrieval_index_status)) {
                return [null, result];
            }

            await new Promise(resolve => setTimeout(resolve, 2000));

            return await this.getMetaDataRecursive(fileId, token, tryCount + 1);
        } catch (e) {
            return [new ChatError(ErrorCode.FILE_OTHER), null];
        }
    }

    private async getMetadata(fileId: string): Promise<[ChatError | null, OpenAiFileMetadata | null]> {
        const [authError, authInfo] = await OpenaiAuthSingleton.getInstance().auth.initSessionInfo();

        if (authError) {
            return [authError, null];
        }

        return await this.getMetaDataRecursive(fileId, authInfo!.accessToken!, 1);
    }

    private async ackUpload(fileId: string): Promise<[ChatError | null, AckUploadResponse | null]> {
        const [err, authInfo] = await OpenaiAuthSingleton.getInstance().auth.initSessionInfo();

        if (err) {
            return [err, null];
        }

        const myHeaders = new Headers();
        myHeaders.append("accept", "*/*");
        myHeaders.append("authorization", "Bearer " + authInfo!.accessToken);
        myHeaders.append("content-type", "application/json");
        myHeaders.append("oai-device-id", await OpenAIAuth.getOpenAiDeviceId());
        myHeaders.append("oai-language", "");

        const raw = JSON.stringify({});

        const request = await customChatFetch(`https://chatgpt.com/backend-api/files/${fileId}/uploaded`, {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        });

        if (request.error) {
            return [request.error, null];
        }

        try {
            const result = await request.response?.json() as AckUploadResponse;

            if (result.status !== "success") {
                return [new ChatError(ErrorCode.FILE_OTHER), null];
            }

            return [null, result];
        } catch (e) {
            return [new ChatError(ErrorCode.FILE_OTHER), null];
        }
    }

    private async getImageSize(file: File): Promise<{ width: number, height: number }> {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            img.onload = function () {
                resolve({width: img.width, height: img.height});
            };
        });
    }

    async uploadFile(file: File, supportedTypes: BotSupportedMimeType[]): Promise<string> {
        this.tempRefKey = createUuid();

        if(!supportedTypes.includes(BotSupportedMimeType.ANY)) {
            if (file.type && !supportedTypes.includes(file.type as BotSupportedMimeType)) {
                this.refs[this.tempRefKey] = new FileRef<OpenAiFileRef>(new ChatError(ErrorCode.UPLOAD_FILE_NOT_SUPPORTED), null);
                return this.tempRefKey;
            }
        }

        const [err, preUploadRes] = await this.preUpload(file);

        if (err) {
            this.refs[this.tempRefKey] = new FileRef<OpenAiFileRef>(err, null);
            return this.tempRefKey;
        }

        const uploadErr = await this.upload(file, preUploadRes!);

        if (uploadErr) {
            this.refs[this.tempRefKey] = new FileRef<OpenAiFileRef>(uploadErr, null);
            return this.tempRefKey;
        }

        const [ackError] = await this.ackUpload(preUploadRes!.file_id);

        if (ackError) {
            this.refs[this.tempRefKey] = new FileRef<OpenAiFileRef>(ackError, null);
            return this.tempRefKey;
        }

        let metadata: OpenAiFileMetadata | null = null;
        let width: number | undefined;
        let height: number | undefined;

        if (file.type.startsWith("image")) {
            const {width: _width, height: _height} = await this.getImageSize(file);
            width = _width;
            height = _height;
        } else {
            if(file.type === BotSupportedMimeType.PDF) {
                const [metadataError, _metadata] = await this.getMetadata(preUploadRes!.file_id);

                metadata = _metadata;

                if (metadataError) {
                    this.refs[this.tempRefKey] = new FileRef<OpenAiFileRef>(metadataError, null);
                    return this.tempRefKey;
                }
            }
        }

        this.refs[this.tempRefKey] = new FileRef<OpenAiFileRef>(null, new OpenAiFileRef({
            id: preUploadRes?.file_id as string,
            mimeType: file.type,
            name: file.name,
            size: file.size,
            tokenSize: metadata?.file_size_tokens ?? 0,
            width,
            height
        }), file);

        return this.tempRefKey;
    }
}
