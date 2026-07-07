import urllib.request
import urllib.error

req = urllib.request.Request('https://sparo.my.id/tournaments/12/upload-poster', method='POST')
try:
    urllib.request.urlopen(req)
except urllib.error.HTTPError as e:
    print(e.code, e.read().decode('utf-8'))
