import type { Dispatch, SetStateAction } from "react";

export const R_SCP_PARAM = '--r-csp';
export const IS_OPEN_IN_PLUGIN = '--opis';
export const IS_OPEN_IN_CHALLENGE_WINDOW = '--oppcw';
export const IS_OPEN_IN_CHAT_AUTH_WINDOW = '--opaw';
export const IS_OPEN_IN_CHAT_CAPTCHA_WINDOW = '--oiccw';
export const WINDOW_FOR_REMOVE_STORAGE_KEY = '--o_wk';
export const MESSAGE_ACTION_SYNC_SEARCH_TEXT = 'sync_search_text';
export const DEVV_SEARCH_KEY = '--devvss';
export const MESSAGE_ACTION_SHOULD_RELOAD_PERPLEXITY_IN_PANEL = 'should_reload_perplexity_in_panel';
export const MESSAGE_ACTION_SHOULD_RELOAD_PHIND_IN_PANEL = 'should_reload_phind_in_panel';
export const MESSAGE_ACTION_CLOSE_WINDOW_WITH_ID = 'close_window_with_id';
export const MESSAGE_ACTION_RELOAD_SITE_FRAME = 'reload_site_frame';
export const MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS = 'auth_success';
export const MESSAGE_ACTION_CHAT_PROVIDER_CAPTCHA_SUCCESS = 'captcha_success';
export const MESSAGE_ACTION_SET_PANEL_OPEN_OR_NOT = 'set_panel_open_or_not';
export const MESSAGE_ACTION_SET_QUOTING_SELECTION_TEXT = 'set_quoting_selection_text';
export const MESSAGE_ACTION_SET_QUOTING_CANCEL = 'set_quoting_selection_text_cancel';
export const MESSAGE_ACTION_SET_QUOTING_SELECTION_CLEAR_CURSOR = 'set_quoting_selection_text_clear_cursor';
export const MESSAGE_CHECK_PANEL_IS_OPEN = 'message_check_panel_is_open';
export const STORAGE_WILL_REMOVED_WINDOW_KEY = 'will_removed_window_key';
export const STORAGE_OPEN_PANEL_INIT_DATA = 'open_panel_init_data';
export const STORAGE_OPEN_AI_DEVICE_ID = 'open_ai_device_id';
export const MESSAGE_ACTION_OPEN_PANEL = 'message_open_panel';
export const MESSAGE_PANEL_OPENED_PING_FROM_PANEL = 'MESSAGE_PANEL_OPENED_PING_FROM_PANEL';
export const MESSAGE_ACTION_OPEN_PANEL_WITH_SEARCH_TEXT = 'open_panel_with_search_text';
export const MESSAGE_ACTION_OPEN_PANEL_ASK_AI = 'open_panel_ask_ai_default';
export const MESSAGE_UPDATE_PANEL_INIT_DATA = 'update_panel_init_data';
export const PORT_LISTEN_PANEL_CLOSED_KEY = 'listen_panel_closed_key';

export const STORAGE_PANEL_OPEN_DATA_KEY = 'panel_open_data_key';
export const PROMPT_PLACEHOLDER_TEXT = "${texts}";
export const PROMPT_PLACEHOLDER_LANG = "${lang}";

export const getGoogleQuery = function (url: string): string  {
    if (url.indexOf('www.google.com') === -1) {
        return "";
    }

    const urlObj = new URL(url);
    const urlParams = urlObj.searchParams;
    return urlParams.get('q') ?? "";
};

export const appendParamToUrl = function appendParamToUrl(url: string, paramKey: string, paramValue: any) {
    // Check if URL already has a query string
    const hasQuery = url.includes('?');

    // Use '&' if query exists, '?' if not
    const separator = hasQuery ? '&' : '?';

    // Encode the parameter value to ensure special characters do not break the URL structure
    const encodedValue = encodeURIComponent(paramValue);

    // Append and return the complete URL
    return url + separator + paramKey + '=' + encodedValue;
};

export const addCspParamsToUrl = function addCspParams(url: string) {
    return appendParamToUrl(url, R_SCP_PARAM, 1);
};

export const addMobileHeaderToUrl = function addMobileHeader(url: string) {
    return appendParamToUrl(url, '--in-mobile', 1);
};

export const openInPlugin = function (url: string) {
    return url.includes(IS_OPEN_IN_PLUGIN);
};

export const btoaObj = function (obj: any) {
    for (const key in obj) {
        obj[key] = btoa(obj[key].toString());
    }

    return obj;
};

export const atobObj = function (obj: any) {
    for (const key in obj) {
        obj[key] = atob(obj[key]);
    }

    return obj;
};

export const getLatestState = function<T> (dispatch: Dispatch<SetStateAction<T>>):Promise<T> {
    return new Promise<T>( (resolve) => {
        dispatch(prevState => {
            resolve(prevState);

            return prevState;
        });
    });
};


export const createUuid = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const openWindowInFrontend = function (href: string) {
    chrome.windows.getCurrent(function (currentWindow) {
        void chrome.windows.create({
            url: href,
            left: currentWindow.left,
            top: currentWindow.top,
            width: currentWindow.width,
            height: currentWindow.height,
            type: 'normal'
        });
    });
};

type DebounceFunction<T extends (...args: any[]) => any> = (...args: Parameters<T>) => void;

export function debounce<T extends (...args: any[]) => any>(
    callback: T,
    wait: number,
): DebounceFunction<T> {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const debounced: DebounceFunction<T> = (...args: Parameters<T>) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            callback(...args);
        }, wait);
    };

    return debounced;
}

export function getCookiesInBackendByDomain(domain: string): Promise<string> {
    return new Promise((resolve) => {
        // .perplexity.ai
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        chrome.cookies.getAll({domain , partitionKey: {
            // topLevelSite: "https://perplexity.ai",
        }}, (cookies) => {
            resolve(cookies.map(item => {
                return `${item.name}=${item.value}`;
            }).join(";"));
        });
    });
}

export function getTimezoneOffsetMin() {
    const now = new Date();

    const timezoneOffsetMin = now.getTimezoneOffset();

    return -timezoneOffsetMin;
}
