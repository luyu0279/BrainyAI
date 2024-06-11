import {ChatError, ErrorCode} from "~utils/errors";
import {CHAT_FETCH_TIMEOUT} from "~utils/constants";
import {Logger} from "~utils/logger";

export class ChatFetchResponse {
    response?: Response;
    error?: ChatError;

    constructor(response?: Response, error?: ChatError) {
        this.response = response;
        this.error = error;
    }
}

function handleHttpStatus(response: Response): ChatFetchResponse {
    const chatResponse = new ChatFetchResponse();

    const status = response.status;

    chatResponse.response = response;

    if (status < 200 || status >= 300) {
        if (status === 403) {
            chatResponse.error = new ChatError(ErrorCode.CAPTCHA);
            Logger.log('handleHttpStatus', chatResponse.error);
        }
        else if (status === 401) chatResponse.error = new ChatError(ErrorCode.UNAUTHORIZED);
        else if (status === 429) chatResponse.error = new ChatError(ErrorCode.CONVERSATION_LIMIT);
        else chatResponse.error = new ChatError(ErrorCode.UNKNOWN_ERROR);
    }

    return chatResponse;
}

export async function customChatFetch(url: string, options?: RequestInit, timeout: number = CHAT_FETCH_TIMEOUT): Promise<ChatFetchResponse> {
    const controller = new AbortController();
    const signal = controller.signal;

    Logger.log('customChatFetch', url, options, timeout);

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {...options, signal});
        clearTimeout(timeoutId);
        return handleHttpStatus(response);
    } catch (error) {
        Logger.log('error', error);

        clearTimeout(timeoutId);
        const r = new ChatFetchResponse();

        if (error.name === 'AbortError') {
            r.error = new ChatError(ErrorCode.REQUEST_TIMEOUT_ABORT);
        } else {
            r.error = new ChatError(ErrorCode.NETWORK_ERROR);
        }

        return r;
    }
}
