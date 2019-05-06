package it.polito.thermostat.controllermd.object;

import lombok.Data;

import java.time.LocalTime;

/**
 * wake
 * leave
 * return
 * sleep
 */
@Data
public class DailyProgramm {
    private LocalTime wakeTime;
    private Integer wakeTemperature;

    private LocalTime leaveTime;
    private Integer leaveTemperature;

    private LocalTime backTime;
    private Integer backTemperature;

    private LocalTime sleepTime;
    private Integer sleepTemperature;

}