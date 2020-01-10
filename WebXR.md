To test WebXR in your local network, you need https:

```console
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /home/yannick/enable3d/server.key -out /home/yannick/enable3d/server.crt
sudo openssl dhparam -out /home/yannick/enable3d/ca.pem 2048
```

```js
// webpack.dev.js
devServer: {
  host: '0.0.0.0',
  https: {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt'),
    ca: fs.readFileSync('ca.pem')
  }
},
```
