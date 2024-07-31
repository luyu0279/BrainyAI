import IconSearch from "data-base64:~assets/icon_search_ai.svg";
import IconMore from "data-base64:~assets/more.svg";
import {useContext, useEffect, useState} from "react";
import { Drawer, Tooltip, type DrawerProps} from "antd";
import DrawerNaviItem from "~component/sidepanel/DrawerNaviItem";
import IconSearchActive from "data-base64:~assets/icon_search_ai_active.svg";
import IconChat from "data-base64:~assets/chat.svg";
import IconSetting from "data-base64:~assets/setting.svg";
import IconChatActive from "data-base64:~assets/chat_active.svg";
import {PanelRouterPath} from "~libs/constants";
import {useLocation, useNavigate} from "react-router-dom";
import NewChatIcon from "data-base64:~assets/new_chat.svg";
import MenuArrowIcon from "data-base64:~assets/menu_arrow.svg";
import eventBus from "~libs/EventBus";
import {SidePanelContext} from "~provider/sidepanel/SidePanelProvider";

export interface IDrawerNaviItem {
    path: PanelRouterPath
    name: string
    icon: string
    activeIcon: string
}

const DrawerNaviItems: IDrawerNaviItem[] = [
    {path: PanelRouterPath.CONVERSATION, name: "Chat", icon:  IconChat, activeIcon: IconChatActive},
    {path: PanelRouterPath.SEARCH_HOME, name: "Search", icon:  IconSearch, activeIcon: IconSearchActive},
];


const HTitle = {
    AIChatText: "AI Chat",
    AISearchText: "AI Search",
};

export default function () {
    const [open, setOpen] = useState(false);
    const [placement] = useState<DrawerProps['placement']>('right');
    const location = useLocation();
    const navigate = useNavigate();
    const [, setTitleImage] = useState<string>();
    const [titleText, setTitleText] = useState<string>();
    const {expandMenu, setExpandMenu} = useContext(SidePanelContext);

    useEffect(() => {
        if(location.pathname.endsWith(PanelRouterPath.CONVERSATION)) {
            setTitleImage(IconChat);
            setTitleText(HTitle.AIChatText);
        } else {
            setTitleImage(IconSearch);
            setTitleText(HTitle.AISearchText);
        }
    }, [location]);

    useEffect(() => {
        setOpen(expandMenu);
    }, [expandMenu]);

    // const showDrawer = () => {
    //     setOpen(true);
    // };
    //
    // const onChange = (e: RadioChangeEvent) => {
    //     setPlacement(e.target.value);
    // };

    const onClose = () => {
        setOpen(false);
        setExpandMenu(false);
    };

    const goTo = function (path: PanelRouterPath) {
        navigate(path);
        setOpen(false);
        setExpandMenu(false);
    };

    const newChatClick = () => {
        eventBus.emit('newChat');
    };

    const handleMoreClick = () => {
        setOpen(true);
        if (window.innerWidth > 800) setExpandMenu(true);
    };

    return <div className={"h-[52px] box-border flex-0 flex-shrink-0 flex-grow-0 w-full flex justify-between items-center px-[16px]"}>
        <Drawer
            placement={placement}
            width={64}
            mask={!expandMenu}
            onClose={onClose}
            open={open}
            maskClosable={!expandMenu}
            footer={<div className={'flex cursor-pointer justify-center items-center h-[100px]'} onClick={() => {
                window.open(`chrome-extension://${chrome.runtime.id}/options.html`);
            }}>
                <img src={IconSetting} alt=""/>
            </div>}
            styles={{
                header: {
                    borderBottom: "none",
                },
                mask: {
                    backgroundColor: "transparent"
                },
                wrapper: {
                    boxShadow: "-3px 0 16px rgba(0,0,0,0.2)",
                    borderRadius: !expandMenu ? "16px" : "0",
                    overflow: "hidden"
                },
                content: {
                    background: expandMenu ? 'rgba(0, 0, 0, 0.04)' : '#fff',
                }
            }}
            closeIcon={expandMenu ? <div className='w-5 h-5'><img src={MenuArrowIcon} className='w-5 h-5' alt=""/></div>: null}
        >
            <div className={`${expandMenu?'':'mt-[16px]'}`}>
                {
                    DrawerNaviItems.map((item, index) => {
                        return <div key={item.name} onClick={() => goTo(item.path)} className={'mb-[24px]'}>
                            <DrawerNaviItem key={index} naviItem={item}/>
                        </div>;
                    })
                }
            </div>
        </Drawer>
        <div className={'flex items-center font-[#333333] text-[20px] font-[600]'}>
            {titleText}
        </div>
        <div className='flex justify-end items-center'>
            <Tooltip title='New Chat'>
                {titleText === HTitle.AIChatText && <img  className='w-[22px] mr-4 cursor-pointer' src={NewChatIcon} onClick={newChatClick} alt=""/>}
            </Tooltip>
            {
                !expandMenu &&
                <div onClick={handleMoreClick} className={"cursor-pointer"}>
                    <img className={'w-[20px] h-[20px] block'} src={IconMore} alt=""/>
                </div>
            }
        </div>
    </div>;
}
