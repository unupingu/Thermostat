package it.polito.thermostat.wifi.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;

import java.util.List;

@Data
@RedisHash("rooms")
public class Room {
    @Id
    private String idRoom;
    private List<ESP8266> esp8266List;
    private Boolean isManual;
    private Double desiredTemperature;

}
