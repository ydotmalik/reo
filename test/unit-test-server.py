#from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
#import SocketServer
#import os
from SimpleHTTPServer import SimpleHTTPRequestHandler
import BaseHTTPServer
import urlparse
import sys
import json
import ast
import time

class SimpleReoTestServer(SimpleHTTPRequestHandler):

  def do_GET(self):
    if self.path.startswith('/reo-get-form'):
      fields = urlparse.parse_qs(urlparse.urlparse(self.path).query)
      response = '<p>' + fields['field1'][0] + '</p><p>' + fields['field2'][0] + '</p>'

      encoding = sys.getfilesystemencoding()

      self.send_response(201)
      self.send_header("Content-type", "text/html; charset=%s" % encoding)
      self.send_header("Content-Length", str(len(response)))
      self.end_headers()

      self.wfile.write(response)
    else:
      if self.path == '/reo.js' or self.path == '/reo.min.js':
        f = open('../src' + self.path)
        self.send_response(200)
        self.send_header('Content-type', 'application/javascript')
        self.end_headers()
        self.wfile.write(f.read())
        f.close()
        
        return

      return SimpleHTTPRequestHandler.do_GET(self)

  def do_POST(self):
    form_data = self.rfile.read(int(self.headers.getheader('Content-Length')))
    fields = urlparse.parse_qs(form_data)

    response = ''

    if self.path == '/reo-error-form':
      time.sleep(.5)
      self.send_response(500)
      self.end_headers()
      self.wfile.write('<p>Reo server error</p>')

      return

    if self.path == '/reo-form':
      response = '<p>' + fields['field1'][0] + '</p><p>' + fields['field2'][0] + '</p>'
    elif self.path == '/reo-form-custom-content':
      data = ast.literal_eval(form_data)
      response = '<p>' + data['key1'] + '</p>'
    elif self.path == '/reo-slow-form':
      time.sleep(.5)
      response = '<p>' + fields['field1'][0] + '</p><p>' + fields['field2'][0] + '</p>'

    encoding = sys.getfilesystemencoding()

    self.send_response(201)
    self.send_header("Content-type", "text/html; charset=%s" % encoding)
    self.send_header("Content-Length", str(len(response)))
    self.end_headers()

    self.wfile.write(response)

def test(HandlerClass = SimpleReoTestServer,
         ServerClass = BaseHTTPServer.HTTPServer):
  BaseHTTPServer.test(HandlerClass, ServerClass)


if __name__ == '__main__':
  test()
