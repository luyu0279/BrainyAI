import {memo, type ReactNode, useState} from "react";
import {CopilotImageCreateSingleton} from "~libs/copilot/copilot-image-create-singleton";

export abstract class ConversationMessageAppendix {
    abstract render(): ReactNode
}

const CopilotImageCreateAppendixView = memo(function ({src}: { src: string }) {
    const [frameLoaded, setFrameLoaded] = useState(false);


    return <div className={'w-full overflow-x-auto relative'}>
        {!frameLoaded && <div className={'absolute left-[10px] top-[10px] text-[18px]'}>Your image is generating</div>}
        <iframe onLoad={() => setFrameLoaded(true)} onError={function (e) {
            e.currentTarget.style.display = "none";
        }} src={src} className={'w-[475px] h-[520px]'} width={475} height={520}
        style={{width: '475px'}}/>
    </div>;
});

export class CopilotImageCreateAppendix extends ConversationMessageAppendix {
    private imageCreateSingleton: CopilotImageCreateSingleton;
    text: string;
    messageId: string;

    constructor(text: string, messageId: string) {
        super();
        this.text = text;
        this.messageId = messageId;
        this.imageCreateSingleton = CopilotImageCreateSingleton.getInstance(text, messageId);
    }

    render() {
        return <CopilotImageCreateAppendixView src={this.imageCreateSingleton.createFrameUrl(this.text, this.messageId)}/>;
    }
}
