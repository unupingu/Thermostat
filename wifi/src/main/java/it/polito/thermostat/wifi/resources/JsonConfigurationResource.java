package it.polito.thermostat.wifi.resources;
import lombok.Data;

import java.util.Map;

@Data
public class JsonConfigurationResource {
    Map<String,String> mapEspRoom;
}
