import {useEffect, useState} from "react";
import {
    appendParamToUrl,
    IS_OPEN_IN_CHALLENGE_WINDOW,
    openInPlugin,
    WINDOW_FOR_REMOVE_STORAGE_KEY
} from "~utils";
import {sendToBackground} from "@plasmohq/messaging";
import {getSearchSiteByName, SiteName} from "~provider/sidepanel/SidePanelProvider";
import { Storage } from "@plasmohq/storage";
import XFrameDialog from "~component/xframe/dialog";

export default function CInPanelChallenge({siteName}: {siteName: SiteName}) {
    const [shouldShowDialog, setShouldShowDialog] = useState(false);

    const checkInCloudflareChallenge = function () {
        if (!shouldShowDialog) {
            if (document.querySelector("#challenge-error-title")) {
                setShouldShowDialog(true);
            }
        }
    };

    const openNewWindow = async function () {
        const randomKey = '__window_key_' + Math.random() * 1000;

        const res = await sendToBackground({
            name: "open-new-window",
            body: {
                url: appendParamToUrl(appendParamToUrl(getSearchSiteByName(siteName).mainSite, IS_OPEN_IN_CHALLENGE_WINDOW, '1'), WINDOW_FOR_REMOVE_STORAGE_KEY, randomKey),
                width: 400,
                height: 660,
                focused: true,
                screenWidth: window.screen.width,
                screenHeight: window.screen.height
            },
        });

        const storage = new Storage();
        await storage.set(randomKey, res);
    };

    useEffect(() => {
        checkInCloudflareChallenge();

        if (openInPlugin(location.href)) {
            setInterval(function () {
                checkInCloudflareChallenge();
            }, 1000);
        }
    }, []);

    return <div>
        {
            shouldShowDialog ? <XFrameDialog siteName={siteName} onStartClick={openNewWindow}/>: null
        }
    </div>;
}
