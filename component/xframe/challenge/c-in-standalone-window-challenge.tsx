import {useEffect} from "react";
import {
    MESSAGE_ACTION_RELOAD_SITE_FRAME,
    WINDOW_FOR_REMOVE_STORAGE_KEY
} from "~utils";
import {sendToBackground} from "@plasmohq/messaging";
import {Storage} from "@plasmohq/storage";
import type {SiteName} from "~provider/sidepanel/SidePanelProvider";

export default function CInStandaloneWindowChallenge({verifySuccessValidator, siteName, checkInterval}: {
    verifySuccessValidator(): boolean,
    siteName?: SiteName,
    checkInterval?: number
}) {
    useEffect(() => {
        const storage = new Storage();
        const interval = setInterval(() => {
            if (verifySuccessValidator()) {
                clearInterval(interval);

                if(siteName) {
                    void chrome.runtime.sendMessage(chrome.runtime.id, {
                        action: MESSAGE_ACTION_RELOAD_SITE_FRAME,
                        siteName
                    });
                }

                const windowKey: string = new URLSearchParams(location.search).get(WINDOW_FOR_REMOVE_STORAGE_KEY) ?? '';

                storage.get(windowKey).then((windowId: any) => {
                    if (windowId) {
                        void sendToBackground({
                            name: "close-window",
                            body: {
                                windowId
                            },
                        });
                    }
                });
            }
        }, checkInterval ?? 200);

        return () => {
            clearInterval(interval);
        };
    }, []);

    return <div></div>;
}
