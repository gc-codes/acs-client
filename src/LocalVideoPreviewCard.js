// © Microsoft Corporation. All rights reserved.

import React from "react";
import { Card } from 'react-bootstrap';
import { DefaultButton } from 'office-ui-fabric-react';
export default class LocalVideoPreviewCard extends React.Component {
    constructor(props) {
        super(props);
        this.cameraDevice = props.cameraDevice;
        this.callClient = props.callClient;
        this.previewRenderer = null;
    }

    componentDidMount() {
        const target = document.getElementById('localVideoRenderer');
        this.previewRenderer = this.callClient.deviceManager.renderPreviewVideo(target, 'Fit');
        this.previewRenderer.start();
    }

    render() {
        return (
            <div>
                <Card style={{ marginBottom: "0.5em", padding: "0.5em" }}>
                   {
                        <Card.Body style={{ padding: 0 }}>
                            <div id="localVideoRenderer"></div>
                        </Card.Body>
                    }
                </Card>
            </div>
        );
    }
}
