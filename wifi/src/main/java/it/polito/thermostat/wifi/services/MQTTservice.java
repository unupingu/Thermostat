package it.polito.thermostat.wifi.services;

import it.polito.thermostat.wifi.object.ESP8266;
import org.eclipse.paho.client.mqttv3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MQTTservice {
    private Logger logger = LoggerFactory.getLogger(this.getClass());
    private String esp8266Topic = "/esp8266/#";
    private InetAddress id = InetAddress.getLocalHost();
    private String hostname = "192.168.1.143";
    String localBroker = "tcp://" + hostname + ":1883";
    String internetBroker = "tcp://test.mosquitto.org:1883";
    private IMqttClient mqttClient;

    @Autowired
    private ConcurrentHashMap<String, ESP8266> esp8266Map;

    public MQTTservice() throws UnknownHostException, MqttException {
        MqttConnectOptions options = new MqttConnectOptions();
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);
        options.setConnectionTimeout(1000);
        mqttClient = new MqttClient(localBroker, id.toString());
        mqttClient.connect(options);
    }




    /**
     * ci permette di gestire gli actuator
     *
     * @param esp8266
     * @throws Exception
     */
    public void manageActuator(ESP8266 esp8266, String command) {

        if (esp8266.getIsSensor()) {
            logger.error("manageActuator error, this esp8266 is not related to an actuator");
            return;
        }
        if (!mqttClient.isConnected()) {
            logger.error("MQTT Client not connected.");
            return;
        }

        MqttMessage msg = new MqttMessage(command.getBytes());
        msg.setQos(2);
        //msg.setRetained(true);
        try {
            mqttClient.publish("/" + esp8266.getId(), msg);
        } catch (MqttException e) {
            logger.error("MqttService/manageActuator - publish -> " + e.toString());
        }
    }
}
