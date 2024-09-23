import {createBrowserRouter, Navigate, Outlet, useLocation, useNavigate,} from "react-router-dom";
import SidePanelIndex from "~sidepanel/pages/search";
import Conversation from "~sidepanel/pages/conversation";
import {PanelRouterPath} from "~libs/constants";
import React, {Fragment,  useContext, useEffect, useState} from "react";
import {SidePanelContext} from "~provider/sidepanel/SidePanelProvider";
import {OpenPanelType} from "~libs/open-ai/open-panel";
import Header from "~component/sidepanel/Header";
import SearchHome from "~sidepanel/pages/search-home";
import {GoogleAnalyticsContext} from "~provider/GoogleAnalyticsProvider";

const DetermineRedirect = () => {
    const {panelOpenType} = useContext(SidePanelContext);
    const [defaultRoute, setDefaultRoute] = useState<string>();

    useEffect(() => {
        if(panelOpenType === OpenPanelType.SEARCH) {
            setDefaultRoute(PanelRouterPath.SEARCH);
        } else if (panelOpenType === OpenPanelType.AI_ASK) {
            setDefaultRoute(PanelRouterPath.CONVERSATION);
        } else {
            setDefaultRoute(PanelRouterPath.CONVERSATION);
        }
    }, []);

    return <Fragment>
        {
            defaultRoute ? <Navigate to={defaultRoute} replace/> : null
        }
    </Fragment>;
};

const Container = function () {
    const {setNavigation} = useContext(SidePanelContext);
    const {analytics} = useContext(GoogleAnalyticsContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        void analytics.current.firePageViewEvent("", location.pathname);
    }, [location]);

    useEffect(() => {
        setNavigation(() => {
            return navigate;
        });
    }, []);

    return <Fragment>
        <Header/>
        <Outlet/>
    </Fragment>;
};

export const router = createBrowserRouter([
    {
        path: "sidepanel.html",
        element: <Container/>,
        children: [
            {
                path: "",
                element: <DetermineRedirect/>,
            },
            {
                path: PanelRouterPath.SEARCH,
                element: <SidePanelIndex/>,
            },
            {
                path: PanelRouterPath.SEARCH_HOME,
                element: <SearchHome/>,
            },
            {
                path: PanelRouterPath.CONVERSATION,
                element: <Conversation/>,
            },
        ],
    },
]);
