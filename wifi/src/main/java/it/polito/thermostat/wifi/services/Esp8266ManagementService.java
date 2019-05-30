package it.polito.thermostat.wifi.services;

import it.polito.thermostat.wifi.entity.Room;
import it.polito.thermostat.wifi.entity.ESP8266;
import it.polito.thermostat.wifi.repository.ESP8266Repository;
import it.polito.thermostat.wifi.repository.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;


@Service
public class Esp8266ManagementService {
    @Autowired
    ESP8266Repository esp8266Repository;

    @Autowired
    RoomRepository roomRepository;

    /**
     * Allow us to set an association between an esp and the choosen room
     * TODO set up control
     *
     * @param idRoom
     * @param idEsp
     * @return
     */
    public void setAssociation(String idEsp, String idRoom) {
        ESP8266 esp8266 = esp8266Repository.findById(idEsp).get();

        Room room;
        List<ESP8266> esp8266List;
        //The esp was already associated to some room
        if (!esp8266.getIdRoom().equals(idRoom) && esp8266.getIdRoom() != null) {
            //remove esp from the old room
            room = roomRepository.findById(esp8266.getIdRoom()).get();
            esp8266List = room.getEsp8266List();
            room.setEsp8266List(esp8266List.stream().filter(esp -> !esp.getIdEsp().equals(idEsp)).collect(Collectors.toList()));
            roomRepository.save(room);
        }

        //add esp to the new room
        esp8266.setIdRoom(idRoom);
        esp8266Repository.save(esp8266);
        room = roomRepository.findById(idRoom).get();
        esp8266List = room.getEsp8266List();
        esp8266List.add(esp8266);
        room.setEsp8266List(esp8266List);
        roomRepository.save(room);

    }

    /**
     * Allow us to delete an association between an esp and the choosen room
     * TODO set up control
     *
     * @param idEsp
     * @return
     */
    public void deleteAssociation(String idEsp) {
        ESP8266 esp8266 = esp8266Repository.findById(idEsp).get();

        Room room = roomRepository.findById(esp8266.getIdRoom()).get();
        List<ESP8266> esp8266List = room.getEsp8266List();
        room.setEsp8266List(esp8266List.stream().filter(esp -> !esp.getIdEsp().equals(idEsp)).collect(Collectors.toList()));
        roomRepository.save(room);

        esp8266.setIdRoom(null);
        esp8266Repository.save(esp8266);
    }

    /**
     * Retrive a list of free esp
     * @return
     */
    public List<ESP8266> getEspFree() {
        return StreamSupport.stream(esp8266Repository.findAll().spliterator(),false).collect(Collectors.toList());
    }
}
