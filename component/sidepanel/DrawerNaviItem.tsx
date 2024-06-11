import type {IDrawerNaviItem} from "~component/sidepanel/Header";
import {useLocation} from "react-router-dom";

export default function ({naviItem}: { naviItem: IDrawerNaviItem }) {
    const location = useLocation();
    const isActive = location.pathname.endsWith(naviItem.path);

    const coloredText = function () {
        if (isActive) {
            return <div className={'text-[12px] text-[#0A4DFE]'}>
                {naviItem.name}
            </div>;
        }

        return <div className={'text-[12px] text-[#5E5E5E]'}>
            {naviItem.name}
        </div>;
    };

    return <div className={'flex cursor-pointer flex-col items-center justify-center'}>
        <img className={'w-[16px] h-[16px] block mb-[6px]'} src={isActive ? naviItem.activeIcon : naviItem.icon}/>
        {coloredText()}
    </div>;
}
