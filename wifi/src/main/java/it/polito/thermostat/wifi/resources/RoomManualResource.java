package it.polito.thermostat.wifi.resources;

import lombok.Data;

@Data
public class RoomManualResource  {
    private String idRoom;
    private Double desiredTemperature;
}
