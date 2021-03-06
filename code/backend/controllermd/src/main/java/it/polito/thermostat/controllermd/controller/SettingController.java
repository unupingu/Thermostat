package it.polito.thermostat.controllermd.controller;

import com.google.zxing.WriterException;
import it.polito.thermostat.controllermd.entity.Program;
import it.polito.thermostat.controllermd.repository.ESP8266Repository;
import it.polito.thermostat.controllermd.resources.RoomResource;
import it.polito.thermostat.controllermd.resources.StatsResource;
import it.polito.thermostat.controllermd.resources.WifiNetResource;
import it.polito.thermostat.controllermd.services.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;


/*
 DENIED Redis is running in protected mode because protected mode is enabled, no bind address was specified, no authentication password is requested to clients. In this mode connections are only accepted from the loopback interface.
 If you want to connect from external computers to Redis you may adopt one of the following solutions:
 1) Just disable protected mode sending the command 'CONFIG SET protected-mode no' from the loopback interface by connecting to Redis from the same host the server is running, however MAKE SURE Redis is not publicly accessible from internet if you do so. Use CONFIG REWRITE to make this change permanent.
 2) Alternatively you can just disable the protected mode by editing the Redis configuration file, and setting the protected mode option to 'no', and then restarting the server.
 3) If you started the server manually just for testing, restart it with the '--protected-mode no' option.
 4) Setup a bind address or an authentication password. NOTE: You only need to do one of the above things in order for the server to start accepting connections from the outside.

 */
@RestController
public class SettingController {
    private Logger logger = LoggerFactory.getLogger(this.getClass());
    private boolean isWindows = System.getProperty("os.name").toLowerCase().startsWith("windows");

    @Autowired
    WifiService wifiService;

    @Autowired
    Esp8266ManagementService esp8266ManagementService;

    @Autowired
    TemperatureService temperatureService;

    @Autowired
    ESP8266Repository esp8266Repository;

    @Autowired
    SettingService settingService;

    @Autowired
    StatService statService;

    @Autowired
    QRService qrService;

    /**
     * @return a list of free esp
     */
    @GetMapping("/setting/esp/free")
    public List<String> getEspFree() {
        logger.info("I'm gonna return the list of free esp");
        return esp8266ManagementService.getEspFree();
    }


    /**
     * Endpoint to save a room
     *
     * @param roomResource
     */
    @PostMapping("/setting/room/resource")
    public void postRoom(@RequestBody RoomResource roomResource) {
        logger.info("Room " + roomResource.getIdRoom() + " will be saved");
        settingService.saveRoomResource(roomResource);
    }

    @GetMapping("/setting/room/resource/{idRoom}")
    public RoomResource getRoomResource(@PathVariable("idRoom") String idRoom) {
        logger.info("I'm gonna retrive the roomResource for " + idRoom);
        RoomResource roomResource = settingService.getRoomResource(idRoom);
        return roomResource;
    }

    /**
     * Endpoint to delete a room
     *
     * @param idRoom
     */
    @DeleteMapping("/setting/room")
    public void postRoom(@RequestBody String idRoom) {
        settingService.deleteRoom(idRoom);
    }

    /**
     * @return the list of saved room
     */
    @GetMapping("/setting/room/list")
    public List<String> getListRoom() {
        return settingService.getListRoom();
    }


    /**
     * @return the default room setting
     */
    @GetMapping("/setting/default_program")
    public Program getDefaultProgram() {
        logger.info("/setting/default_program contacted");
        return settingService.getDefaultProgram();
    }

    /**
     * @return the program asscoiated to @param idRoom
     */
    @GetMapping("/setting/program/{idRoom}")
    public Program getProgram(@PathVariable("idRoom") String idRoom) {
        logger.info("I'm trying to retrive a program for " + idRoom);
        Program result = settingService.getProgramRoom(idRoom);
        return result;
    }

    /**
     * @return list of available net
     */
    @GetMapping("/setting/wifi/list")
    public List<WifiNetResource> wifiList() {
        if (isWindows)
            return Arrays.asList(new WifiNetResource("NewIpNetworkName", false), new WifiNetResource("KnownIpNetworkName", true));
        else
            return wifiService.getAvailableNet();
    }

    /**
     * Endpoint that allow us to connect to a net
     * Send the netPassword == null to connect to a known net
     *
     * @param wifiNetResource net credentials
     * @return true/false
     */
    @PostMapping("/setting/wifi/credentials")
    public String postWifi(@RequestBody WifiNetResource wifiNetResource) {
        logger.info("I'm gonna connect to this net -> " + wifiNetResource.toString());
        if (!isWindows)
            return wifiService.connectToNet(wifiNetResource.getEssid(), wifiNetResource.getNetPassword()).toString();
        else {
            String result = String.valueOf(ThreadLocalRandom.current().nextInt(0, 2) == 1);
            logger.info("This operation is not available on windows, I'm gonna return " + result);
            return result;
        }
    }

    /**
     * Endpoint for the device discovery
     *
     * @return "iamrpi" when contacted
     */
    @GetMapping("/setting/device_discovery")
    public String ping() {
        logger.info("Just received a ping, I'm gonna respond >iamrpi<");
        return "iamrpi";
    }

    /**
     * @return the stats related to @param idRoom
     */
    @GetMapping("/setting/stats/{idRoom}")
    public StatsResource getStatsResourceRoom(@PathVariable("idRoom") String idRoom) {
        logger.info("get /setting/stats/" + idRoom + " contacted");
        return statService.getweeklyStats(idRoom);
    }

    /**
     *
     * @return the qr image needed to remotly connect to the thermostat
     * @throws IOException
     * @throws WriterException
     */
    @GetMapping(value = "/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public @ResponseBody
    byte[] qr() throws IOException, WriterException {
        logger.info("/qr contacted");
        return qrService.getQRCodeImage();
    }
}
