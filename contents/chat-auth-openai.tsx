import type {PlasmoCSConfig} from "plasmo";
import {
    MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS, WINDOW_FOR_REMOVE_STORAGE_KEY,
} from "~utils";
import {Logger} from "~utils/logger";
import {OpenaiBot} from "~libs/chatbot/openai";
import {useEffect} from "react";
import {sendToBackground} from "@plasmohq/messaging";
import {Storage} from "@plasmohq/storage";
export const config: PlasmoCSConfig = {
    matches: ['https://chatgpt.com/*', "https://chat.openai.com/*"],
    all_frames: true,
    run_at: 'document_end'
};

const THE_AUTH_KEY = "___openaiAuthKey";
const THE_WINDOW_ID = "___openaiWindowId";

export default function OpenaiStandaloneAuthWindow() {
    useEffect(() => {
        let interval: NodeJS.Timeout;

        void setKeys().then(() => {
            Logger.trace('ooo openaiAuthKey');
            const {openaiAuthKey, windowId} = getKeys();
            Logger.trace('ooo openaiAuthKey 1', openaiAuthKey);
            Logger.trace('ooo windowId 1', windowId);
            Logger.trace('ooo sessionStorage.getItem(THE_AUTH_KEY)', sessionStorage.getItem(THE_AUTH_KEY));
            if (openaiAuthKey && windowId) {
                interval = setInterval(() => {
                    if (targetSourceValidator()) {
                        clearInterval(interval);
                        Logger.trace('ooo remove key');
                        resetKeys();

                        Logger.trace('ooo openaiAuthKey', openaiAuthKey);
                        Logger.trace('ooo windowId', windowId);

                        void chrome.runtime.sendMessage(chrome.runtime.id, {
                            action: MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS,
                            authKey: openaiAuthKey
                        });

                        if (windowId) {
                            Logger.trace('ooo sendToBackground');
                            void sendToBackground({
                                name: "close-window",
                                body: {
                                    windowId
                                },
                            });
                        }
                    }
                }, 200);
            }
        });

        return () => {
            clearInterval(interval);
        };
    }, []);


    const resetKeys = function () {
        void sessionStorage.removeItem(THE_AUTH_KEY);
        void sessionStorage.removeItem(THE_WINDOW_ID);
    };

    const setKeys = async function () {
        const openaiAuthKey = new URLSearchParams(location.search).get(OpenaiBot.AUTH_WINDOW_KEY);
        const windowKey: string = new URLSearchParams(location.search).get(WINDOW_FOR_REMOVE_STORAGE_KEY) ?? '';

        const pStorage = new Storage();
        const windowId = await pStorage.get(windowKey);

        Logger.trace('ooo setKeys', openaiAuthKey, windowId);

        if (openaiAuthKey && windowId) {
            void sessionStorage.setItem(THE_AUTH_KEY, openaiAuthKey);
            void sessionStorage.setItem(THE_WINDOW_ID, windowId);
        }
    };

    const getKeys = function () {
        return {
            openaiAuthKey: sessionStorage.getItem(THE_AUTH_KEY),
            windowId: sessionStorage.getItem(THE_WINDOW_ID)
        };
    };

    const targetSourceValidator = function () {
        let authed = false;

        const t = document.querySelectorAll('.rounded-sm');

        for (const tElement of t) {
            if (tElement.getAttribute("alt")?.toLowerCase() === "user") {
                return authed = true;
            }
        }

        return authed;
    };

    return <div id={'boa'}>
    </div>;
}
