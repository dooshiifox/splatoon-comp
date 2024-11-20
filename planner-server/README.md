### Background to the implementation

Initially this was going to be built as an executable that users would download and run to host their own instance. This will not work because a) the user would need to set up port forwarding to allow others to access it, and b) web browsers will only connect to wss:// and the user's will not have their own SSL certificates. Proxying requests could fix the second problem, but that still doesn't fix the first. This should be useable by anyone, not just people who know what a port is. Hence, users cannot self-host. (Well they still can but it shouldn't be expected of them). As such, we need this program to have a centralised server that all users connect to.

The simplest solution to this is to have someone create a room, designate them host, and have them essentially run the server. Then the server just acts as a proxy to anyone in the host's room. While this would work, I don't believe it would be the best solution.

- Firstly, it essentially doubles the latency of all actions performed. `User performs an action -> goes through our proxy -> host processes the action and responds to everyone -> back through our proxy -> everyone receives the message`. Compare this to `User performs an action -> server processes it and responds to everyone -> everyone recieves the message`.
- Secondly, it is prone to failure. Suppose the host experiences connection issues. Then, everyone gets kicked out of the room. Or worse, imagine if the host closed their tab and then wiped localstorage. RIP everything everyone did, I guess! If instead the server hosts and processes all content, if the room admin experiences connection issues then a new admin is designated and everyone can still work. Yay!

Of course, the solution of 'have us process everything' leads to performance concerns, storage concerns, and privacy concerns.

- Performance hopefully won't be a problem because Rust + Tokio is super duper epic, plus we can just scale horizontally if things get too bad.
- Storage concerns is very real, but solutoins exist. We could say we'll store your room for 7 days since the last person joined, in case you had a connection error or something and couldn't save. Maybe extend it indefinitely if you give us some $$$. We could also give them the choice to download all the data and reupload it next time they make a room. Perhaps a 'Close Room' button for the admin that will remove all data (but with a prompt asking if you want to download it all), to free up the room name as well as some space for us. Finally, some good compression should save us a lot of space.
- Privacy concerns.... uhhh deal with it. There's not much more that can be said or done, unless you choose to self-host. Really anyone who cares about privacy on a canvas editor is doing some odd things with it, and is probably the type to _know_ how to self-host.

So now we've established how it should work. Centralised server, users create and join rooms.
