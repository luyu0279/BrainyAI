import {createContext, useEffect} from "react";
import {MESSAGE_ACTION_SET_PANEL_OPEN_OR_NOT} from "~utils";

const ShortcutContext = createContext({});

export default function CommonShortcutProvider({children}) {
    useEffect(() => {
        document.body.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
                e.preventDefault();
                e.stopPropagation();
                void chrome.runtime.sendMessage({action: MESSAGE_ACTION_SET_PANEL_OPEN_OR_NOT});
            }
        });
    }, []);

    return (
        <ShortcutContext.Provider value={{}}>
            {children}
        </ShortcutContext.Provider>
    );
}
