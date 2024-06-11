import {Tooltip} from "antd";
import type {TooltipProps} from "antd/es/tooltip";

const BASE_ZINDEX = 2147483647;

export default function (props: TooltipProps) {
    props = {...props, zIndex: BASE_ZINDEX + Math.max(1, props.zIndex ?? 0)};
    return <Tooltip {...props}></Tooltip>;
}
