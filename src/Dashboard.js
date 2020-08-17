import React, { Component } from 'react';
import { Navbar, Jumbotron, Button, Card, FormControl, InputGroup } from 'react-bootstrap';
import logo from './logo.svg';
import { CallingFactory, UserAccessTokenCredential, CallOptions } from '@skype/spool-sdk';
import { createClientLogger, setLogLevel } from '@azure/logger';
import CallCard from './CallCard';
import Chat from './Chat';

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.userDetails = props.userDetails;
        this.destinationId = null;
        this.callClient = null;

        this.state = {
            selectedCameraDeviceId: null,
            selectedSpeakerDeviceId: null,
            selectedMicrophoneDeviceId: null,
            showCameraNotFoundWarning: false,
            showSpeakerNotFoundWarning: false,
            showMicrophoneNotFoundWarning: false
        };
    }

    async componentDidMount() {
        const tokenCredential = new UserAccessTokenCredential(this.userDetails.token);
        const logger = createClientLogger('ACS');
        setLogLevel('verbose');
        logger.verbose.log = (...args) => { console.log(...args); };
        logger.info.log = (...args) => { console.info(...args); };
        logger.warning.log = (...args) => { console.warn(...args); };
        logger.error.log = (...args) => { console.error(...args); };
        const options = { platformId: 3617, logger: logger };
        tokenCredential.on('tokenWillExpire', () => alert('token will expire, do something!!!'));
        this.callClient = await CallingFactory.create(tokenCredential, options);
        this.setState({ callClient: this.callClient });
        this.callClient.on('callsUpdated', e => {
            console.log(`EVENT, callsUpdated, added=${e.added}, removed=${e.removed}`);

            e.added.forEach(call => {
                if (this.state.call && call.isIncoming) {
                    call.reject();
                    return;
                }
                this.setState({ call: call, callEndReason: undefined })
            });

            e.removed.forEach(call => {
                if (this.state.call && this.state.call === call) {
                    this.setState({
                        call: null,
                        callEndReason: this.state.call.callEndReason
                    });
                }
            });
        });
    }

    placeCall = async () => {
        try {
            this.state.callClient.call([this.destinationId], this.getPlaceCallOptions());
        } catch (e) {
            console.log('Failed to place a call', e);
        }
    };

    getPlaceCallOptions = () => {
        let placeCallOptions = {
            videoOptions: {
                camera: undefined
            },
            audioOptions: {
                microphone: undefined,
                speakers: undefined,
                muted: false
            }
        };
        let cameraDevice = undefined;
        let speakerDevice = undefined;
        let microphoneDevice = undefined;

        cameraDevice = this.state.callClient.deviceManager.getCameraList()[0];
        if (cameraDevice) {
            this.setState({ selectedCameraDeviceId: cameraDevice.id });
            placeCallOptions.videoOptions = { camera: cameraDevice };
        } else {
            this.setState({ showCameraNotFoundWarning: true });
            placeCallOptions.videoOptions = undefined;
        }

        speakerDevice = this.state.callClient.deviceManager.getSpeakerList()[0];
        if (speakerDevice) {
            this.setState({ selectedSpeakerDeviceId: speakerDevice.id });
            placeCallOptions.audioOptions.speakers = speakerDevice;
        } else {
            this.setState({ showSpeakerNotFoundWarning: true });
        }

        microphoneDevice = this.state.callClient.deviceManager.getMicrophoneList()[0];
        if (microphoneDevice) {
            this.setState({ selectedMicrophoneDeviceId: microphoneDevice.id });
            placeCallOptions.audioOptions.microphone = microphoneDevice;
        } else {
            this.setState({ showMicrophoneNotFoundWarning: true });
        }

        return placeCallOptions;
    }

    handleDestinationIdChange = (evt) => {
        console.log(evt.target.value);
        this.destinationId = evt.target.value;
    }

    render() {
        return (
            <div>
                <Navbar bg="dark" variant="dark">
                    <Navbar.Brand href="#home">
                        <img
                            alt=""
                            src="https://i1.wp.com/jaredrhodes.com/wp-content/uploads/2019/01/azure-logo.png?fit=1200%2C936&ssl=1"
                            width="30"
                            height="30"
                            className="d-inline-block align-top"
                        />{' '}
                        Azure Communication Services
                    </Navbar.Brand>
                </Navbar>
                <Jumbotron>
                    <h1>Hello, John Doe!</h1>
                    <p>
                        <b>Identity:</b> {this.userDetails.identity} <br />
                    </p>
                    <p>
                        <InputGroup className="mb-3" style={{ width: '45%' }}>
                            <FormControl
                                placeholder="Enter destination user ID"
                                aria-describedby="placeCall-btn"
                                id="destinationID"
                                onChange={this.handleDestinationIdChange}
                            />
                            <InputGroup.Append>
                                <Button id="placeCall-btn" onClick={() => this.placeCall()}>Place call</Button>
                            </InputGroup.Append>
                        </InputGroup>
                    </p>
                </Jumbotron>
                {/* Call Card */}
                <Card style={{ width: '65%', marginTop: '40px', marginLeft: '24px' }}>
                    <Card.Body>
                        <Card.Title>Call section</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted"></Card.Subtitle>
                        <Card.Body>
                            {
                                this.state.call && (<CallCard call={this.state.call}
                                    callClient={this.state.callClient}
                                    selectedCameraDeviceId={this.state.selectedCameraDeviceId}
                                    selectedSpeakerDeviceId={this.state.selectedSpeakerDeviceId}
                                    selectedMicrophoneDeviceId={this.state.selectedMicrophoneDeviceId} />)
                            }
                        </Card.Body>
                    </Card.Body>
                </Card>
                {/* Chat Component */}
                <Chat />
            </div>
        );
    }
}

export default Dashboard;