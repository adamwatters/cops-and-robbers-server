import React, { useState, useEffect } from 'react'

function App({ ws }) {
    const [inputValue, setInputValue] = useState('')
    const [events, setEvents] = useState([])
    const [socket, setSocket] = useState(null)

    useEffect(() => {
        console.log('setting up socket')
        var HOST = location.origin.replace(/^http/, 'ws')
        var newSocket = new WebSocket(HOST)
        setSocket(newSocket)
    }, [])

    useEffect(() => {
        if (socket != null) {
            socket.onmessage = (event) => {
                console.log('Message from server ', event.data)
                setEvents([event, ...events])
            }
        }
    }, [socket, events])

    return (
        <div className="App">
            <input
                placeholder="pick a name"
                value={inputValue}
                onChange={(event) => {
                    setInputValue(event.target.value)
                }}
            />
            <button
                onClick={() => {
                    console.log(socket)
                    if (socket) {
                        socket.send(
                            JSON.stringify({
                                type: 'joinGame',
                                playerName: inputValue,
                            })
                        )
                    }
                }}
            >
                Join
            </button>
            {events.map((event) => {
                return <div key={event.timeStamp}>{event.data}</div>
            })}
        </div>
    )
}

export default App
