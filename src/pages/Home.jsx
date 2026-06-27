import React from 'react'
import Sidebar from '../components/Sidebar'
import Chat from '../components/Chat'
import CallOverlay from '../components/CallOverlay'

const Home = () => {
  return (
    <div className='home'>
      <div className="container">
        <Sidebar />
        <Chat />
      </div>
      <CallOverlay />
    </div>
  )
}

export default Home