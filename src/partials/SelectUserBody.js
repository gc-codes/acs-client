import React, { Component } from 'react';
import { Card } from 'react-bootstrap';

class SelectUserBody extends Component {
    render() {
        return <>
            <Card.Body>
                <div style={{ position: 'absolute', left: '40%', top: '38%', textAlign: 'center' }}>
                    <img style={{ height: '140px' }} src={ process.env.PUBLIC_URL + "/images/chat-icon.png" } alt="chat-icon"/><br />
                    <b className="text-muted">Select a user to have a chat!</b>
                </div>
            </Card.Body>
        </>
    }
}

export default SelectUserBody;