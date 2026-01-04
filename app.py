import sys
import os  # <--- Added this
import subprocess
import threading
from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

process = None

def read_output(pipe):
    """Reads data LINE-BY-LINE to fix Emojis and Buffering."""
    try:
        # Change read(1) to readline (Read whole line at once)
        for line in iter(pipe.readline, b''):
            # Decode the whole line safely
            socketio.emit('output', {'data': line.decode('utf-8', errors='replace'), 'type': 'stdout'})
    except Exception:
        pass
    finally:
        pipe.close()

@app.route('/')
def home():
    return render_template('index.html')

@socketio.on('run_code')
def run_code(data):
    global process
    code = data.get('code')

    if process and process.poll() is None:
        process.terminate()

    # FORCE UNBUFFERED MODE via Environment Variable
    my_env = os.environ.copy()
    my_env["PYTHONUNBUFFERED"] = "1"

    try:
        process = subprocess.Popen(
            # NEW LINE 42:
            [sys.executable, "-u", "-c", code],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE, 
            stderr=subprocess.STDOUT,  # Merge channels
            text=False,     
            bufsize=1,       
            env=my_env      # <--- Apply the environment fix here
        )

        threading.Thread(target=read_output, args=(process.stdout,), daemon=True).start()

    except Exception as e:
        emit('output', {'data': str(e), 'type': 'error'})

@socketio.on('user_input')
def handle_input(data):
    global process
    input_text = data.get('input') + '\n'
    if process and process.poll() is None:
        process.stdin.write(input_text.encode('utf-8'))
        process.stdin.flush()

if __name__ == '__main__':
    # host='0.0.0.0' means "Let anyone on my Wi-Fi connect"
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)