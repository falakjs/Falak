/**
 * This is the service worker file that you may use with your application.
 * To register the file path into the service worker registration use "assets('js/service-worker.js')" to get the proper path. 
 * 
 * You can start your normal code here
 */

 // Query parameters you may pass to the service worker
 // for example when you register the service worker you may register it as 
 // ServiceWorkerContainer.register(assets('js/service-worker.js') + '?app=my-app-name')
 // Here in this file you can get the value of the `app` key from the queryParams object as follows:
 // console.log(queryParams.app); // my-app-name
 const queryParams = {};

 // install event
self.addEventListener('install', function (event) {
    // Collecting query parametrs
    location.search.replace('?', '').split('&').map(param => {
        const [key, value] = param.split('=');
        queryParams[key] = value;
    });
});

// on notification click
self.addEventListener('notificationclick', event => {
    // close the notification
    event.notification.close();
    // rest of code here
});


// on remote push notification 
self.addEventListener('push', function (event) {
    let notificationData = {};

    try {
        notificationData = event.data.json();
    } catch (e) {
        notificationData = {
            title: 'default title',
            icon: 'icon-path',
            body: 'body description',
        }
        console.log(e);
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            icon: notificationData.icon,
            body: notificationData.body,
        })
    );
});