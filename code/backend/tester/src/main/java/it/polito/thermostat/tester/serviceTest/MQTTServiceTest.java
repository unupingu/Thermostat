package it.polito.thermostat.tester.serviceTest;

import it.polito.thermostat.tester.entity.ESP8266;
import it.polito.thermostat.tester.entity.Room;
import it.polito.thermostat.tester.repository.ESP8266Repository;
import it.polito.thermostat.tester.repository.RoomRepository;
import org.apache.commons.math3.util.Precision;
import org.eclipse.paho.client.mqttv3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
public class MQTTServiceTest {
    boolean isWindows = System.getProperty("os.name").toLowerCase().startsWith("windows");
    private Logger logger = LoggerFactory.getLogger(this.getClass());

    @Value("${mqtt.online}")
    Boolean isMQTTOnline;
    @Value("${cloudmqtt.broker}")
    String cloudmqttBroker;
    @Value("${cloudmqtt.user}")
    String cloudmqttUser;
    @Value("${cloudmqtt.pass}")
    String cloudmqttPass;


    @Value("${mosquitto.broker}")
    String mosquittoBroker;

    @Autowired
    ESP8266Repository esp8266Repository;

    @Autowired
    RoomRepository roomRepository;

    private IMqttClient mqttClient;

    String localBroker = "tcp://" + HostAddressGetter.getIp() + ":1883";
    String espDataProducer = "espDataProducer";
    String[] sensorType = {"sensor", "heater", "cooler"};
    String[] roomName = {"Kitchen", "Bathroom", "Living"};


    @PostConstruct
    public void init() throws MqttException {
        String localBroker = "tcp://" + HostAddressGetter.getIp() + ":1883";
        MqttConnectOptions options = new MqttConnectOptions();
        options.setAutomaticReconnect(true);
//      options.setCleanSession(true);
        options.setConnectionTimeout(10000);
        options.setKeepAliveInterval(10000);

        if (isMQTTOnline) {
            logger.info("MQTT cloud Broker");
//            options.setUserName(cloudmqttUser);
//            options.setPassword(cloudmqttPass.toCharArray());
            mqttClient = new MqttClient(mosquittoBroker, "tester");
        } else {
            logger.info("MQTT local Broker");
            mqttClient = new MqttClient(localBroker, "tester");

        }
        mqttClient.connect(options);

    }

    public void newEspTest() throws MqttException, InterruptedException {
        MqttMessage msg = new MqttMessage("sensor".getBytes());
        msg.setQos(2);
        mqttClient.publish("/esp8266/idTest", msg);
        Thread.sleep(500);
        Optional<ESP8266> check = esp8266Repository.findById("idTest");
        if (!check.isPresent() || !check.get().getIsSensor() || check.get().getIsCooler())
            logger.error("newEspTest sensor error");
        esp8266Repository.delete(check.get());

        msg = new MqttMessage("heater".getBytes());
        msg.setQos(2);
        mqttClient.publish("/esp8266/idTest", msg);
        Thread.sleep(500);
        check = esp8266Repository.findById("idTest");
        if (!check.isPresent() || check.get().getIsSensor() || check.get().getIsCooler())
            logger.error("newEspTest heater error");
        esp8266Repository.delete(check.get());

        msg = new MqttMessage("cooler".getBytes());
        msg.setQos(2);
        mqttClient.publish("/esp8266/idTest", msg);
        Thread.sleep(500);
        check = esp8266Repository.findById("idTest");
        if (!check.isPresent() || check.get().getIsSensor() || !check.get().getIsCooler())
            logger.error("newEspTest cooler error");
        esp8266Repository.delete(check.get());
    }


    public void createEsp() throws MqttException {
        MqttMessage msg;
        int id;
        esp8266Repository.deleteAll();
        List<ESP8266> savedEsp = new LinkedList<>();

        for (int i = 0; i < sensorType.length; i++) {
            msg = new MqttMessage(sensorType[i].getBytes());
            msg.setQos(2);
            id = ThreadLocalRandom.current().nextInt(0, 100 + 1);
            mqttClient.publish("/esp8266/idTest" + id, msg);
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            ESP8266 esp8266 = esp8266Repository.findById("idTest" + id).get();
            savedEsp.add(esp8266);
            logger.info("esp with id: " + esp8266.getIdEsp() + " created");
        }

        associateEspToRoom(savedEsp);
    }

    private void associateEspToRoom(List<ESP8266> savedEsp) {
        roomRepository.deleteAll();
        int i = 0;
        for (ESP8266 esp8266 : savedEsp) {
            if (esp8266.getIsSensor()) {
                roomRepository.save(new Room(roomName[i], Collections.singletonList(esp8266.getIdEsp()), false, 0.0));
                i++;
            }
        }
   }

    @Scheduled(fixedRate = 10000)
    public void newSensorData() throws MqttException, InterruptedException {
        setUpProducer();
        String supp = Precision.round(ThreadLocalRandom.current().nextDouble(0, 100), 2) + "_" + Precision.round(ThreadLocalRandom.current().nextDouble(0, 100), 2) + "_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSSSSS"));
        MqttMessage msg = new MqttMessage(supp.getBytes());
        msg.setQos(2);
        mqttClient.publish("/" + espDataProducer + "/sensor", msg);
    }

    private void setUpProducer() throws MqttException, InterruptedException {
        if (!esp8266Repository.findById(espDataProducer).isPresent()) {
            MqttMessage msg = new MqttMessage("sensor".getBytes());
            msg.setQos(2);
            mqttClient.publish("/esp8266/" + espDataProducer, msg);
            Thread.sleep(500);
        }
    }
}
