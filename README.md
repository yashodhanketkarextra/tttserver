Tictactoe server
================

This is source code for a tictactoe game, this serves as a backend for the tictactoe client. This project is build using nodejs and mongodb.

Tech Stack
----------

-	NestJs (Core)
-	MongoDB (Database)
-	Socket.io (WebSockets)
-	JWT and bcyrpt (Auth)
-	nestjs/Mongoose (ORM)

Installation
------------

1.	Clone the repository
2.	Create a `.env` file in the root directory of the project and add the following variables:

	```
	DB_URI=mongodb://localhost:27017/tictactoe
	PORT=3000
	HOST=localhost
	TOKEN=secret
	```

3.	Run `pnpm install` to install dependencies

4.	Run `pnpm start:dev` to start the server

License
-------

This project is licensed under the terms of the [GNU GPL 3.0](./LICENSE). Please refer to the [LICENSE](./LICENSE) file for more information.
