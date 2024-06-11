import type {PlasmoCSConfig} from "plasmo";
import CInStandaloneWindowChallenge from "~component/xframe/challenge/c-in-standalone-window-challenge";
import {
    MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS,
} from "~utils";
import {PerplexityBot} from "~libs/chatbot/perplexity/PerplexityBase";
import {Logger} from "~utils/logger";

export const config: PlasmoCSConfig = {
    matches: ['https://www.perplexity.ai/*--opaw*'],
    all_frames: true,
    run_at: 'document_start'
};

export default function PerplexityInStandaloneAuthWindow() {
    const targetSourceValidator = function () {
        const authed = document.querySelectorAll(
            "a[href='/settings/account']"
        ).length > 0;

        if(authed) {
            const perplexityAuthKey = new URLSearchParams(location.search).get(PerplexityBot.AUTH_WINDOW_KEY);

            Logger.log("perplexityAuthKey", perplexityAuthKey);
            void chrome.runtime.sendMessage(chrome.runtime.id, {
                action: MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS,
                authKey: perplexityAuthKey
            });
        }

        return authed;
    };

    return <div>
        <CInStandaloneWindowChallenge verifySuccessValidator={targetSourceValidator}/>
    </div>;
}
