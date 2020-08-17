import React, { Component } from 'react'
import { Launcher } from 'react-chat-window'

class Chat extends Component {

    constructor() {
        super();
        this.state = {
            messageList: [
                {
                    author: 'them',
                    type: 'text',
                    data: {
                        text: 'Hi!'
                    }
                },
                {
                    author: 'me',
                    type: 'text',
                    data: {
                        text: 'Hey'
                    }
                },
            ]
        };
        console.log("chat open");
    }

    _onMessageWasSent(message) {
        this.setState({
            messageList: [...this.state.messageList, message]
        })
    }

    _sendMessage(text) {
        if (text.length > 0) {
            this.setState({
                messageList: [...this.state.messageList, {
                    author: 'them',
                    type: 'text',
                    data: { text }
                }]
            })
        }
    }

    render() {
        return (<div>
            <Launcher
                agentProfile={{
                    teamName: 'ACS - Chat',
                }}
                onMessageWasSent={this._onMessageWasSent.bind(this)}
                messageList={this.state.messageList}
                showEmoji
            />
        </div>)
    }
}

export default Chat;


// import React, { Component } from 'react';
// import { ChatFeed, Message } from 'react-chat-ui';

// class Chat extends Component {
//     constructor(props) {
//         super(props);
//         this.state = {
//             messages: [
//                 new Message({
//                     id: 1,
//                     message: "Recepient",
//                 }),
//                 new Message({
//                     id: 0,
//                     message: "Sender",
//                 }),
//             ],
//         };
//     }

//     render() {
//         return (
//             <ChatFeed
//                 messages={this.state.messages} // Boolean: list of message objects
//                 isTyping={this.state.is_typing} // Boolean: is the recipient typing
//                 hasInputField={false} // Boolean: use our input, or use your own
//                 showSenderName // show the name of the user who sent the message
//                 bubblesCentered={false} //Boolean should the bubbles be centered in the feed?
//                 // JSON: Custom bubble styles
//                 bubbleStyles={
//                     {
//                         text: {
//                             fontSize: 30
//                         },
//                         chatbubble: {
//                             borderRadius: 70,
//                             padding: 40
//                         }
//                     }
//                 }
//             />

//         )

//     }
// }

// export default Chat;