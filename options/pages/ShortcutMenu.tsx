import React from 'react';
import {DndProvider} from "react-dnd";
import {HTML5Backend} from "react-dnd-html5-backend";
import AiEnginePage from "~options/component/AiEnginePage";

export default function ShortcutMenu() {
    return <div>
        <DndProvider backend={HTML5Backend}>
            <AiEnginePage/>
        </DndProvider>
    </div>;
}
