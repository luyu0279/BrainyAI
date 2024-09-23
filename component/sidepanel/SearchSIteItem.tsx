import {ISearchSiteItem, SidePanelContext} from "~provider/sidepanel/SidePanelProvider";
import styleText from 'data-text:~style/panel-main.module.scss';
import * as style from "~style/panel-main.module.scss";
import {useContext, useEffect, useRef} from "react";
import RefreshIcon from "data-base64:~assets/refresh.svg";

export const getStyle = () => {
    const style = document.createElement("style");
    style.textContent = styleText;
    return style;
};

export default function SearchSiteItem({searchSiteItem}: { searchSiteItem: ISearchSiteItem }) {
    const {setCurrentSearchSite, currentSearchSite, reloadSiteFrame} = useContext(SidePanelContext);
    const itemRef = useRef<HTMLDivElement>(null);

    const reloadPage = function () {
        reloadSiteFrame(searchSiteItem.name);
    };

    useEffect(() => {
        if(itemRef?.current) {
            if(searchSiteItem.name === currentSearchSite.name) {
                itemRef.current.scrollIntoView({behavior: "smooth", inline: "center"});
            }
        }
    }, [itemRef, currentSearchSite]);

    return <div ref={itemRef} className={`${style.searchItemContainer} ${searchSiteItem.name === currentSearchSite.name ? style.active : ""}`}>
        <div className={`${style.searchItem}`}
            onClick={() => setCurrentSearchSite(searchSiteItem)}>
            <img src={searchSiteItem.icon}/>
            <div>{searchSiteItem.name}</div>
        </div>
        <div className={style.refreshWrap}>
            <div onClick={reloadPage} className={style.refresh} title={`Reload ｢${searchSiteItem.name}｣`}>
                <img src={RefreshIcon} alt="refresh"/>
            </div>
        </div>
    </div>;
}
