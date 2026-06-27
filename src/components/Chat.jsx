import React, { useContext } from 'react'
import Cam from "../img/cam.png"
import Add from "../img/add.png"
import More from "../img/more.png"
import Messages from './Messages'
import Input from './Input'
import { ChatContext } from '../context/ChatContext'
import { CallContext } from '../context/CallContext'

const Chat = () => {
  const {data} = useContext(ChatContext);
  const { initiateCall } = useContext(CallContext);

  if (!data.user || !data.user.uid) {
    return (
      <div className="chat no-chat-selected">
        <div className="welcomeContainer">
          <div className="welcomeLogo">Guftgu</div>
          <h1>Connect & Converse Instantly</h1>
          <p>
            Choose a contact from the sidebar to start high-quality texting and peer-to-peer video calling.
          </p>
          <div className="welcomeFeatures">
            <div className="featureItem">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
              </svg>
              <span>Instant Chat Messaging</span>
            </div>
            <div className="featureItem">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
              <span>P2P HD Video Calling</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='chat'>
      <div className="chatInfo">
        <span>{data.user.displayName}</span>
        <div className="chatIcons">
          <img src={Cam} alt="Call" onClick={() => data.user.uid && initiateCall(data.user)} />
          <img src={Add} alt="" />
          <img src={More} alt="" />
        </div>
      </div>
      <Messages />
      <Input />
    </div>
  )
}

export default Chat