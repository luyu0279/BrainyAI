import {useState} from "react";
import { type DrawerProps,  Button, Space, Drawer} from "antd";

export default function () {
    const [open, setOpen] = useState(true);
    const [placement] = useState<DrawerProps['placement']>('right');

    // const showDrawer = () => {
    //     setOpen(true);
    // };
    //
    // const onChange = (e: RadioChangeEvent) => {
    //     setPlacement(e.target.value);
    // };

    const onClose = () => {
        setOpen(false);
    };

    return (
        <>
            <Drawer
                title="Drawer with extra actions"
                placement={placement}
                width={500}
                onClose={onClose}
                open={open}
                extra={
                    <Space>
                        <Button onClick={onClose}>Cancel</Button>
                        <Button type="primary" onClick={onClose}>
                            OK
                        </Button>
                    </Space>
                }
            >
                <p>Some contents...</p>
                <p>Some contents...</p>
                <p>Some contents...</p>
            </Drawer>
        </>
    );
}
