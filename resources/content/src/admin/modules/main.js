// run any operations here
// this file is loaded before the router is ready so you can subscribe to events or run initial operations here. 
// Please DO NOT write any instant executable code outside the ready method. 
let events = DI.resolve('events');

// once the application is ready, execute the given callback to 
// the event before the router scanner starts.
events.on('app.ready', () => {
    // write your code here.
});
