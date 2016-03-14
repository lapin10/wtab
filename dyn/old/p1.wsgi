from flask import Flask, request
import sys
from toolz import *
import views
import os
import json

jsonDecode = json.JSONDecoder().decode
jsonEncode = json.JSONEncoder().encode

app = Flask(__name__)
app.config['PROPAGATE_EXCEPTIONS'] = True

@app.route('/source', methods=['GET', 'POST'])
def setSource():
	if request.method == 'POST':
		data = jsonDecode(request.data)
		views.setSource(data['source'])
		return "source is set !"
	else:
		return jsonEncode(dict(source = views.getSource()))

@app.route('/result/<stepId>')
def getResult(stepId):
	return jsonEncode(dict(result = views.getResult(stepId)))

application = app

if __name__ == '__main__' :
	if len(sys.argv) == 1:
		app.debug = True
		app.run()
