var socket = io();

// Initialize Editor
var editor = CodeMirror.fromTextArea(document.getElementById("code-editor"), {
    mode: "python",
    theme: "dracula",
    lineNumbers: true,
    autoCloseBrackets: true,
    matchBrackets: true
});

const terminalLog = document.getElementById("output-log");
const terminalInput = document.getElementById("terminal-input");
const statusDot = document.getElementById("status-dot");

// --- Socket Connection Status ---
socket.on('connect', () => {
    statusDot.classList.add('connected'); // Turn Green
    statusDot.title = "Connected to Server";
});

socket.on('disconnect', () => {
    statusDot.classList.remove('connected'); // Turn Gray
    statusDot.title = "Disconnected";
});

// --- Run Code ---
function startCode() {
    terminalLog.innerHTML = "<div class='sys-msg'>--- Execution Started ---</div>";
    const code = editor.getValue();
    socket.emit('run_code', { code: code });
    terminalInput.focus();
}

// --- Receive Output ---
socket.on('output', function(msg) {
    // Check if the last element is a span we can add to
    let lastSpan = terminalLog.lastElementChild;
    
    // If we just started or the last item was a full block (div), create a new span
    if (!lastSpan || lastSpan.tagName === 'DIV') {
        lastSpan = document.createElement("span");
        terminalLog.appendChild(lastSpan);
    }

    if (msg.type === 'error') {
        lastSpan.style.color = "#ff5555";
    } else {
        lastSpan.style.color = "#f8f8f2";
    }

    // Add the text to the existing line
    lastSpan.innerText += msg.data;
    
    scrollToBottom();
});

// --- Handle User Input ---
terminalInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        const text = terminalInput.value;
        
        // Show user's input in the log instantly
        const userDiv = document.createElement("div");
        userDiv.innerText = text;
        userDiv.style.color = "#50fa7b"; // Green
        terminalLog.appendChild(userDiv);
        
        // Send to Python
        socket.emit('user_input', { input: text });
        
        terminalInput.value = ""; // Clear box
        scrollToBottom();
    }
});

// --- Utility Functions ---
function focusInput() {
    terminalInput.focus();
}

function scrollToBottom() {
    const terminal = document.getElementById("terminal");
    terminal.scrollTop = terminal.scrollHeight;
}

function clearTerminal() {
    terminalLog.innerHTML = "<div class='sys-msg'>Terminal Cleared.</div>";
}