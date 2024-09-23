import type {PlasmoCSConfig, PlasmoGetStyle} from "plasmo";
import CInPanelChallenge from "~component/xframe/challenge/c-in-panel-challenge";
import styleText from 'data-text:~base.scss';
import {SiteName} from "~provider/sidepanel/SidePanelProvider";
import {useEffect} from "react";
import {openInPlugin} from "~utils";

export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement("style");
    style.textContent = styleText;
    return style;
};

export const config: PlasmoCSConfig = {
    matches: ['https://*.phind.com/*'],
    all_frames: true
};

export default function Phind() {
    useEffect(() => {
        if(openInPlugin(location.href)) {
            const interval = setInterval(function () {
                const searchBoxList = document.querySelectorAll('.searchbox-textarea');
                if(searchBoxList.length) {
                    const searchBox = searchBoxList[0] as HTMLTextAreaElement;

                    if(searchBox.value === '' && searchBox.clientHeight > 100) {
                        searchBox.style.height = '50px';
                    } else {
                        clearInterval(interval);
                    }
                }

            }, 1000);
        }
    }, []);

    return <div>
        <CInPanelChallenge siteName={SiteName.PHIND}/>
    </div>;
}
