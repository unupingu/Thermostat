var currentRoom;
var client;
var room_list;


function mqttLoad() {
    let sensorTopic = "/id-esp/sensor";
// Create a client instance
    client = new Paho.MQTT.Client('localhost', 9001, '/ws', 'frontend');

// set callback handlers
    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

// connect the client
    client.connect({onSuccess: onConnect}, {reconnect: true}, {keepAliveInterval: 100000});

    return client;
}


// called when the client connects
function onConnect() {
    // Once a connection has been made, make a subscription and send a message.
    console.log("Client connected");
    requestRoom();

    // client.subscribe(sensorTopic);
    // let message = new Paho.MQTT.Message("prova");
    // message._setDestinationName(sensorTopic);
    // client.send(message);
}

// called when the client loses its connection
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log("onConnectionLost:" + responseObject.errorMessage);
    }
}


function setMqttRoom(idRoom) {
    client.unsubscribe("/temperature/" + room_list[currentRoom]);
    client.subscribe("/temperature/" + room_list[idRoom]);
    currentRoom = idRoom;
    document.getElementById("room_name").innerText = room_list[currentRoom];

}

// called when a message arrives
function onMessageArrived(message) {
    // console.log("onMessageArrived:\n\tTopic -> " + message._getDestinationName() + "\n\tMessage -> " + message.payloadString);

    switch (message._getDestinationName()) {
        case "/temperature/" + currentRoom: {
            var thermostatClientResource = JSON.parse(message.payloadString);
            if (thermostatClientResource.desiredTemperature !== -1)
                nest.target_temperature = thermostatClientResource.desiredTemperature;
            nest.ambient_temperature = thermostatClientResource.currentApparentTemperature;
            break;
        }


    }
}

function requestRoom() {


    var xhttp_room = new XMLHttpRequest();
    xhttp_room.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            room_list = JSON.parse(xhttp_room.responseText);
            setMqttRoom(room_list.indexOf("Main Room"));
        }
    };
    xhttp_room.open("GET", "http://localhost:8080/setting/room", true);
    xhttp_room.send();


}

function changeRoom(ev) {
    if (currentRoom !== undefined) {
        switch (ev.target.id) {
            case "right_arrow" : {
                console.log("right arrow");
                currentRoom = (currentRoom + 1) % room_list.length;
            }
                break;
            case "left_arrow" : {
                console.log("left arrow");
                currentRoom = Math.abs(((currentRoom - 1) % room_list.length));
            }
                break;
        }
        setMqttRoom(currentRoom);
    }
}
