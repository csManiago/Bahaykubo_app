import { useState } from 'react'
import './App.css'
import DetectionModal from './components/DetectionModal'

function App() {
  const handleDetect = (data) => {
    console.log('Detection result:', data)
  }

  return (
    <DetectionModal 
      onClose={() => {}} 
      onDetect={handleDetect}
    />
  )
}

export default App
