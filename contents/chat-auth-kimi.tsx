import type {PlasmoCSConfig} from "plasmo";
import CInStandaloneWindowChallenge from "~component/xframe/challenge/c-in-standalone-window-challenge";
import {
    MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS,
} from "~utils";
import {KimiBot} from "~libs/chatbot/kimi";
import {Logger} from "~utils/logger";

export const config: PlasmoCSConfig = {
    matches: ['https://*.kimi.moonshot.cn/*--opaw*'],
    all_frames: true,
    run_at: 'document_start'
};

export default function KimiInStandaloneAuthWindow() {
    const targetSourceValidator = function () {
        const accessToken = localStorage.getItem("access_token");
        const refreshToken = localStorage.getItem("refresh_token");

        const authed = !!accessToken && !!refreshToken;

        if(authed) {
            KimiBot.setAccessToken(accessToken);
            KimiBot.setRefreshToken(refreshToken);

            const kimiAuthKey = new URLSearchParams(location.search).get(KimiBot.AUTH_WINDOW_KEY);
            Logger.log("kimiAuthKey", kimiAuthKey);
            void chrome.runtime.sendMessage(chrome.runtime.id, {
                action: MESSAGE_ACTION_CHAT_PROVIDER_AUTH_SUCCESS,
                authKey: kimiAuthKey
            });
        }


        return authed;
    };

    return <div>
        <CInStandaloneWindowChallenge checkInterval={1500} verifySuccessValidator={targetSourceValidator}/>
    </div>;
}
