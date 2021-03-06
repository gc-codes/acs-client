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
import { ChatClient } from '@ic3/communicationservices-chat';
import { CommunicationUserCredential } from '@azure/communication-common';
import { concatStyleSetsWithProps } from 'office-ui-fabric-react';

class Dashboard extends Component {
    constructor(props) {
        super(props);
        this.userDetails = props.userDetails;
        this.callClient = null;
        this.otherUsers = [];
        this.chatClient = null;

        this.state = {
            selectedCameraDeviceId: null,
            selectedSpeakerDeviceId: null,
            selectedMicrophoneDeviceId: null,
            showCameraNotFoundWarning: false,
            showSpeakerNotFoundWarning: false,
            showMicrophoneNotFoundWarning: false,
            selectedUser: null,
            messageTextBox: "",
            messages: [
                new Message({
                    id: 1,
                    message: "Hey, how you doing?",
                }),
                new Message({ id: 0, message: "Hi I am doing great thanks ;)" }),
            ],
            lastMessageId: null
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
            this.state.callClient.call([this.state.selectedUser.spoolID], this.getPlaceCallOptions());
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

    formatMessages(messages) {
        let messageList = [];
        if (typeof messages !== "undefined" && messages.length > 0) {
            messages.forEach(message => {
                if (message.senderDisplayName === this.userDetails.username) {
                    messageList.push(new Message({ id: 0, message: message.content }));
                } else {
                    messageList.push(new Message({ id: 1, message: message.content }));
                }
            });
        }
        return messageList;
    }

    // Select user to chat or have a call with
    selectUser = (user) => {
        this.getInitialChatData(user).then(response => {
            user.chatThreadID = response.threadId;
            let messageList = [];
            let newlatestMessageId = null;
            if (typeof response.messages !== "undefined") {
                messageList = this.formatMessages(response.messages);
                newlatestMessageId = response.messages[response.messages.length - 1].messageId;
            }
            this.setState({ selectedUser: user, messages: messageList, latestMessageId: newlatestMessageId }
                ,
                () => {
                    setInterval(() => {
                        console.log("Polling to server");
                        this.getNewerMessages(this.state.selectedUser.chatThreadID, this.state.latestMessageId).then(newMessagesResponse => {
                            let newMessageList = this.formatMessages(newMessagesResponse);
                            console.log(newMessagesResponse);
                            if (newMessagesResponse.length > 0) {
                                let newlatestMessageID = newMessagesResponse[newMessagesResponse.length - 1].messageId;
                                this.setState({ messages: [...this.state.messages, ...newMessageList], latestMessageId: newlatestMessageID });
                            }
                        });
                    }, 5000);
                }
            );
        })
    }

    async getInitialChatData(user) {
        const headers = {
            'Authorization': 'Bearer ' + this.props.userDetails.token
        };
        let data = {
            spoolToken: this.userDetails.spoolToken,
            secondaryUsername: user.username
        };
        let chatThreadResponse = await axios.post('/chat/createThread', data, { headers });
        return chatThreadResponse.data;
    }

    async getNewerMessages(chatThreadID, lastMessageId) {
        const headers = {
            'Authorization': 'Bearer ' + this.props.userDetails.token
        };
        console.log("Latest Message ID: " + lastMessageId);
        let newerMessagesResponse = await axios.get(`/chat/getNewerMessages?threadId=${chatThreadID}&lastMessageId=${lastMessageId}`, { headers });
        // Newer messages response
        console.log("newerMessagesResponse");
        console.log(newerMessagesResponse.data);
        console.log(lastMessageId);
        return newerMessagesResponse.data;
    }

    async sendMessage(message) {
        const headers = {
            'Authorization': 'Bearer ' + this.props.userDetails.token
        }
        let data = {
            threadId: this.state.selectedUser.chatThreadID,
            messageText: message,
            spoolToken: this.props.userDetails.spoolToken
        }
        let sendMessageResponse = await axios.post('/chat/sendMessage/', data, { headers });
        return sendMessageResponse;
    }

    handleMessageChange = (event) => {
        // implement send typing notif
        this.setState({
            messageTextBox: event.target.value
        })
    }

    handleMessageSent = (event) => {
        // Send message
        this.sendMessage(this.state.messageTextBox);
        this.state.messageTextBox = "";
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
                                    <Card.Body id="chatArea">
                                        <div style={{ minHeight: '100%', maxHeight: '500px', overflowY: 'scroll', width: '100%', padding: '12px' }}>
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
                                        </div>
                                    </Card.Body> : <SelectUserBody />}

                                {(!this.state.call && this.state.selectedUser) && <Card.Footer>
                                    <InputGroup className="mb-3" style={{ width: '100%' }}>
                                        <FormControl
                                            placeholder="Type a message"
                                            aria-describedby="sendMessage-btn"
                                            value={this.state.messageTextBox}
                                            onChange={this.handleMessageChange}
                                            required={true}
                                        />
                                        <InputGroup.Append>
                                            <Button variant="success" id="sendMessage-btn" onClick={this.handleMessageSent}>Send</Button>
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