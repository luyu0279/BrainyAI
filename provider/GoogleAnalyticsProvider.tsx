import React, {useRef} from "react";
import {Analytics} from "~libs/ga";

interface IGoogleAnalyticsProviderProps {
    analytics: React.MutableRefObject<Analytics>;
}

export const GoogleAnalyticsContext = React.createContext({} as IGoogleAnalyticsProviderProps);

export default function GoogleAnalyticsProvider({children}) {
    const analytics = useRef(new Analytics());

    return <GoogleAnalyticsContext.Provider value={{
        analytics
    }}>
        {children}
    </GoogleAnalyticsContext.Provider>;
}
