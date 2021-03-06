var currentRoom;
var client;
var room_list;

function mqttLoad() {
    client = new Paho.MQTT.Client(window.location.hostname, 9001, '/ws', 'frontend');

    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;

    client.connect({onSuccess: onConnect}, {reconnect: true}, {keepAliveInterval: 100000});
    return client;
}

function onConnect() {
    console.log("MQTT Client connected");
    requestRoom();
}

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

function onMessageArrived(message) {
    switch (message._getDestinationName()) {
        case "/temperature/" + room_list[currentRoom]: {
            var thermostatClientResource = JSON.parse(message.payloadString);
            console.log(message.payloadString);
             if (thermostatClientResource.desiredTemperature !== -1)
                nest.target_temperature = thermostatClientResource.desiredTemperature;
            nest.ambient_temperature = thermostatClientResource.currentApparentTemperature;
            break;
        }
    }
}

/**
 *  Initial request for the list of available room
 */
function requestRoom() {
    get_backend("MainRoom");
    var xhttp_room = new XMLHttpRequest();
    xhttp_room.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            room_list = JSON.parse(xhttp_room.responseText);
            client.subscribe("/temperature/MainRoom");
            currentRoom = room_list.indexOf("MainRoom");


        }
    };
    xhttp_room.open("GET", window.location.origin + "/setting/room/list", true);
    xhttp_room.send();
}



/**
 * Function that handle the right/left click
 * @param ev
 */
function changeRoom() {
    if (currentRoom !== undefined) {
        var desired_room = rotateRoom(currentRoom, this.id);

        initialState();
        setMqttRoom(desired_room);
        get_backend(room_list[desired_room]);

    }
}



function get_backend(desired_room) {
    var xhttp_backend = new XMLHttpRequest();
    xhttp_backend.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {

            var obj = JSON.parse(xhttp_backend.responseText);
            console.log("Entry backend " + xhttp_backend.responseText);

            if (obj.isManual) {
                retrieve_values("Manual", "heating");
            }
            if (obj.isWinter) {
                retrieve_values("Winter","heating");
            }
            if (obj.isSummer) {
                retrieve_values("Summer","cooling");
            }
            if (obj.isAntiFreeze) {
                retrieve_values("Winter","heating");
                retrieve_values("AntiFreeze","heating");
            }
            if (obj.isLeave)
            {
                nest.away = true;
                document.getElementById("main-container").style.pointerEvents = "none";
                document.getElementById("container-buttons").style.pointerEvents = "auto";
                document.getElementById("left_button").style.pointerEvents = "auto";
                document.getElementById("right_button").style.pointerEvents = "auto";
            }
        }
    };
    xhttp_backend.open("GET", window.location.origin + "/temperature/current_room_state_resource/" + desired_room, true); /*filename='localhost:8080/setting/esp/free';*/
    xhttp_backend.send();
}

function initialState() {
    document.getElementById("Summer").value = 0;
    document.getElementById("Summer").className = "btn btn-secondary";
    document.getElementById("Winter").value = 0;
    document.getElementById("Winter").className = "btn btn-secondary";
    document.getElementById("Manual").value = 0;
    document.getElementById("Manual").className = "btn btn-secondary m-1";
    document.getElementById("AntiFreeze").value = 0;
    document.getElementById("AntiFreeze").className = "btn btn-secondary m-1";
    nest.hvac_state = 'off';

}
function retrieve_values(stanza, state){
    if(stanza === "Winter" || stanza === "Summer"){
        document.getElementById(stanza).className = "btn btn-primary";
    }else{
        document.getElementById(stanza).className = "btn btn-primary m-1";
    }
    document.getElementById(stanza).value = 1;
    nest.hvac_state = state; 
}

