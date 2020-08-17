// © Microsoft Corporation. All rights reserved.

import React, { useState, useRef } from "react";
import { OverlayTrigger, Popover } from "react-bootstrap";
import { Button, TextField } from 'office-ui-fabric-react'

export default function AddParticipantPopover(props) {
    const [userId, setUserId] = useState('');

    function handleAddParticipant() {
        console.log('handleAddParticipant', userId);
        try {
            props.call.addParticipant(userId);
            window.document.body.click();
        } catch (e) {
            console.error(e);
        }
    }

    function getPopoverContent() {
        return (
            <Popover>
                <Popover.Title as="h3">Add a participant</Popover.Title>
                <Popover.Content>
                    <TextField label="User ID" onChange={e => setUserId(e.target.value)} />
                    <Button onClick={handleAddParticipant}>Add</Button>
                </Popover.Content>
            </Popover>
        );
    }

    return (
        <>
            <OverlayTrigger
                trigger="click"
                rootClose
                overlay={getPopoverContent()}
                placement="left">
                <a href="#" onClick={e => e.preventDefault()} className="text-dark"><i className="px-2 fas fa-user-plus"></i></a>
            </OverlayTrigger>
        </>
    );
}