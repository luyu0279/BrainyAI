import React, {Fragment, type ReactNode, useEffect, useState} from "react";
import IconYou from "data-base64:~assets/you.png";
import IonMetaso from "data-base64:~assets/metaso.svg";
import IconExa from "data-base64:~assets/exa.png";
import IconDevv from "data-base64:~assets/devv.png";
import IconPhind from "data-base64:~assets/phind.png";
import IconPerplexity from "data-base64:~assets/perplexity.png";
import {
    DEVV_SEARCH_KEY, getLatestState,
    MESSAGE_ACTION_RELOAD_SITE_FRAME, MESSAGE_PANEL_OPENED_PING_FROM_PANEL,
    MESSAGE_UPDATE_PANEL_INIT_DATA, PORT_LISTEN_PANEL_CLOSED_KEY,
    STORAGE_OPEN_PANEL_INIT_DATA
} from "~utils";
import {Storage} from "@plasmohq/storage";
import {IAskAi, type IOpenPanelData, OpenPanelType} from "~libs/open-ai/open-panel";
import type {NavigateFunction} from  "react-router-dom";
import {PanelRouterPath} from "~libs/constants";
import {message} from "antd";
import type {MessageInstance} from "antd/lib/message/interface";
import {Logger} from "~utils/logger";

export class ISearchSiteItem {
    icon: string;
    name: SiteName;
    searchPage: string;
    mainSite: string;

    constructor(icon: string, name: SiteName, searchPage: string, mainSite: string) {
        this.icon = icon;
        this.name = name;
        this.searchPage = searchPage;
        this.mainSite = mainSite;
    }
}

interface ISidePanelContext {
    // currentSite: string;
    searchSites: ISearchSiteItem[];
    currentSearchSite: ISearchSiteItem;
    setCurrentSearchSite: React.Dispatch<React.SetStateAction<ISearchSiteItem>>;
    windowHeight: number;
    setWindowHeight: React.Dispatch<React.SetStateAction<number>>;
    searchText: string,
    setSearchText: React.Dispatch<React.SetStateAction<string>>;
    searchSitesWithKey: SearchSitesWithKey[];
    reloadSiteFrame: (siteName: SiteName) => void;
    panelOpenType?: OpenPanelType;
    askAiData?: IAskAi
    navigation?: NavigateFunction;
    setNavigation: React.Dispatch<React.SetStateAction<NavigateFunction>>
    userLanguage: string;
    messageApi: MessageInstance,
    expandMenu: boolean,
    setExpandMenu: React.Dispatch<React.SetStateAction<boolean>>,
}

export const SidePanelContext = React.createContext<ISidePanelContext>({} as ISidePanelContext);

export enum SiteName {
    METASO = "metaso",
    AI360 = "360AI",
    TIANGONG = "天工AI",
    EXA = "Exa",
    YOU = "You",
    ANDI = "Andi",
    DEVV_ = "devv_",
    PERPLEXITY = "perplexity",
    PHIND = "phind",
    IASK = "iask",
    BRAVE = "Brave"
}

const Sites = [
    new ISearchSiteItem(IconPerplexity, SiteName.PERPLEXITY, 'https://www.perplexity.ai/?q={query}', 'https://www.perplexity.ai/'),
    new ISearchSiteItem(IonMetaso, SiteName.METASO, `https://metaso.cn/search/{session_id}`, 'https://metaso.cn/'),
    new ISearchSiteItem(IconYou, SiteName.YOU, 'https://you.com/search?q={query}&fromSearchBar=true&tbm=youchat&chatMode=default', 'https://you.com/'),
    new ISearchSiteItem(IconDevv, SiteName.DEVV_, `https://devv.ai/?${DEVV_SEARCH_KEY}={query}`, 'https://devv.ai/'),
    new ISearchSiteItem(IconPhind, SiteName.PHIND, 'https://www.phind.com/search?q={query}&ignoreSearchResults=false', 'https://www.phind.com/search?home=true'),
    new ISearchSiteItem(IconExa, SiteName.EXA, 'https://exa.ai/search?c=all&q={query}', 'https://exa.ai/'),
    // new ISearchSiteItem(IconAndi, 'Andi', 'https://andisearch.com/'),
    // new ISearchSiteItem(IconDevv, SiteName.IASK, 'https://iask.ai/?mode=question&options[detail_level]=detailed&q={query}','https://iask.ai/'),
    // new ISearchSiteItem(IconBrave, SiteName.BRAVE, 'https://search.brave.com/search?q={query}','https://search.brave.com'),
];


class SearchSitesWithKey {
    key: string;
    name: SiteName;
    searchSites: ISearchSiteItem;

    constructor(key: string, searchSites: ISearchSiteItem) {
        this.key = key;
        this.name = searchSites.name;
        this.searchSites = searchSites;
    }
}

export function getSearchSiteByName(name: SiteName): ISearchSiteItem {
    return Sites.find(site => site.name === name) as ISearchSiteItem;
}

const SidePanelProvider = ({children}: { children: ReactNode }) => {
    const [searchSites] = useState<ISidePanelContext['searchSites']>(
        Sites
    );
    const [windowHeight, setWindowHeight] = useState<ISidePanelContext['windowHeight']>(0);
    const [currentSearchSiteItem, setCurrentSearchSiteItem] = useState<ISidePanelContext['currentSearchSite']>(searchSites[0]);
    const [searchText, setSearchText] = useState<ISidePanelContext['searchText']>("");
    // const setSearchTextByEncode = (text: string) => {
    //     Logger.log(`setSearchText==============${text}`)
    //     setSearchText(encodeURIComponent(text))}
    const [searchSitesWithKey, setSearchSitesWithKey] = useState(searchSites.map((site) => {
        return new SearchSitesWithKey(site.name, site);
    }));
    const [panelInitialized, setPanelInitialized] = useState(false);
    const [askAiData, setAskAiData] = useState<IAskAi>();
    const [panelOpenType, setPanelOpenType] = useState<OpenPanelType>();
    const [navigation, setNavigation] = useState<NavigateFunction>();
    const [userLanguage] = useState(navigator.language ?? "english");
    const [messageApi, contextHolder] = message.useMessage();
    const [expandMenu, setExpandMenu] = useState<boolean>(window.innerWidth > 800);

    function getInitDataFromStorage() {
        const storage = new Storage();

        storage.get(STORAGE_OPEN_PANEL_INIT_DATA).then(async (r) => {
            if (r) {
                const data = r as unknown as IOpenPanelData;

                setPanelOpenType(data.openType);

                let targetPath = PanelRouterPath.SEARCH;
                if (data.openType === OpenPanelType.SEARCH) {
                    setSearchText(data.data as string);
                } else if (data.openType === OpenPanelType.AI_ASK) {
                    targetPath = PanelRouterPath.CONVERSATION;
                    setAskAiData(data.data as IAskAi);
                }

                const pathSplit = location.pathname.split('');
                const currentPathName = pathSplit[pathSplit.length - 1];

                const _navigation  = await getLatestState(setNavigation);

                if (_navigation && currentPathName !== targetPath) {
                    _navigation(targetPath);
                }
            }

            void storage.set(STORAGE_OPEN_PANEL_INIT_DATA, null);
            setPanelInitialized(true);
        });
    }

    useEffect(() => {
        getInitDataFromStorage();

        chrome.runtime.onMessage.addListener(function (request) {
            if(request.action === MESSAGE_ACTION_RELOAD_SITE_FRAME) {
                reloadSiteFrame(request.siteName);
            } else if (request.action === MESSAGE_UPDATE_PANEL_INIT_DATA) {
                getInitDataFromStorage();
            }
        });

        try {
            void chrome.runtime.sendMessage({ action: MESSAGE_PANEL_OPENED_PING_FROM_PANEL });
            chrome.runtime.connect({ name: PORT_LISTEN_PANEL_CLOSED_KEY });
        } catch (e) {
            Logger.log('connect backend port', e);
        }

        window.addEventListener('resize', function () {
            if (window.innerWidth > 800) {
                setExpandMenu(true);
            }else {
                setExpandMenu(false);
            }
        });
    }, []);

    const reloadSiteFrame = function (siteName: SiteName) {
        setSearchSitesWithKey(prevState => {
            for (const site of prevState) {
                if (site.name === siteName) {
                    site.key = `${site.name}_${Date.now()}`;
                }
            }

            return [...prevState];
        });
    };

    return (
        <SidePanelContext.Provider value={{
            searchSites,
            windowHeight,
            setWindowHeight,
            currentSearchSite: currentSearchSiteItem,
            setCurrentSearchSite: setCurrentSearchSiteItem,
            searchText,
            setSearchText,
            searchSitesWithKey,
            reloadSiteFrame,
            panelOpenType,
            askAiData,
            navigation,
            setNavigation,
            userLanguage,
            messageApi,
            expandMenu,
            setExpandMenu,
        }}>
            <Fragment>
                {contextHolder}
                {panelInitialized ? children : null}
            </Fragment>
        </SidePanelContext.Provider>
    );
};

export default SidePanelProvider;
