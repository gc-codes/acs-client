// © Microsoft Corporation. All rights reserved.
// , { useState, useEffect, FormEvent }
import React from "react";
import { Button, Spinner, ButtonGroup } from "react-bootstrap";
import { DefaultButton } from 'office-ui-fabric-react'
import StreamMedia from "./StreamMedia";
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel';
import { Separator } from 'office-ui-fabric-react/lib/Separator';
import LocalVideoPreviewCard from './LocalVideoPreviewCard';
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';

class CallCard extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            call: props.call,
            callClient: props.callClient,
            callState: props.call.state,
            remoteParticipants: props.call.remoteParticipants,
            streams: [],
            videoOn: true,
            micOn: true,
            onHold: false,
            screenShareOn: false,
            cameraDeviceOptions:[],
            speakerDeviceOptions:[],
            microphoneDeviceOptions:[],
            selectedCameraDeviceId: props.selectedCameraDeviceId,
            selectedSpeakerDeviceId: props.selectedSpeakerDeviceId,
            selectedMicrophoneDeviceId: props.selectedMicrophoneDeviceId,
            showSettings: false,
            showLocalVideo: false
        };
    }

    componentWillMount() {
        if (this.state.call) {
            const cameraDevices = this.state.callClient.deviceManager.getCameraList();
            const speakerDevices = this.state.callClient.deviceManager.getSpeakerList();
            const microphoneDevices = this.state.callClient.deviceManager.getMicrophoneList();

            cameraDevices.map(cameraDevice => { this.state.cameraDeviceOptions.push({key: cameraDevice.id, text: cameraDevice.name}) });
            speakerDevices.map(speakerDevice => { this.state.speakerDeviceOptions.push({key: speakerDevice.id, text: speakerDevice.name}) });
            microphoneDevices.map(microphoneDevice => { this.state.microphoneDeviceOptions.push({key: microphoneDevice.id, text: microphoneDevice.name}) });

            this.state.callClient.deviceManager.on('videoDevicesUpdated', e => {
                e.added.forEach(cameraDevice => { this.state.cameraDeviceOptions.push({key: cameraDevice.id, text: cameraDevice.name}); });

                e.removed.forEach(removedCameraDevice => {
                    this.state.cameraDeviceOptions.forEach((value, index) => {
                        if(value.key === removedCameraDevice.id) {
                            this.state.cameraDeviceOptions.splice(index, 1);
                            if(removedCameraDevice.id === this.state.selectedCameraDeviceId) {
                                const cameraDevice = this.state.callClient.deviceManager.getCameraList()[0];
                                this.state.callClient.deviceManager.setCamera(cameraDevice);
                                this.setState({selectedCameraDeviceId: cameraDevice.id});
                            }
                        }
                    });
                });
            });

            this.state.callClient.deviceManager.on('audioDevicesUpdated', e => {
                e.added.forEach(audioDevice => {
                    if (audioDevice.deviceType === 'Speaker') {
                        this.state.speakerDeviceOptions.push({key: audioDevice.id, text: audioDevice.name});

                    } else if(audioDevice.deviceType === 'Microphone') {
                        this.state.microphoneDeviceOptions.push({key: audioDevice.id, text: audioDevice.name});
                    }
                });

                e.removed.forEach(removedAudioDevice => {
                    if(removedAudioDevice.deviceType === 'Speaker') {
                        this.state.speakerDeviceOptions.forEach((value, index) => {
                            if(value.key === removedAudioDevice.id) {
                                this.state.speakerDeviceOptions.splice(index, 1);
                                if(removedAudioDevice.id === this.state.selectedSpeakerDeviceId) {
                                    const speakerDevice = this.state.callClient.deviceManager.getSpeakerList()[0];
                                    this.state.callClient.deviceManager.setSpeakers(speakerDevice);
                                    this.setState({selectedSpeakerDeviceId: speakerDevice.id});
                                }
                            }
                        });
                    } else if (removedAudioDevice.deviceType === 'Microphone') {
                        this.state.microphoneDeviceOptions.forEach((value, index) => {
                            if(value.key === removedAudioDevice.id) {
                                this.state.microphoneDeviceOptions.splice(index, 1);
                                if(removedAudioDevice.id === this.state.selectedMicrophoneDeviceId) {
                                    const microphoneDevice = this.state.callClient.deviceManager.getMicrophoneList()[0];
                                    this.state.callClient.deviceManager.setMicrophone(microphoneDevice);
                                    this.setState({selectedMicrophoneDeviceId: microphoneDevice.id});
                                }
                            }
                        });
                    }
                });
            });

            const onCallStateChanged = () => {
                console.log('callStateChanged', this.state.call.state);
                this.setState({callState: this.state.call.state});

                if (this.state.call.state === 'Incoming') {
                    this.selectedCameraDeviceId = cameraDevices[0]?.id;
                    this.selectedSpeakerDeviceId = speakerDevices[0]?.id;
                    this.selectedMicrophoneDeviceId = microphoneDevices[0]?.id;
                }
            }
            onCallStateChanged();
            this.state.call.on('callStateChanged', onCallStateChanged);

            this.state.call.remoteParticipants.forEach(rp => this.subscribeToRemoteParticipant(rp));
            this.state.call.on('remoteParticipantsUpdated', e => {
                console.log(`EVENT, call=${this.state.call.callId}, remoteParticipantsUpdated, added=${e.added}, removed=${e.removed}`);
                e.added.forEach(p => {
                    console.log('participantAdded', p);
                    this.subscribeToRemoteParticipant(p);
                    this.setState({remoteParticipants: [...this.state.call.remoteParticipants.values()]});
                });
                e.removed.forEach(p => {
                    console.log('participantRemoved');
                    this.setState({remoteParticipants: [...this.state.call.remoteParticipants.values()]});
                });
            });
        }
    }

    subscribeToRemoteParticipant(participant) {
        const userId = participant.userId;
        participant.on('participantStateChanged', () => {
            console.log('EVENT participantStateChanged', participant.userId, participant.state);
            this.setState({remoteParticipants: [...this.state.call.remoteParticipants.values()]});
        });

        const handleParticipantStream = (e) => {
            e.added.forEach(stream => {
                console.log('video stream added', userId, stream, stream.type);
                    this.setState({streams: this.state.streams.concat({stream: stream, userId: userId})});
            });
            e.removed.forEach(stream => {
                console.log('video stream removed', userId, stream, stream.type)
            });
        }

        // Get participants video streams and screen sharing streams
        let participantStreams = participant.videoStreams.map(v => { return {stream: v, userId:userId}}).concat(participant.screenSharingStreams.map(v => {return {stream: v, userId: userId}}));
        // Filter out the participant stream tuples that are not already in this.state.streams
        participantStreams = participantStreams.filter(streamTuple => {return !this.state.streams.some(tuple => { return tuple.stream === streamTuple.stream && tuple.userId === streamTuple.userId})});
        // Add participantStreams to the list of all remote participant streams
        this.setState({streams: this.state.streams.concat(participantStreams)});
        participant.on('videoStreamsUpdated', handleParticipantStream);
        participant.on('screenSharingStreamsUpdated', handleParticipantStream);
    }

    async handleAcceptCall() {
        let cameraDevice;
        let speakerDevice;
        let microphoneDevice;

        if(this.state.selectedCameraDeviceId) {
            cameraDevice = this.state.callClient.deviceManager.getCameraList().find(cameraDevice => { return cameraDevice.id === this.state.selectedCameraDeviceId })
        } else {
            cameraDevice = this.state.callClient.deviceManager.getCameraList()[0];
        }

        if(this.state.selectedSpeakerDeviceId) {
            speakerDevice = this.state.callClient.deviceManager.getSpeakerList().find(speakerDevice => { return speakerDevice.id === this.state.selectedSpeakerDeviceId })
        } else {
            speakerDevice = this.state.callClient.deviceManager.getSpeakerList()[0];
        }

        if(this.state.selectedMicrophoneDeviceId) {
            microphoneDevice = this.state.callClient.deviceManager.getMicrophoneList().find(microphoneDevice => { return microphoneDevice.id === this.state.selectedMicrophoneDeviceId })
        } else {
            microphoneDevice = this.state.callClient.deviceManager.getMicrophoneList()[0];
        }

        this.state.call.accept({
            videoOptions: this.state.videoOn && cameraDevice ? { camera: cameraDevice } : undefined,
            audioOptions: {
                microphone: this.state.micOn && microphoneDevice ? microphoneDevice : undefined,
                speaker: speakerDevice ? speakerDevice : undefined
            }
        }).catch((e) => console.error(e));
    }

    getIncomingActionContent() {
        return (
            <>
                <Button
                    variant="success"
                    className="my-3"
                    onClick={() => this.handleAcceptCall()}>
                    <i className="fas fa-phone"></i>Accept
                </Button>
            </>
        );
    }

    async handleVideoOnOff () {
        try {
            if (this.state.videoOn) {
                if (this.state.call.localVideoStreams && this.state.call.localVideoStreams.length > 0) {
                    await this.state.call.stopVideo(this.state.call.localVideoStreams[0]);
                }
            } else {
                await this.state.call.startVideo();
            }
            this.setState({videoOn: !this.state.videoOn});
        } catch(e) {
            console.error(e);
        }
    }

    async handleMicOnOff() {
        try {
            if (this.state.micOn) {
                await this.state.call.mute();
            } else {
                await this.state.call.unmute();
            }
            this.setState({micOn: !this.state.micOn});
        } catch(e) {
            console.error(e);
        }
    }

    async handleHoldUnhold() {
        try {
            if (this.state.onHold) {
                await this.state.call.unhold();
            } else {
                await this.state.call.hold();
            }
            this.setState({onHold: !this.state.onHold});
        } catch(e) {
            console.error(e);
        }
    }

    handleRemoveParticipant(e, userId) {
        e.preventDefault();
        this.state.call.removeParticipant(userId).catch((e) => console.error(e))
    }

    async handleScreenSharingOnOff() {
        try {
            if (this.state.screenShareOn) {
                await this.state.call.stopScreenSharing()
            } else {
                await this.state.call.startScreenSharing();
            }
            this.setState({screenShareOn: !this.state.screenShareOn});
        } catch(e) {
            console.error(e);
        }
    }

    cameraDeviceSelectionChanged = (event, item) => {
        const cameraDeviceInfo = this.state.callClient.deviceManager.getCameraList().find(cameraDeviceInfo => {
                                                                                        return cameraDeviceInfo.id === item.key
                                                                                    });
        this.state.callClient.deviceManager.setCamera(cameraDeviceInfo);
        this.setState({selectedCameraDeviceId: cameraDeviceInfo.id});
    };

    speakerDeviceSelectionChanged = (event, item) => {
        const speakerDeviceInfo = this.state.callClient.deviceManager.getSpeakerList().find(speakerDeviceInfo => {
                                                                                            return speakerDeviceInfo.id === item.key
                                                                                        });
        this.state.callClient.deviceManager.setSpeakers(speakerDeviceInfo);
        this.setState({selectedSpeakerDeviceId: speakerDeviceInfo.id});
    };

    microphoneDeviceSelectionChanged = (event, item) => {
        const microphoneDeviceInfo = this.state.callClient.deviceManager.getMicrophoneList().find(microphoneDeviceInfo => {
                                                                                            return microphoneDeviceInfo.id === item.key
                                                                                        });
        this.state.callClient.deviceManager.setMicrophone(microphoneDeviceInfo);
        this.setState({selectedMicrophoneDeviceId: microphoneDeviceInfo.id});
    };

    render() {
        return (
            <div className="mt-2">
                <h3>{this.state.callState}</h3>
                <div className="d-sm-flex flex-sm-row flex-lg-row justify-content-around flex-sm-wrap flex-lg-nowrap">
                    <div className="d-flex flex-lg-column justify-content-between w-sm-100 w-lg-25 ">
                        <div>
                            {
                                this.state.callState === 'Connected' && this.state.showLocalVideo &&
                                <div className="mb-3">
                                    <LocalVideoPreviewCard callClient={this.state.callClient}/>
                                </div>
                            }
                        </div>
                    </div>
                    <div className="d-sm-flex flex-sm-column flex-lg-column justify-content-center w-sm-100 w-lg-75 flex-wrap">
                        <div>
                            {
                                <div className="d-flex flex-lg-row justify-content-around flex-wrap">
                                    {
                                        this.state.streams.map((v, index) =>
                                            <StreamMedia key={index} stream={v.stream} userId={v.userId}/>
                                        )
                                    }
                                </div>
                            }
                        </div>
                        <div className="my-4">
                            {
                                (this.state.callState === 'Incoming' || this.state.callState === 'Ringing' || this.state.callState === 'Connecting') &&
                                (<Spinner animation="grow" variant="secondary" className="d-block mx-auto mb-3" />)
                            }
                            <div className="d-flex justify-content-center">
                                <ButtonGroup style={{height: "50px", width:"280px"}}>
                                    <Button
                                        title={`Turn your video ${this.state.videoOn ? 'off' : 'on'}`}
                                        variant="secondary"
                                        onClick={() => this.handleVideoOnOff()}>
                                        <i className={`fas fa-video${this.state.videoOn ? '' : '-slash'}`}></i>
                                    </Button>
                                    <Button
                                        title={`${this.state.micOn ? 'Mute' : 'Unmute'} your microphone`}
                                        variant="secondary"
                                        onClick={() => this.handleMicOnOff()}>
                                        <i className={`fas fa-microphone${this.state.micOn ? '' : '-slash'}`}></i>
                                    </Button>
                                    {
                                        (this.state.callState === 'Connected' || this.state.callState === 'LocalHold') &&
                                        <Button
                                            title={`${this.state.onHold ? 'Unhold' : 'Hold'} call`} 
                                            variant="secondary"
                                            onClick={() => this.handleHoldUnhold()}>
                                            <i className={`fas ${this.state.onHold ? 'fa-play' : 'fa-pause'}`}></i>
                                        </Button>
                                    }
                                    <Button
                                        title={`${this.state.screenShareOn ? 'Stop' : 'Start'} sharing your screen`} 
                                        variant="secondary"
                                        onClick={() => this.handleScreenSharingOnOff()}>
                                        <i className={`fas fa-${this.state.screenShareOn ? 'stop-circle' : 'desktop'}`}></i>
                                    </Button>
                                    <Button
                                        title="Settings"
                                        variant="secondary"
                                        onClick={() => this.setState({showSettings: true})}>
                                        <i className="fa fa-cog"></i>
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => this.state.call.hangUp({forEveryone: false}).catch((e) => console.error(e))}>
                                        <i className="fas fa-phone-slash"></i>
                                    </Button>
                                </ButtonGroup>
                                <Panel
                                    type={PanelType.medium}
                                    isLightDismiss
                                    isOpen={this.state.showSettings}
                                    onDismiss={() => this.setState({showSettings: false})}
                                    closeButtonAriaLabel="Close"
                                    headerText="Settings">
                                        <Separator></Separator>
                                        <div>
                                            <h6>Video settings</h6>
                                            <div className="d-flex flex-lg-row justify-content-between align-items-center ml-3 my-3">
                                                <div>Camera preview</div>
                                                <DefaultButton onClick={() => this.setState({showLocalVideo: !this.state.showLocalVideo})}>
                                                    Show/Hide
                                                </DefaultButton>
                                            </div>
                                            <div className="d-flex flex-lg-row justify-content-between align-items-center ml-3 my-3">
                                                <div>Camera</div>
                                                {
                                                    this.state.cameraDeviceOptions.length > 0  && this.state.callState === 'Connected' &&
                                                    <Dropdown
                                                        defaultSelectedKey={this.state.callClient.deviceManager.getCamera()?.id}
                                                        selectedKey={this.state.selectedCameraDeviceId}
                                                        onChange={this.cameraDeviceSelectionChanged}
                                                        options={this.state.cameraDeviceOptions}
                                                        disabled={this.state.callClient.deviceManager.getCameraList().length === 0 }
                                                        placeHolder={this.state.callClient.deviceManager.getCameraList().length === 0 ? 'No camera devices found' :
                                                                    this.state.callClient.deviceManager.getCamera() ? '' : 'Select camera'}
                                                        styles={{dropdown: { width: 400 }}}
                                                    />
                                                }
                                            </div>
                                        </div>
                                        <Separator></Separator>
                                        <div>
                                            <h6>Sound Settings</h6>
                                            <div className="d-flex flex-lg-row justify-content-between align-items-center ml-3 my-3">
                                                <div>Speaker</div>
                                                {
                                                    this.state.speakerDeviceOptions.length > 0 && this.state.callState === 'Connected' &&
                                                    <Dropdown
                                                        defaultSelectedKey={this.state.callClient.deviceManager.getSpeaker()?.id}
                                                        selectedKey={this.state.selectedSpeakerDeviceId}
                                                        onChange={this.speakerDeviceSelectionChanged}
                                                        options={this.state.speakerDeviceOptions}
                                                        disabled={this.state.callClient.deviceManager.getSpeakerList().length === 0}
                                                        placeHolder={this.state.callClient.deviceManager.getSpeakerList().length === 0 ? 'No speaker devices found' :
                                                                    this.state.callClient.deviceManager.getSpeaker() ? '' : 'Select speaker'}
                                                        styles={{dropdown: { width: 400 }}}
                                                    />
                                                }
                                            </div>
                                            <div className="d-flex flex-lg-row justify-content-between align-items-center ml-3 my-3">
                                                <div>Microphone</div>
                                                {
                                                    this.state.microphoneDeviceOptions.length > 0 && this.state.callState === 'Connected' &&
                                                    <Dropdown
                                                        defaultSelectedKey={this.state.callClient.deviceManager.getMicrophone()?.id}
                                                        selectedKey={this.state.selectedMicrophoneDeviceId}
                                                        onChange={this.microphoneDeviceSelectionChanged}
                                                        options={this.state.microphoneDeviceOptions}
                                                        disabled={this.state.callClient.deviceManager.getMicrophoneList().length === 0}
                                                        placeHolder={this.state.callClient.deviceManager.getMicrophoneList().length === 0 ? 'No microphone devices found' :
                                                                    this.state.callClient.deviceManager.getMicrophone() ? '' : 'Select microphone'}
                                                        styles={{dropdown: { width: 400 }}}
                                                    />
                                                }
                                            </div>
                                        </div>
                                        <Separator></Separator>
                                </Panel>
                            </div>
                            <div className="d-flex justify-content-center">
                            {
                                this.state.callState === 'Incoming' ? this.getIncomingActionContent() : undefined
                            }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default CallCard;