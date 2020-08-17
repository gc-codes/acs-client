// © Microsoft Corporation. All rights reserved.

import React, { useEffect, createRef } from "react";
import { Card } from 'react-bootstrap';
export default class StreamMedia extends React.Component {
    constructor(props) {
        super(props);
        this.id = Date.now();
        this.stream = props.stream;
        this.userId = props.userId;
        this.state = {
            isAvailable: props.stream.isAvailable
        };
    }

    /**
     * Start stream after DOM has rendered
     */
    componentDidMount() {
        console.log('StreamMedia', this.stream, this.userId);
        if(this.stream) {
            const showRenderers = () => {
                this.stream.activeRenderers.forEach(ar => {
                    ar.target.style.display = '';
                });
            };
            const hideRenderers = () => {
                this.stream.activeRenderers.forEach(ar => {
                    ar.target.style.display = 'none';
                    document.getElementById(`${this.userId}-${this.stream.type}-${this.stream.id}`).removeChild(ar.target);
                });
            };

            this.stream.on('availabilityChanged', () => {
                console.log(`EVENT, stream=${this.stream.type}, availabilityChanged=${this.stream.isAvailable}`);
                if (this.stream.isAvailable) {
                    this.setState({isAvailable: true});
                    showRenderers();
                    const rendererContainer = document.createElement('div');
                    document.getElementById(`${this.userId}-${this.stream.type}-${this.stream.id}`).appendChild(rendererContainer);
                    this.stream.render(rendererContainer);
                } else {
                    this.setState({isAvailable: false});
                    hideRenderers();
                }
            });

            if (this.stream.isAvailable) {
                this.setState({isAvailable: true}); 
                const rendererContainer = document.createElement('div');
                document.getElementById(`${this.userId}-${this.stream.type}-${this.stream.id}`).appendChild(rendererContainer);
                this.stream.render(rendererContainer);
            }
        }
    }

    render() {
        if(this.state.isAvailable) {
            return (
                <div className="m-1">
                    <Card.Title>
                        <div className="w-75">
                            {this.userId}'s {this.stream.type === 'Video' ? 'Video' : 'Screen Share'}
                        </div>
                    </Card.Title>
                    <Card.Body style={{ padding: 0 }}>
                        <div className="w-100" id={`${this.userId}-${this.stream.type}-${this.stream.id}`}></div>
                    </Card.Body>
                </div>
            );
        } else {
            return null;
        }
    }
}



