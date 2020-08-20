import React, { Component } from 'react';
import { Button, Card, FormControl, InputGroup, Container, Row, Col } from 'react-bootstrap';
import { ChatFeed, Message } from 'react-chat-ui';
import { CallingFactory, UserAccessTokenCredential } from '@skype/spool-sdk';
// , CallOptions
import { createClientLogger, setLogLevel } from '@azure/logger';
import CallCard from './CallCard';
// import Chat from './Chat';
import Navigation from './partials/Navigation';
import SelectUserBody from './partials/SelectUserBody';
import axios from 'axios';

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.userDetails = props.userDetails;
        this.callClient = null;
        this.otherUsers = [];

        this.state = {
            selectedCameraDeviceId: null,
            selectedSpeakerDeviceId: null,
            selectedMicrophoneDeviceId: null,
            showCameraNotFoundWarning: false,
            showSpeakerNotFoundWarning: false,
            showMicrophoneNotFoundWarning: false,
            selectedUser: null,
            messages: [
                new Message({
                    id: 1,
                    message: "Hey, how you doing?",
                }),
                new Message({ id: 0, message: "Hey, I'm doing great" }),
            ],
        };
    }

    async componentDidMount() {
        const tokenCredential = new UserAccessTokenCredential(this.userDetails.spoolToken);
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
        // Fetch other users
        this.getOtherUsers();
    }

    // Fetch other users
    getOtherUsers() {
        const headers = {
            'Authorization': 'Bearer ' + this.props.userDetails.token
        };
        axios.get('/user/getOtherUsers', { headers })
            // .then(response => console.log(response.data));
            .then(response => this.setState({ otherUsers: response.data.filter(user => user.username !== this.userDetails.username) }));
    }

    placeCall = async () => {
        try {
            this.getSpoolId(this.state.selectedUser).then(userSpoolID => {
                this.state.callClient.call([userSpoolID], this.getPlaceCallOptions());
            });
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

    // Select user to chat or have a call with
    selectUser = (user) => {
        if (user.spoolID === "") {
            this.getSpoolId(user).then(userSpoolID => {
                user.spoolID = userSpoolID;
                this.setState({ selectedUser: user });
            });
        } else {
            this.setState({ selectedUser: user });
        }
    }

    async getSpoolId(user) {
        const headers = {
            'Authorization': 'Bearer ' + this.props.userDetails.token
        };
        let response = await axios.get(`/user/getSpoolId?username=${user.username}`, { headers })
        return response.data.spoolID;
    }

    render() {
        return (
            <div style={{ height: '80%' }}>
                {/* Navbar goes here */}
                <Navigation userDetails={this.userDetails} />

                {/* Chat and call area container */}
                <Container style={{ height: '100%', marginTop: '40px' }}>
                    <Row style={{ height: '100%' }}>
                        <Col style={{ padding: '0px' }}>
                            <Card style={{ borderRadius: '0px', height: '100%' }}>
                                <a style={{ padding: '14px', paddingTop: '12px', borderBottom: '1px solid rgba(0,0,0,.14)', fontWeight: 'bold' }}>Users</a>
                                <ul className="list-unstyled">
                                    {(this.state.otherUsers) && this.state.otherUsers.map(user =>
                                        <li key={user.username} onClick={() => this.selectUser(user)}><Card.Header className="userListTile"><img src="https://immedilet-invest.com/wp-content/uploads/2016/01/user-placeholder-300x300.jpg" style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '8px' }} />{user.username}</Card.Header></li>
                                    )}
                                </ul>
                            </Card>
                        </Col>
                        <Col style={{ padding: '0px' }}>
                            <Card style={{ width: '700px', borderRadius: '0px', height: '100%' }}>
                                <Card.Header>
                                    <b>{(this.state.selectedUser) ? this.state.selectedUser.username : "Chat"}</b>
                                    {this.state.selectedUser && <Button variant="outline-success" style={{ float: 'right' }} id="placeCall-btn" onClick={() => this.placeCall()}><i className="fas fa-phone"></i></Button>}
                                </Card.Header>
                                {(this.state.selectedUser || this.state.call) ?
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
                                    </Card.Body> : <SelectUserBody />}
                                {(!this.state.call && this.state.selectedUser) && <Card.Footer>
                                    <InputGroup className="mb-3" style={{ width: '100%' }}>
                                        <FormControl
                                            placeholder="Type a message"
                                            aria-describedby="sendMessage-btn"
                                            onChange={this.handleMessageChange}
                                        />
                                        <InputGroup.Append>
                                            <Button variant="success" id="sendMessage-btn" onClick={() => { }}>Send</Button>
                                        </InputGroup.Append>
                                    </InputGroup>
                                </Card.Footer>}
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}

export default Dashboard;