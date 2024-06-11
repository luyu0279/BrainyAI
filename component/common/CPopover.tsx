import {Popover} from "antd";
import type {PopoverProps} from "antd/es/popover";

export const BASE_ZINDEX = 2147483647;

export default function (props: PopoverProps) {
    props = {...props, zIndex: BASE_ZINDEX + Math.max(1, props.zIndex ?? 0)};
    return <Popover {...props}></Popover>;
}
