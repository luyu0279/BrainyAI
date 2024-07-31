import styleText from 'data-text:~style/panel-main.module.scss';
import * as style from "~style/panel-main.module.scss";
import {useContext, useEffect, useRef} from "react";
import {SidePanelContext} from "~provider/sidepanel/SidePanelProvider";
import SearchSiteItem from "~component/sidepanel/SearchSIteItem";
import SearchSiteFrame from "~component/sidepanel/SearchSiteFrame";
import {
    getGoogleQuery, getLatestState, MESSAGE_ACTION_SYNC_SEARCH_TEXT
} from "~utils";
import {Logger} from "~utils/logger";

export const getStyle = () => {
    const style = document.createElement("style");
    style.textContent = styleText;
    return style;
};

function SearchSiteList() {

    const {searchSites} = useContext(SidePanelContext);
    const siteListRef = useRef(null);

    return <div ref={siteListRef} className={style.siteController}>
        {
            searchSites.map((site, index) => {
                return <SearchSiteItem searchSiteItem={site} key={index}/>;
            })
        }
    </div>;
}


function SiteContainer() {
    const {searchSitesWithKey} = useContext(SidePanelContext);

    return <div style={{flex: "1 1 0%", width: "100%"}}>
        {
            searchSitesWithKey.map((siteWithKey) => {
                return <SearchSiteFrame key={siteWithKey.key} site={siteWithKey.searchSites}/>;
            })
        }
    </div>;
}

function SidePanelContent() {
    const {setSearchText} = useContext(SidePanelContext);

    const getCurrentTab = async function () {
        const queryOptions = {active: true, lastFocusedWindow: true};
        // `tab` will either be a `tabs.Tab` instance or `undefined`.
        const [tab] = await chrome.tabs.query(queryOptions);

        const query = getGoogleQuery(tab.url as string);

        if (query) {
            setSearchText(query);
        }
    };

    const listenMessage = function (request: any) {
        Logger.log('request search page listen', request);
        if (request.action === MESSAGE_ACTION_SYNC_SEARCH_TEXT) {
            setSearchText(request.data);
        }
    };

    const initSearchWhileInGoogle = async function () {
        if (!await getLatestState(setSearchText)) {
            Logger.log("==================", await getLatestState(setSearchText));
            void getCurrentTab();
        }
    };

    useEffect(() => {
        chrome.runtime.onMessage.addListener(listenMessage);

        void initSearchWhileInGoogle();

        return () => {
            chrome.runtime.onMessage.removeListener(listenMessage);
        };
    }, []);

    return <div className={style.sideWrapper}>
        <SearchSiteList/>
        <SiteContainer/>
    </div>;

}

export default function SidePanelIndex() {
    const getTabId = async function () {
        const panel = (await chrome.tabs.query({active: true, currentWindow: true}))[0];
        void chrome.runtime.sendMessage({action: 'sync_panel_info', data: panel});
    };

    useEffect(() => {
        void getTabId();
    }, []);

    return <SidePanelContent/>;
}
