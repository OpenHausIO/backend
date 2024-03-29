# Backend
The backend represents the Web HTTP API for the OpenHaus ecosystem.<br />
Here are all devices/endpoints stored, messages/commands distributed and states managed.


## Requirments
- node.js¹ (https://nodejs.org)
- MongoDB² (https://www.mongodb.com)


## Documentation
The documentation is (mostly) autogenerated from the source code.<br />
It can be found on https://docs.open-haus.io<br />

If something missing or unclear, open a issue.<br />
The [docs](docs) folder is soon be removed.

For the HTTP API we provide a [postman collection](postman.json).


## Demo
There exsits a public demo: http://demo.open-haus.io<br />
It is deployed with docker and runs the frontend & backend container.<br />
The instance is rested to its default values every 10 Minutes.<br />
No authentication required, full API support.


## HTTP API
We provide a [postmann collection](./postman.json) that you can import.<br />
It containes documentation about every URL endpoint and its meaning.<br />
Get postman on https://www.postman.com/ its great tool for HTTP testing & documentation.

## Contribution
If you have questions, want to contribute or just wanna have a talk, open a new issue.

Fork this repository, apply the changes you want to make, and create a pull request.

__*Note*__: If you want to contribute, please take a look on the "documentation" repository, section "[How to document the source code](https://github.com/OpenHausIO/documentation#how-to-document-the-source-code)".


## License
Im currently not sure, under what license i publish this work.<br />
But what i know is that, it should/must be open source and for any private/natural person free to use.

So bascily i would say:

__Natural persons/private use__:<br />
Feel free to use/modify my work and do the the fck what ever you want. (As long no commercial background is involved!)<br />
If you create something with OpenHaus (apart from normal use) give me a hint and message me.<br />
Would be awesome to hear for what you use it.

__Commercial/Distribution__:<br />
Contact me and have a talk. <br /> 
You are not permitted to sell or distribute my work without my consent!

*Not sure? Contact me. I would realy get in touch with you and im very flexible in terms of licensing.*

----
¹) Install a LTS Version (At least v16)<br />
²) *Should* be configured as replica set (even with only one node)