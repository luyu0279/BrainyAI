import {RouterProvider} from "react-router-dom";
import {router} from "~options/router";
import React from "react";
import '~base.scss';
import GoogleAnalyticsProvider from "~porvider/GoogleAnalyticsProvider";

export default function () {
    return  <GoogleAnalyticsProvider>
        <RouterProvider router={router}/>
    </GoogleAnalyticsProvider>;
}
