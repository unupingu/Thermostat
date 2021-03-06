package it.polito.thermostat.controllermd.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.redis.core.RedisHash;

import java.time.LocalDateTime;

@Data
@RedisHash("wsal")
public class WSAL {
    @Id
    private String id;

    private Boolean isWinter;
    private Boolean isSummer;

    private Boolean isAntiFreeze;
    private Double antiFreezeTemperature;

    private Boolean isLeave;
    private Double leaveTemperature;
    private LocalDateTime leaveEnd;

}
