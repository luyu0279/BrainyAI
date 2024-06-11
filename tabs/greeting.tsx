import '~base.scss';
import GuideBg from "data-base64:~assets/greeting/bg.png";
import GuideText from "data-base64:~assets/greeting/guide_text.png";
import GuideText0 from "data-base64:~assets/greeting/guide_text_0.png";
import GuideText1 from "data-base64:~assets/greeting/guide_text_1.png";
import GuideText2 from "data-base64:~assets/greeting/guide_text_2.png";
import GuideBtn from "data-base64:~assets/greeting/guide_btn.png";
import GuideBtnLast from "data-base64:~assets/greeting/guide_btn_last.png";
import GuideBtnH from "data-base64:~assets/greeting/guide_btn_hover.png";
import GuideBtnLastH from "data-base64:~assets/greeting/guide_btn_last_hover.png";

import {useEffect, useRef, useState} from "react";
import {getLatestState} from "~utils";
import {justOpenPanel} from "~libs/open-ai/open-panel";
import lottie from "lottie-web";
import CommonShortcutProvider from "~porvider/CommonShortcutProvider";

const guideList = [
    {
        video: "https://d2fglovq5cw24m.cloudfront.net/production/brainy/video/guide_0.mp4",
        textImg: GuideText0,
        textImgWidth: '55.3%',
        btnImg: GuideBtn,
        btnHoverImg: GuideBtnH,
    },
    {
        video: "https://d2fglovq5cw24m.cloudfront.net/production/brainy/video/guide_1.mp4",
        textImg: GuideText1,
        textImgWidth: '90%',
        btnImg: GuideBtn,
        btnHoverImg: GuideBtnH,
    },
    {
        video: "https://d2fglovq5cw24m.cloudfront.net/production/brainy/video/guide_2.mp4",
        textImg: GuideText2,
        textImgWidth: '80%',
        btnImg: GuideBtnLast,
        btnHoverImg: GuideBtnLastH,
    },
];

const ClickAnimation = () => {
    const handRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const animationRef = lottie.loadAnimation({
            container: handRef!.current!, // the dom element that will contain the animation
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: chrome.runtime.getURL("/resources/guide_click.json") // the path to the animation json
        });
        lottie.setSpeed(4);

        return () => {
            animationRef.destroy();
        };
    },[]);

    return <div ref={handRef} className='w-[80px] h-[80px]'></div>;
};

export default function Greeting() {
    const [step, setStep] = useState(0);

    const handleClick = async () => {
        const val = await getLatestState(setStep);

        if (val == 2) {
            justOpenPanel();
            return;
        }
        if (val < 2) setStep(val+1);
    };

    return <CommonShortcutProvider><div className={'w-full h-lvh'}>
        <div className='w-full h-full flex items-center min-w-[1360px] overflow-x-auto px-[7.8%] justify-between'
            style={{background: `url(${GuideBg}) no-repeat center/cover`}}>
            <img src={GuideText} className='w-[49%] h-auto' alt=""/>

            {
                guideList.map((item, index) => {
                    return <div key={index} className={`flex-none w-[45%] min-w-[600px] h-fit bg-white rounded-3xl p-2 flex flex-col ${step === index ? 'block' : 'hidden'}`}>
                        <video src={item.video} className='w-full rounded-2xl' autoPlay={true} muted={true} loop={true}></video>
                        <div
                            className='relative w-full flex-1   py-[3%] box-border flex flex-col items-center'>
                            <div className='min-h-[180px] h-fit w-full flex justify-center items-center'>
                                <img src={item.textImg} className='h-auto' style={{width: `${item.textImgWidth}`}} alt=""/>
                            </div>
                            <div className='w-[29.6%] h-auto relative cursor-pointer group' onClick={handleClick}>
                                <img src={item.btnImg} className='w-full h-full group-hover:hidden' alt=""/>
                                <img src={item.btnHoverImg} className='w-full h-full group-hover:block hidden' alt=""/>
                                <div className="absolute right-[20px] top-[20px]">
                                    <ClickAnimation/>
                                </div>
                            </div>
                            <div className='absolute top-[-30px] left-[50%] translate-x-[-30px] w-[60px] flex'>
                                {
                                    guideList.map((ele, i) => {
                                        return <div key={i} className={`w-[10px] h-[10px] mr-1 rounded-full ${i === step ? 'bg-[#0A4DFE]' : 'bg-[#333333] bg-opacity-50'}`}></div>;
                                    })
                                }
                            </div>
                        </div>
                    </div>;
                })
            }
        </div>
    </div></CommonShortcutProvider>;
}
