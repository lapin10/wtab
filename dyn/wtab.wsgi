from flask import Flask, request, abort
from configuration import *
import sys
#import views
import os
import json

jsonDecode = json.JSONDecoder().decode
jsonEncode = json.JSONEncoder().encode

app = Flask(__name__)
app.config['PROPAGATE_EXCEPTIONS'] = True

@app.route('/songs', methods=['GET'])
def getSongs():
	songs = os.listdir(APP_CONF)
	return jsonEncode(dict(data = songs))

@app.route('/songs/<song>', methods=['GET'])
def getSong(song):
	path = os.path.join(APP_CONF, song)
	if os.path.exists(path):
		content = file(path, 'rt').read()
		return jsonEncode(dict(data = jsonDecode(content)))
	abort(404)

@app.route('/songs/<song>', methods=['POST'])
def setSong(song):
	data = request.form.get('data', '')
	path = os.path.join(APP_CONF, song)
	with file(path, 'wt') as f:
		f.write(data)
	return '{}'

application = app

if __name__ == '__main__' :
	if len(sys.argv) == 1:
		app.debug = True
		app.run()
