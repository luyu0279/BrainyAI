import type {PlasmoCSConfig} from "plasmo";
import {useEffect} from "react";
import {MESSAGE_ACTION_SYNC_SEARCH_TEXT} from "~utils";
import {Logger} from "~utils/logger";

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    all_frames: true,
    run_at: 'document_start'
};

export default function SearchEngineContent() {
    function listenSearchEngineInput() {
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        let query = "";

        if (location.hostname.includes("www.google.com")) {
            query = urlParams.get('q') ?? "";
        }

        if (location.hostname === "www.baidu.com") {
            query = urlParams.get('wd') ?? "";
        }

        if (query) {
            Logger.log("SearchEngineContent====", query);
            void chrome.runtime.sendMessage(chrome.runtime.id, {action: MESSAGE_ACTION_SYNC_SEARCH_TEXT, data: query});
        }
    }

    useEffect(() => {
        listenSearchEngineInput();
    }, []);

    return <div>

    </div>;
}
