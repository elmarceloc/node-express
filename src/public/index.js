'use strict';



const heygen_API = {
  apiKey: 'ODQ4OGMxOGM4MDg2NDk5YTk2NTg1NDY1ZTJiZGM4ZmEtMTczODgxMjIxMg==',
  serverUrl: 'https://api.heygen.com',
};

// Configuración automática
const AVATAR_ID = "SilasHR_public";
const VOICE_ID = "79f84ce83ec34e75b600deec4c5c9de6";

// Elementos del DOM
const statusElement = document.querySelector('#status');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const mediaElement = document.querySelector('#mediaElement');
const canvasElement = document.querySelector('#canvasElement');

let sessionInfo = null;
let peerConnection = null;
let mediaCanPlay = false;
let renderID = 0;

let tempMessage = null;

// Al inicio del archivo, después de las constantes
const startButton = document.getElementById('startButton');
const startOverlay = document.getElementById('startOverlay');

// Reemplazar el window.addEventListener('load') existente con:
let initialized = false;

startButton.addEventListener('click', async () => {
  if (!initialized) {
    try {
      await createNewSession();
      await startAndDisplaySession();
      addMessage("Hola! ¿En qué puedo ayudarte hoy?", false);
      initialized = true;
      
      // Ocultar el overlay
      startOverlay.classList.add('hidden');
      
      // Intentar reproducir el video después de la interacción del usuario
      mediaElement.play().catch(error => {
        console.error('Error reproduciendo el video:', error);
      });
      
    } catch (error) {
      console.error('Error inicial:', error);
      updateStatus(statusElement, 'Error al iniciar la sesión');
    }
  }
});

// Crear el convertidor de markdown una sola vez
const converter = new showdown.Converter({
  tables: true,
  simplifiedAutoLink: true,
  strikethrough: true,
  tasklists: true,
  emoji: true
});

// Función para añadir mensajes al chat
function addMessage(message, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
  
  // Si es un mensaje del usuario o es "...", mostrar como texto plano
  if (isUser || message === "...") {
    messageDiv.textContent = message;
  } else {
    // Para mensajes del bot, convertir markdown a HTML
    messageDiv.innerHTML = converter.makeHtml(message);
  }
  
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return messageDiv;
}

// Manejar envío de mensajes
async function handleSendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage(message, true);
  chatInput.value = '';

  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  const loadingMessage = addMessage("...", false);
  
  try {
    const aiResponse = await talkToOpenAI(message);
    loadingMessage.remove();
    addMessage(aiResponse);
    
    if (sessionInfo) {
      await repeat(sessionInfo.session_id, aiResponse);
    }
  } catch (error) {
    console.error('Error:', error);
    loadingMessage.remove();
    addMessage("Lo siento, hubo un error procesando tu solicitud.");
  }
}

// Event listeners para el chat
sendBtn.addEventListener('click', handleSendMessage);
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSendMessage();
});

// Funciones principales de WebRTC
async function createNewSession() {
  updateStatus(statusElement, 'Creando sesión...');

  try {
    sessionInfo = await newSession('low', AVATAR_ID, VOICE_ID);
    const { sdp: serverSdp, ice_servers2: iceServers } = sessionInfo;

    peerConnection = new RTCPeerConnection({ iceServers: iceServers });

    peerConnection.ontrack = (event) => {
      if (event.track.kind === 'audio' || event.track.kind === 'video') {
        mediaElement.srcObject = event.streams[0];
      }
    };

    const remoteDescription = new RTCSessionDescription(serverSdp);
    await peerConnection.setRemoteDescription(remoteDescription);

    updateStatus(statusElement, 'Sesión creada correctamente');
  } catch (error) {
    console.error('Error al crear sesión:', error);
    updateStatus(statusElement, 'Error al crear la sesión');
    throw error;
  }
}

async function startAndDisplaySession() {
  if (!sessionInfo) {
    throw new Error('No hay información de sesión');
  }

  updateStatus(statusElement, 'Iniciando transmisión...');

  try {
    const localDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(localDescription);

    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        handleICE(sessionInfo.session_id, candidate.toJSON());
      }
    };

    await startSession(sessionInfo.session_id, localDescription);
    updateStatus(statusElement, 'Transmisión iniciada');

    // Configurar evento para cuando el video esté listo
    mediaElement.onloadedmetadata = () => {
      mediaCanPlay = true;
    };

  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    updateStatus(statusElement, 'Error al iniciar la transmisión');
    throw error;
  }
}

// Funciones de API
async function newSession(quality, avatar_name, voice_id) {
  try {
    const response = await fetch(`${heygen_API.serverUrl}/v1/streaming.new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': heygen_API.apiKey,
      },
      body: JSON.stringify({
        quality,
        avatar_name,
        voice: { voice_id },
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Manejar específicamente el error de límite concurrente
      if (errorData.code === 10007) {
        throw new Error('El asistente virtual está ocupado atendiendo a otro usuario. Por favor, intenta nuevamente en unos minutos.');
      }
      
      throw new Error('Error en newSession');
    }
    
    return (await response.json()).data;
  } catch (error) {
    // Mostrar el mensaje de error en la interfaz
    updateStatus(statusElement, error.message);
    if (startOverlay) {
      startOverlay.classList.remove('hidden'); // Mostrar nuevamente el overlay
      startButton.textContent = 'Reintentar';  // Cambiar el texto del botón
    }
    throw error;
  }
}

async function startSession(session_id, sdp) {
  const response = await fetch(`${heygen_API.serverUrl}/v1/streaming.start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': heygen_API.apiKey,
    },
    body: JSON.stringify({ session_id, sdp }),
  });
  
  if (!response.ok) throw new Error('Error en startSession');
  return (await response.json()).data;
}

async function handleICE(session_id, candidate) {
  const response = await fetch(`${heygen_API.serverUrl}/v1/streaming.ice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': heygen_API.apiKey,
    },
    body: JSON.stringify({ session_id, candidate }),
  });
  
  if (!response.ok) throw new Error('Error en handleICE');
  return (await response.json()).data;
}

async function talkToOpenAI(prompt) {
  try {
    const response = await fetch(`/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) throw new Error('Error en OpenAI');
    const data = await response.json();
    return data.text;
    
  } catch (error) {
    console.error('Error con OpenAI:', error);
    throw error;
  }
}

async function repeat(session_id, text) {
  const response = await fetch(`${heygen_API.serverUrl}/v1/streaming.task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': heygen_API.apiKey,
    },
    body: JSON.stringify({ session_id, text }),
  });
  
  if (!response.ok) throw new Error('Error en repeat');
  return (await response.json()).data;
}

// Funciones auxiliares
function updateStatus(statusElement, message) {
  statusElement.innerHTML = message;
  console.log(message);
}


const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = false;

const voiceToggleBtn = document.getElementById('voiceToggleBtn');
const micIcon = voiceToggleBtn.querySelector('i');
let isRecording = false;

function toggleMic() {
    if (isRecording) {
        micIcon.classList.remove('fa-microphone');
        micIcon.classList.add('fa-microphone-slash');
        voiceToggleBtn.classList.add('active');
        voiceToggleBtn.style.backgroundColor = '#ff4444'; // Rojo cuando está grabando
    } else {
        micIcon.classList.remove('fa-microphone-slash');
        micIcon.classList.add('fa-microphone');
        voiceToggleBtn.classList.remove('active');
        voiceToggleBtn.style.backgroundColor = ''; // Volver al color original
    }
}

recognition.onstart = () => {
  // Crear un mensaje temporal cuando comienza el reconocimiento
 // tempMessage = addMessage("🎤 Escuchando...", true);
  // Añadir clase especial para el mensaje de escucha
 //tempMessage.classList.add('listening-message');
};

recognition.onresult = (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript.trim();
  if (transcript) {
    // Se procesa el texto y se asigna al input del chat
    const parsedText = parseMessage(transcript);
    chatInput.value = parsedText;
    handleSendMessage();
    // Se detiene el reconocimiento para procesar este mensaje
    recognition.stop();
  }
};

function parseMessage(message){
  // Reemplazar todas las ocurrencias de "rimar" por "RE/MAX"
  return message.replace(/rimar/gi, "RE/MAX");  
}

recognition.onend = () => {
  // Si sigue en modo grabación, reiniciamos el reconocimiento
  if (isRecording) {
    setTimeout(() => {
      recognition.start();
    }, 100);
  } else {
    toggleMic();
  }
};

voiceToggleBtn.addEventListener('click', () => {
  isRecording = !isRecording;
  if (isRecording) {
    recognition.start();
  } else {
    recognition.stop();
  }
  toggleMic();
});
