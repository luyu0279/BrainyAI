import React, {useContext, useEffect, useRef, useState} from "react";
import * as style from "~style/panel-main.module.scss";
import {ISearchSiteItem, SidePanelContext, SiteName} from "~provider/sidepanel/SidePanelProvider";
import {sendToBackground} from "@plasmohq/messaging";
import {addCspParamsToUrl, addMobileHeaderToUrl, appendParamToUrl, IS_OPEN_IN_PLUGIN} from "~utils";


const SearchSiteFrame = function ({site}: { site: ISearchSiteItem }) {
    const {windowHeight, currentSearchSite, searchText} = useContext(SidePanelContext);
    const siteContainerRef = useRef(null);
    const [siteUrl, setSiteUrl] = useState("");

    const formatMetaSoUrl = async function () {
        if (!searchText) return site.mainSite;

        const resp = await sendToBackground({
            name: "metaso-session",
            body: {
                searchText
            }
        });

        if (resp) {
            return site.searchPage.replace("{session_id}", resp.data.id);
        }

        return site.mainSite;
    };

    const formatPhindUrl = async function () {
        await chrome.browsingData.remove({
            "origins": ["https://www.phind.com"]
        }, {
            "serviceWorkers": true,
        });

        if (!searchText) return site.mainSite;

        return site.searchPage.replace("{query}", searchText);
    };

    const formatUrlWithQuery = function () {
        if (!searchText) return site.mainSite;

        return site.searchPage.replace("{query}", searchText);
    };


    useEffect(() => {
        void formatUrl();
    }, [searchText]);

    const formatUrl = async function () {
        let url = "";

        switch (site.name) {
        case SiteName.YOU:
            // await sendToBackground({
            //     name: "fix-partition-cookie",
            //     body: {
            //         domain: "you.com",
            //         url: "https://you.com/"
            //     },
            // });
            url = addCspParamsToUrl(formatUrlWithQuery());
            break;
        case SiteName.METASO:
            url = addCspParamsToUrl(addMobileHeaderToUrl(await formatMetaSoUrl()));
            break;
        case SiteName.EXA:
            url = formatUrlWithQuery();
            break;
        case SiteName.PHIND:
            // await sendToBackground({
            //     name: "fix-partition-cookie",
            //     body: {
            //         domain: "phind.com",
            //         url: "https://www.phind.com"
            //     },
            // });
            url = addCspParamsToUrl(await formatPhindUrl());
            break;
        case SiteName.IASK:
            url = formatUrlWithQuery();
            break;
        case SiteName.BRAVE:
            url = addCspParamsToUrl(formatUrlWithQuery());
            break;
        case SiteName.PERPLEXITY:
            // await sendToBackground({
            //     name: "fix-partition-cookie",
            //     body: {
            //         domain: "perplexity.ai",
            //         url: "https://www.perplexity.ai"
            //     },
            // });
            url = addCspParamsToUrl(formatUrlWithQuery());
            break;
        case SiteName.DEVV_:
            url = formatUrlWithQuery();
            break;
        default:
            url = site.mainSite;
        }

        setSiteUrl(appendParamToUrl(appendParamToUrl(url, "t", Date.now()), IS_OPEN_IN_PLUGIN, '1'));
    };

    return <div ref={siteContainerRef}
        className={`${style.siteContainer} ${currentSearchSite.name === site.name ? style.activeSiteContainer : ""}`}>
        {windowHeight > 0 ?
            <iframe src={siteUrl} height={`${windowHeight - 64}px`} width={"100%"}/>
            : null}
    </div>;
};

export default React.memo(SearchSiteFrame);
