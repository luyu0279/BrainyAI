import React, {createContext} from "react";
import useMessage from "antd/es/message/useMessage";
import type {MessageInstance} from "antd/es/message/interface";

interface IOptionsContext {
    messageApi: MessageInstance
}

export const OptionsContext = createContext({} as IOptionsContext);

export default function OptionsProvider({children}: {children: React.ReactNode}) {
    const [messageApi, holder] = useMessage();

    return <OptionsContext.Provider value={{
        messageApi
    }}>
        {children}
        {holder}
    </OptionsContext.Provider>;
}