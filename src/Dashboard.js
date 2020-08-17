import React, { Component } from 'react';
import { Navbar, Jumbotron, Button, Card, FormControl, InputGroup, Media, Container, Row, Col } from 'react-bootstrap';
import logo from './logo.svg';
import { ChatFeed, Message } from 'react-chat-ui';
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
            showMicrophoneNotFoundWarning: false,
            messageTextBox : "",
            messages: [
                new Message({
                    id: 1,
                    message: "Hey, how you doing?",
                }),
                new Message({ id: 0, message: "Hi I am doing great thanks ;)" }),
            ],
        };

        this.handleMessageChange = this.handleMessageChange.bind(this);
        this.handleMessageSent = this.handleMessageSent.bind(this);
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

    handleMessageChange(event){
        // implement send typing notif
        console.log(event.target.value);
        this.setState({
            messageTextBox : event.target.value
        })
    }

    handleMessageSent(event){
        let message = new Message({
            id: 0,
            message: this.state.messageTextBox,
        })
        this.setState({
            messages : [...this.state.messages, message],
            messageTextBox : ""
        })
    }

    render() {
        return (
            <div style={{ height: '80%' }}>
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
                    <Navbar.Collapse className="justify-content-end">
                        <Navbar.Text>
                            <b>Identity:</b> { this.userDetails.identity }
                        </Navbar.Text>
                    </Navbar.Collapse>
                </Navbar>
                <Container style={{ height: '100%', marginTop: '40px' }}>
                    <Row style={{ height: '100%' }}>
                        <Col style={{ padding: '0px' }}>
                            <Card style={{ borderRadius: '0px', height: '100%' }}>
                                <Card.Title style={{ paddingLeft: '14px', paddingTop: '12px' }}>Users</Card.Title>
                                <ul className="list-unstyled">
                                    <li><Card.Header><img src="https://a1cf74336522e87f135f-2f21ace9a6cf0052456644b80fa06d4f.ssl.cf2.rackcdn.com/images/characters_opt/p-friends-matt-leblanc.jpg" style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '8px' }} />Joey Tribbiani</Card.Header></li>
                                    <li><Card.Header><img src="https://pbs.twimg.com/profile_images/928266336073117696/W2gCidjA_400x400.jpg" style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '8px' }}/>Jake Peralta</Card.Header></li>
                                    <li><Card.Header><img src="https://pyxis.nymag.com/v1/imgs/079/792/3ed0d94be0a9bd3d023f00532889bab152-30-chandler-bing.rsquare.w330.jpg" style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '8px' }}/>Chandler Bing</Card.Header></li>
                                    <li><Card.Header><img src="https://i.pinimg.com/236x/72/e2/a5/72e2a574c0b19066ffda716eceeb7d78.jpg" style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '8px' }}/>Amy Santiago</Card.Header></li>
                                </ul>
                            </Card>
                        </Col>
                        <Col style={{ padding: '0px' }}>
                            <Card style={{ width: '700px', borderRadius: '0px', height: '100%' }}>
                                <Card.Header>
                                    <b>Joey Tribbiani</b>
                                    <Button style={{ float: 'right', borderTopLeftRadius: '0px', borderBottomLeftRadius: '0px' }} id="placeCall-btn" onClick={() => this.placeCall()}><i className="fas fa-phone"></i></Button>
                                    <FormControl
                                        style={{ width: '200px', float: 'right', borderTopRightRadius: '0px', borderBottomRightRadius: '0px' }}
                                        placeholder="Enter destination user ID"
                                        aria-describedby="placeCall-btn"
                                        id="destinationID"
                                        onChange={this.handleDestinationIdChange}
                                    />

                                </Card.Header>
                                <Card.Body>
                                    {/* Calling UI goes here */}
                                    {
                                        this.state.call && (<CallCard call={this.state.call}
                                            callClient={this.state.callClient}
                                            selectedCameraDeviceId={this.state.selectedCameraDeviceId}
                                            selectedSpeakerDeviceId={this.state.selectedSpeakerDeviceId}
                                            selectedMicrophoneDeviceId={this.state.selectedMicrophoneDeviceId} />)
                                    }
                                    {/* Messages go here */}
                                    {!this.state.call &&
                                        (<ChatFeed
                                            messages={this.state.messages} // Boolean: list of message objects
                                            isTyping={this.state.is_typing} // Boolean: is the recipient typing
                                            hasInputField={false} // Boolean: use our input, or use your own
                                            showSenderName // show the name of the user who sent the message
                                            bubblesCentered={false} //Boolean should the bubbles be centered in the feed?
                                            // JSON: Custom bubble styles
                                            bubbleStyles={
                                                {
                                                    text: {
                                                        fontSize: 14
                                                    },
                                                    chatbubble: {
                                                        borderRadius: 4,
                                                        padding: 8
                                                    }
                                                }
                                            }
                                        />)}
                                </Card.Body>
                                <Card.Footer>
                                    <InputGroup className="mb-3" style={{ width: '100%' }}>
                                        <FormControl
                                            placeholder="Type a message"
                                            aria-describedby="sendMessage-btn"
                                            value = {this.state.messageTextBox}
                                            onChange={this.handleMessageChange}
                                        />
                                        <InputGroup.Append>
                                            <Button variant="success" id="sendMessage-btn" onClick={this.handleMessageSent}>Send</Button>
                                        </InputGroup.Append>
                                    </InputGroup>
                                </Card.Footer>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}

export default Dashboard;

// Old Components
{/* <Jumbotron>
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
                </Jumbotron> */}
{/* Call Card */ }
{/* <Card style={{ width: '65%', marginTop: '40px', marginLeft: '24px' }}>
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
                </Card> */}
{/* Chat Component */ }
{/* <Chat /> */ }