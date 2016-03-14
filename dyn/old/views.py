source = ''
results = []

def setSource(newSource):
	global source
	source = newSource


def getSource():
	global source
	return source


def getResult(step):
	if step > len(results)-1:
		computeSteps()
	return 'OK'