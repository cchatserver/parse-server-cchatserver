
Parse.Cloud.define('hello', function(req, res) {
  res.success('Hi');
});


// *** saveContacts ***
//{"contacts":{"385958546851":"Sergito","385992073346":"Dijana bebe"}, "userNumber":385919190063}
Parse.Cloud.define('saveContacts', function(request, response) {

    // Have an Object of contacts to save with the phone number as a key and the Name on the phone book as a value
    // Example: {"385958546851":"Sergito","385992073346":"Dijana bebe"}

    var contactsToSave = request.params.contacts;


    // The user number is also passed in the request
    // example: "userNumber":385919190063

    var userNumber = request.params.userNumber;

    var Contacts = Parse.Object.extend('Contacts');
    var contactsQuery = new Parse.Query(Contacts);

    // Check if the userNumber sent is already on the table, if YES save the contacts, else create the item in contacts
    contactsQuery.equalTo("userNumbers", userNumber);
    contactsQuery.find({
        // Successfully retrieved the userNumber
        success: function(objects) {
            if(objects.length){
                // Save the contacts
                var contactsObject = objects[0];

                contactsObject.set('contacts', contactsToSave, {
                    error: function(contactsObj, error) {
                        response.error("Error saving the contact: " + contactsObj);
                    }
                });
                response.success({success: true});
            }else{
                // create the item in contacts
                var newContactsObject = new Contacts();
                newContactsObject.set('userNumbers', [userNumber]);
                newContactsObject.set('contacts', contactsToSave);
                newContactsObject.save(null, {
                    success: function(newContactsObject) {
                        // The object was saved successfully.
                        response.success({newContactsObject:newContactsObject});
                    },
                    error: function(newContactsObj, error) {
                        // The save failed.
                        // error is a Parse.Error with an error code and message.
                        response.error("Error saving the new contact: " + newContactsObj);
                    }
                });
            }
        },
        error: function (error) {
            response.error("Error finding the contact with the userNumber: " + userNumber);
        }
    });

});


//   ========================
//      sendPushNotification : This sends a notification using the sender's name the receiver has in his phone
//   ========================

//{"notification":{"alert": "Hola!","badge": "Increment", "from":385919190063, "to":385958546850}}
//{"notification":{"alert": "Hola!","badge": "Increment", "from":385958546850, "to":385919190063}}

Parse.Cloud.define("sendPushNotification", function(request, response) {
    var Contacts = Parse.Object.extend("Contacts");
    var query = new Parse.Query(Contacts);

    // Send push notification to query
    //var pushQuery = request.params.pushQuery;
    var notification = request.params.notification;
    var alertWithSender;

    // In case we don't find the name of the sender in the contacts, then display the number.
    var from = notification['from'];
    var to = notification['to'];
    var senderContactName = from.toString();

    // Find receiver of the message, to browse his contacts

    query.equalTo("userNumbers", to);
    query.find({
        success: function(object) {
            // Successfully retrieved the receiver.
            // Now browse his contacts for the number.
            if(object[0] != undefined && object[0].get("contacts")[from.toString()]){
                senderContactName = object[0].get("contacts")[from.toString()];
                alert("Receiver and contact found, name is: " + senderContactName );

            }else{
                alert("Receiver found, but the number is not in the contacts: " + senderContactName );
            }

            // Change the message to include the sender's name
            alertWithSender = senderContactName + ": " + notification.alert;
            notification.alert = alertWithSender;

            alert("Alert: " + alertWithSender);

            sendPushNotification(notification);

        },
        error: function(error) {
            alert("Error: " + error.code + " " + error.message);

            // Change the message to include the sender's name
            alertWithSender = senderContactName + ": " + notification.alert;
            notification.alert = alertWithSender;

            alert("Sending PushNotification with [alert] property: " + alertWithSender);

            sendPushNotification(notification);
            response.error("Receiver NOT found. Receiver number: " + to);
        }
    });

    var sendPushNotification = function ( notification) {

        var query = new Parse.Query(Parse.Installation);
        query.equalTo('registeredPhoneNumbers', notification.to);

        Parse.Push.send({
                where: query,
                data: notification
            },
            {
                success: function() {
                    // Push was successful
                    response.success({notificationSent:notification});
                },
                error: function(error) {
                    // Handle error
                    //response.error("Push notification could not be sent");
                }
            }
        );
    };
});


//   ========================
//      getSenderContactName : This retrieves the sender's name saved in the contacts of the receiver
//   ========================

Parse.Cloud.define("getSenderContactName", function(request, response) {
    var Contacts = Parse.Object.extend("Contacts");
    var query = new Parse.Query(Contacts);

    // In case we don't find the name of the sender in the contacts, then display the number.
    var senderContactName = request.params.from.toString();

    // Find receiver of the message, to browse his contacts
    query.equalTo("userNumbers", request.params.to);
    query.find({
        success: function(object) {
            // Successfully retrieved the object.
            // Now browse his contacts for the number.
            if(object[0].get("contacts")[request.params.from.toString()]){
                senderContactName = object[0].get("contacts")[request.params.from.toString()];
                alert("Receiver and contact found, name is: " + senderContactName );
                response.success({senderContactName:senderContactName});
            }else{
                alert("Receiver found, but the number is not in the contacts: " + senderContactName );
                response.error("Receiver found, but the number is not in the contacts: " + senderContactName );
            }
            //name = object[0].get("contacts")[request.params.from.toString()];
        },
        error: function(error) {
            alert("Error: " + error.code + " " + error.message);
            response.error("Receiver NOT found. Receiver number: " + request.params.to);
        }
    });
});
