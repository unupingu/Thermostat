package it.polito.thermostat.tester.serviceTest;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.net.SocketException;
import java.util.Enumeration;

public class HostAddressGetter {

    private static String getB(String address) throws SocketException {
        boolean isWindows = System.getProperty("os.name").toLowerCase().startsWith("windows");


        Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
        while (interfaces.hasMoreElements()) {
            NetworkInterface networkInterface = interfaces.nextElement();

            if (networkInterface.isUp() &&
                    !networkInterface.isLoopback() &&
                    !networkInterface.isVirtual()) {

                String nameInterface;
                if (isWindows) {
                    nameInterface = "Intel";
                } else {
                    nameInterface = "wlan0";
                }
                if (networkInterface.getDisplayName().contains(nameInterface)) {
                    Enumeration<InetAddress> addresses = networkInterface.getInetAddresses();
                    while (addresses.hasMoreElements()) {
                        InetAddress addr = addresses.nextElement();
                        if (addr.getHostAddress().length() < 20) {
                            if (address.equals("ip"))
                                return addr.getHostAddress();

                            NetworkInterface network = NetworkInterface.getByInetAddress(addr);

                            byte[] mac = network.getHardwareAddress();
                            StringBuilder sb = new StringBuilder();
                            for (int i = 0; i < mac.length; i++) {
                                sb.append(String.format("%02X%s", mac[i], (i < mac.length - 1) ? ":" : ""));
                            }

                            if (address.equals("mac"))
                                return sb.toString();
                        }
                    }
                }
            }
        }
        return null;
    }

    public static String getMAC() {
        int i = 0;
        while (i < 10) {
            try {
                return getB("mac");
            } catch (SocketException e) {
                i++;
            }
        }
        return null;
    }


    public static String getIp() {
        int i = 0;
        while (i < 10) {
            try {
                return getB("ip");
            } catch (SocketException e) {
                i++;
            }
        }
        return null;
    }


}
