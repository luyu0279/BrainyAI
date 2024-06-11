export enum ErrorCode {
    CONVERSATION_LIMIT = 'CONVERSATION_LIMIT',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
    CAPTCHA = 'CAPTCHA',
    COPILOT_DISENGAGED = 'COPILOT_DISENGAGED',
    COPILOT_WEBSOCKET_ERROR = 'COPILOT_WEBSOCKET_ERROR',
    COPILOT_INVALID_REQUEST = 'COPILOT_INVALID_REQUEST',
    NETWORK_ERROR = 'NETWORK_ERROR',
    UNAUTHORIZED = 'UNAUTHORIZED',
    REQUEST_TIMEOUT_ABORT = 'REQUEST_TIMEOUT_ABORT',
    MODEL_INTERNAL_ERROR = 'MODEL_INTERNAL_ERROR',
    UPLOAD_FILE_NOT_SUPPORTED = 'UPLOAD_FILE_NOT_SUPPORTED',
    FILE_OTHER = 'FILE_OTHER',
    MODEL_NO_PERMISSION = 'MODEL_NO_PERMISSION',
    // CHATGPT_AUTH = 'CHATGPT_AUTH',
    // GPT4_MODEL_WAITLIST = 'GPT4_MODEL_WAITLIST',
    // COPILOT_UNAUTHORIZED = 'BING_UNAUTHORIZED',
    // API_KEY_NOT_SET = 'API_KEY_NOT_SET',
    // BARD_EMPTY_RESPONSE = 'BARD_EMPTY_RESPONSE',
    // BARD_UNAUTHORIZED = 'BARD_UNAUTHORIZED',
    // MISSING_POE_HOST_PERMISSION = 'MISSING_POE_HOST_PERMISSION',
    // POE_UNAUTHORIZED = 'POE_UNAUTHORIZED',
    // MISSING_HOST_PERMISSION = 'MISSING_HOST_PERMISSION',
    // XUNFEI_UNAUTHORIZED = 'XUNFEI_UNAUTHORIZED',
    // POE_MESSAGE_LIMIT = 'POE_MESSAGE_LIMIT',
    // LMSYS_SESSION_EXPIRED = 'LMSYS_SESSION_EXPIRED',
    // CHATGPT_INSUFFICIENT_QUOTA = 'CHATGPT_INSUFFICIENT_QUOTA',
    // CLAUDE_WEB_UNAUTHORIZED = 'CLAUDE_WEB_UNAUTHORIZED',
    // CLAUDE_WEB_UNAVAILABLE = 'CLAUDE_WEB_UNAVAILABLE',
    // QIANWEN_WEB_UNAUTHORIZED = 'QIANWEN_WEB_UNAUTHORIZED',
    // BAICHUAN_WEB_UNAUTHORIZED = 'BAICHUAN_WEB_UNAUTHORIZED',
    // LMSYS_WS_ERROR = 'LMSYS_WS_ERROR',
    // PPLX_FORBIDDEN_ERROR = 'PPLX_FORBIDDEN_ERROR',
    // TWITTER_UNAUTHORIZED = 'TWITTER_UNAUTHORIZED',
    // GROK_UNAVAILABLE = 'GROK_UNAVAILABLE',
    // CUSTOM_ERROR = 'CUSTOM_ERROR',
    // FORBIDDEN = 'FORBIDDEN',
}

export class ChatError {
    code: ErrorCode;
    message: string;

    constructor(code: ErrorCode, message?: string) {
        this.message = message ?? getErrorMessage(code);
        this.code = code;
    }
}

export function getErrorMessage(errorCode: ErrorCode) {
    switch (errorCode) {
    case ErrorCode.CONVERSATION_LIMIT:
        return 'Sorry, the conversation limit has been reached. Please try later.';
    case ErrorCode.UNKNOWN_ERROR:
        return 'Sorry, something went wrong. Please restart the session.';
    case ErrorCode.CAPTCHA:
        return 'Please pass the Cloudflare check.';
        // case ErrorCode.CHATGPT_UNAUTHORIZED:
        //     return 'There is no logged-in ChatGPT account in this browser.'
        // case ErrorCode.CHATGPT_AUTH:
        //     return 'ChatGPT authentication error.'
        // case ErrorCode.GPT4_MODEL_WAITLIST:
        //     return 'Sorry, the GPT-4 model is currently in a waitlist.'
        // case ErrorCode.COPILOT_UNAUTHORIZED:
        //     return 'Unauthorized access to Copilot.'
        // case ErrorCode.CAPTCHA:
        //     return 'Please solve the Captcha to access Copilot.'
    case ErrorCode.COPILOT_INVALID_REQUEST:
        return 'Please restart the Copilot session.';
        // case ErrorCode.API_KEY_NOT_SET:
        //     return 'API key not set.'
        // case ErrorCode.BARD_EMPTY_RESPONSE:
        //     return 'Bard returned an empty response.'
        // case ErrorCode.BARD_UNAUTHORIZED:
        //     return 'Unauthorized access to Bard.'
        // case ErrorCode.MISSING_POE_HOST_PERMISSION:
        //     return 'Missing permission to host Poe.'
        // case ErrorCode.POE_UNAUTHORIZED:
        //     return 'Unauthorized access to Poe.'
        // case ErrorCode.MISSING_HOST_PERMISSION:
        //     return 'Missing permission to host.'
        // case ErrorCode.XUNFEI_UNAUTHORIZED:
        //     return 'Unauthorized access to Xunfei.'
    case ErrorCode.NETWORK_ERROR:
        return 'Network error.';
        // case ErrorCode.POE_MESSAGE_LIMIT:
        //     return 'Poe message limit reached.'
        // case ErrorCode.LMSYS_SESSION_EXPIRED:
        //     return 'Lmsys session expired.'
        // case ErrorCode.CHATGPT_INSUFFICIENT_QUOTA:
        //     return 'Insufficient ChatGPT quota.'
        // case ErrorCode.CLAUDE_WEB_UNAUTHORIZED:
        //     return 'Unauthorized access to Claude Web.'
        // case ErrorCode.CLAUDE_WEB_UNAVAILABLE:
        //     return 'Claude Web is unavailable.'
        // case ErrorCode.QIANWEN_WEB_UNAUTHORIZED:
        //     return 'Unauthorized access to Qianwen Web.'
        // case ErrorCode.BAICHUAN_WEB_UNAUTHORIZED:
        //     return 'Unauthorized access to Baichuan Web.'
        // case ErrorCode.LMSYS_WS_ERROR:
        //     return 'Lmsys websocket error.'
        // case ErrorCode.PPLX_FORBIDDEN_ERROR:
        //     return 'Forbidden error.'
        // case ErrorCode.TWITTER_UNAUTHORIZED:
        //     return 'Unauthorized access to Twitter.'
        // case ErrorCode.GROK_UNAVAILABLE:
        //     return 'Grok is unavailable.'
        // case ErrorCode.CUSTOM_ERROR:
        //     return message ?? 'Unknown error.'
    case ErrorCode.REQUEST_TIMEOUT_ABORT:
        return 'Request timeout, aborted.';
    case ErrorCode.MODEL_INTERNAL_ERROR:
        return 'Some went wrong, please try again.';
    default:
        return 'Unknown error.';
    }
}
