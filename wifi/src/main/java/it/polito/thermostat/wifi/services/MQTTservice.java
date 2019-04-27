package it.polito.thermostat.wifi.services;

import it.polito.thermostat.wifi.Object.ESP8266;
import org.eclipse.paho.client.mqttv3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class MQTTservice  {
    private Logger logger = LoggerFactory.getLogger(this.getClass());
    private String esp8266Topic = "/esp8266/#";
    private InetAddress id = InetAddress.getLocalHost();
    private String hostname = "192.168.43.100";
    private IMqttClient mqttClient;

    @Autowired
    private ConcurrentHashMap<String, ESP8266> esp8266Map;

    public MQTTservice() throws UnknownHostException, MqttException {
        MqttConnectOptions options = new MqttConnectOptions();
        options.setAutomaticReconnect(true);
        options.setCleanSession(true);
        options.setConnectionTimeout(1000);
        mqttClient = new MqttClient("tcp://" + hostname + ":1883", id.toString());
        mqttClient.connect(options);
        mqttClient.subscribe(esp8266Topic, this::esp8266Connection);
    }


    public void publishESP8266Debug() throws Exception {

        if (!mqttClient.isConnected()) {
            logger.error("MQTT Client not connected.");
            return;
        }

        MqttMessage msg = new MqttMessage("true".getBytes());
        msg.setQos(2);
        //msg.setRetained(true);
        mqttClient.publish("/esp8266/id1", msg);
    }


    /**
     *  This callback is invoked when a message is received on a subscribed topic.
     */
    private void esp8266Connection(String topic, MqttMessage message) {
        ESP8266 esp8266 = new ESP8266();
        esp8266.setId(topic.split("/")[2]);
        esp8266.setIsActuator(Boolean.valueOf(message.toString()));
        esp8266Map.put(esp8266.getId(),esp8266);

        logger.info("New esp8266 connected");
        logger.info("\tesp8266 id ->" + esp8266.getId());
        logger.info("\tisActuator ->" + esp8266.getIsActuator());

    }

}
