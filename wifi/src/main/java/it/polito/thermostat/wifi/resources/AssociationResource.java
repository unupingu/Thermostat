package it.polito.thermostat.wifi.resources;

import lombok.Data;

@Data
public class AssociationResource {
    private String idEsp;
    private String idRoom;
    private Boolean addBool;
}
