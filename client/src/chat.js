import React, { useState } from 'react';


function Chat(){
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault()
        fetch('http://localhost:8000/interview', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({message})
        })
        .then((res) => res.json())
        .then((data) => setResponse(data.message))
    }
    return (
        <div>
            <form onSubmit={handleSubmit}>
            <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            ></textarea>
            <button type='submit'>Submit</button>
            </form>
            <div>{response}</div>
        </div>
    )
}

export default Chat;