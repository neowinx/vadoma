FROM	    node:8.9.4-alpine
LABEL       Author="Pedro Flores <pflores@codelab.com.py>"
USER        node
WORKDIR     /home/node/app
ADD         .   /home/node/app
RUN	        npm install
CMD         [ "npm", "start" ]