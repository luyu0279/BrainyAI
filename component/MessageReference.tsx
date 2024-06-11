import type {ReactNode} from "react";

export abstract class MessageContentReference {
    abstract renderContent(): ReactNode
}
