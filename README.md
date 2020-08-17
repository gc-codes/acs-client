# ACS React Demo
Client side of the ACS Demo

## Run 
Run the app using the command: ``` npm start ```

## Server connection info
The app can be connected to the local node server running at port 3001 by running the ACS Node project.
In ``` package.json ``` set ``` "proxy": "http://localhost:3001" ``` to connect to local Node.js server.

The app can also be connected to the hosted server at ``` http://acs-demo-node-service.azurewebsites.net/ ```.
In ``` package.json ``` set ``` "proxy": "http://acs-demo-node-service.azurewebsites.net/" ``` to connect to the hosted service.

## Using the app
To make a audio/video call run the app in two different browser windows and enter the generated user identity and place a call.