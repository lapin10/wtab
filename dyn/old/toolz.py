def tojson(arg):
	# TOOD : check none!
	if isinstance(arg, dict):
		text=['{']
		items=[]
		for (k,v) in arg.items():
			items.append('"%s" : %s' % (str(k), tojson(v)))
		text.append(','.join(items))
		text.append('}')
		return ''.join(text)
	elif isinstance(arg, list):
		items=[]
		for v in arg:
			items.append(tojson(v))
		return '[%s]' % (','.join(items))
	elif isinstance(arg, bool):
		if arg:
			return 'true'
		return 'false'
	elif isinstance(arg, int):
		return str(arg)
	elif isinstance(arg, float):
		return str(arg)
	else:
		return '"%s"' % str(arg)

def removePrefix(text,prefix):
	if text.startswith(prefix):
		return text[len(prefix):]
	return text

def nocr(text):
	if text.endswith('\n'):
		return text[0:-1]
	return text

def readPropFile(filename):
	# TOOD try ...
	ret={}
	with open(filename) as f:
		for line in f:
			line=nocr(line).strip()
			if line == '' or line.startswith('#'): continue
			if not '=' in line: continue # or msg ?
			(key,value)=line.split('=',1)
			ret[key]=value
	return ret
