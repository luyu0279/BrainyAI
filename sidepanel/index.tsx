import {RouterProvider} from "react-router-dom";
import {router} from "~sidepanel/router";
import React, {useContext} from "react";
import type {PlasmoGetStyle} from "plasmo";
import SidePanelProvider, {SidePanelContext} from "~provider/sidepanel/SidePanelProvider";
import styleText from 'data-text:~style/panel-main.module.scss';
import * as style from "~style/panel-main.module.scss";
import '~base.scss';
import CommonShortcutProvider from "~provider/CommonShortcutProvider";
import GoogleAnalyticsProvider from "~provider/GoogleAnalyticsProvider";

export const getStyle: PlasmoGetStyle = () => {
    const style = document.createElement("style");
    style.textContent = styleText;
    return style;
};

function TopWrapper({children}: { children: React.ReactNode }) {
    const {windowHeight, setWindowHeight, expandMenu} = useContext(SidePanelContext);

    const afterContainerRendered = (ref: HTMLParagraphElement) => {
        if (ref) {
            // waiting render?
            const offset = 52;
            setTimeout(function () {
                setWindowHeight(ref.clientHeight - offset);
            }, 20);

            window.addEventListener('resize', function () {
                setWindowHeight(ref.clientHeight - offset);
            });
        }
    };

    // const jump = async function (path: string) {
    //     const _navigation = await getLatestState(setNavigation)
    //     _navigation(path)
    // }

    // const items: MenuProps['items'] = [
    //     {
    //         key: '1',
    //         label: (
    //             <div onClick={() => jump("./conversation")}>Conversation</div>
    //         ),
    //     },
    //     {
    //         key: '2',
    //         label: (
    //             <div onClick={() => jump("./search")}>Search</div>
    //         ),
    //     },
    // ];

    return <div ref={afterContainerRendered} className={style.topWrapper} style={{width: `${expandMenu ? 'calc(100% - 64px)': '100%'}`}}>
        {/*<div className={style.menu}>*/}
        {/*    <Dropdown menu={{items}}>*/}
        {/*        <a onClick={(e) => e.preventDefault()}>*/}
        {/*            <Space>*/}
        {/*                <MenuOutlined className={style.icon} width={30} height={30}/>*/}
        {/*            </Space>*/}
        {/*        </a>*/}
        {/*    </Dropdown>*/}
        {/*</div>*/}

        <div className={style.theContainer}>
            <div className={style.searchContentWrap}>
                {windowHeight > 0 ? children : null}
            </div>
            {/*<div className={style.drawer} style={{height: `${windowHeight}px`}}>hello</div>*/}
        </div>
    </div>;
}

export default function Main() {
    return <GoogleAnalyticsProvider>
        <CommonShortcutProvider>
            <SidePanelProvider>
                <TopWrapper>
                    <RouterProvider router={router}/>
                </TopWrapper>
            </SidePanelProvider>
        </CommonShortcutProvider>
    </GoogleAnalyticsProvider>;
}
