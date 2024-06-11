import React, {useEffect, useRef, useState} from "react";
import ReactDOM from 'react-dom/client';
import lottie from "lottie-web";
import {ArrowRightOutlined} from "@ant-design/icons";
import Logo from "data-base64:~assets/ai_avatar.svg";
import {Logger} from "~utils/logger";

function FrameContent({src, goBack}: { src: string, goBack(): void }) {
    const [width, setWidth] = useState<string>();
    const [height, setHeight] = useState<string>();
    const catRef = useRef<HTMLDivElement>(null);
    const [frameLoaded, setFrameLoaded] = useState(false);
    const [loadError, setLoadError] = useState(false);

    const getSize = () => {
        setHeight(window.innerHeight + 'px');
        setWidth(document.body.clientWidth + 'px');
    };

    useEffect(() => {
        getSize();
        window.addEventListener('resize', getSize);

        const animationRef = lottie.loadAnimation({
            container: catRef!.current!, // the dom element that will contain the animation
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: chrome.runtime.getURL("/resources/loading.json") // the path to the animation json
        });

        return () => {
            window.removeEventListener('resize', getSize);
            animationRef.destroy();
        };
    }, []);

    return <div className={"absolute bg-white z-[9999]"} style={{width, height}}>
        {
            (loadError || !frameLoaded) && <div style={{
                width: `100%`,
                background: "linear-gradient(298.91deg, #0AFE4E -13.62%, #0A4DFE 18.01%, #CB00FE 102.24%)"
            }} className={'py-[10px] flex justify-center items-center text-[14px] px-[16px] box-border absolute z-10'}>
                <div onClick={goBack}
                    className={"flex cursor-pointer justify-center items-center px-[16px] py-[8px] bg-white rounded-[8px]"}>
                    <img className={"w-[20px] h-[20px] mr-[12px]"} src={Logo} alt=""/>
                    <div className={"mr-[10px] text-black"}>
                        Back to BrainyAI
                    </div>
                    <ArrowRightOutlined style={{color: "black"}}/>
                </div>
            </div>
        }
        {!frameLoaded &&
            <div className='w-20 h-20 absolute z-0 left-0 top-0 right-0 bottom-0 m-auto' ref={catRef}></div>}
        <iframe onLoad={(e) => {
            setFrameLoaded(true);
            Logger.trace("iframe---loaded");
            Logger.trace("frameee", e);
        }} onError={() => {
            setLoadError(true);
            Logger.trace("iframe---errorrrr");
        }} style={{
            width,
            height
        }} src={src}></iframe>
    </div>;
}

export default class XFramePerplexityChat {
    src: string;
    root: HTMLElement;

    constructor(src: string) {
        this.src = src;
    }

    goBack() {
        this.root.remove();
    }

    render() {
        const div = document.createElement('div');
        document.body.appendChild(div);
        this.root = div;
        ReactDOM.createRoot(div).render(<FrameContent goBack={this.goBack.bind(this)} src={this.src}/>);
    }

    destroy() {
        this.root.remove();
    }
}
