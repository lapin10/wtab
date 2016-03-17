#settings.py
import os
# __file__ refers to the file settings.py 
APP_ROOT = os.path.dirname(os.path.abspath(__file__))
APP_PARENT = os.path.dirname(os.path.abspath(APP_ROOT))
APP_CONF = os.path.join(APP_PARENT, 'conf')