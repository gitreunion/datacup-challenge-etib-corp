import React, { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { getData, convertToGeoJSON } from "./_map";
import MarkerClusterGroup from "react-leaflet-cluster";
import ReactLoading from "react-loading";

const customIcon = L.icon({
  iconUrl: "/marker.png",
  iconSize: [35, 50],
});

const bold = { fontWeight: "bold" };

function checkStatus(status: string, markerStatus: string) {
  if (status === "pending") {
    return markerStatus === "Non nettoyé";
  } else if (status === "validated") {
    return markerStatus === "Nettoyé";
  } else {
    return false;
  }
}

function checkDate(date: string, markerDate: string) {
  if (date === "today") {
    return markerDate === new Date().toISOString().split("T")[0];
  } else if (date === "week") {
    return (
      new Date(markerDate).getTime() >=
      new Date(new Date().setDate(new Date().getDate() - 7)).getTime()
    );
  } else if (date === "month") {
    return (
      new Date(markerDate).getTime() >=
      new Date(new Date().setMonth(new Date().getMonth() - 1)).getTime()
    );
  } else {
    return false;
  }
}

function createMarkers(geoJsonData: any) {
  const markers: any[] = [];

  if (geoJsonData) {
    geoJsonData.features.forEach((feature: any, index: number) => {
      if (feature.geometry.type === "Point") {
        const [lng, lat] = feature.geometry.coordinates;
        markers.push({
          index,
          lat,
          lng,
          name: feature.geometry?.image_name || "No Name",
          location: feature.location,
          date: feature.date,
          status: feature.status,
        });
      }
    });
  }
  return markers;
}

export default function Map() {
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [status, setStatus] = useState<string>("");
  const [date, setDate] = useState<string>("all");
  const [filter, setFilter] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getData();
        const geoJson = convertToGeoJSON(data);
        if (geoJson) {
          setGeoJsonData(geoJson);
          const createdMarkers = createMarkers(geoJson);
          setMarkers(createdMarkers);
          setLoading(false);
          setCities(
            createdMarkers
              .map((marker) => marker.location.city)
              .filter((value, index, self) => self.indexOf(value) === index)
          );
        }
      } catch (error) {
        console.error("Error fetching or processing data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  console.log("Markers:", markers);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      {loading ? (
        <ReactLoading type="spin" color="#000" height={50} width={50} />
      ) : (
          <MapContainer
            center={[-21.1151, 55.5364]}
            style={{ height: "100vh", width: "100%" }}
            zoom={10}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {geoJsonData && markers.length > 0 && (
              <MarkerClusterGroup chunkedLoading>
                {markers.map(
                  (marker) =>
                    (selectedCity.includes(marker.location.city) ||
                      selectedCity.length === 0) &&
                    (status === "" || checkStatus(status, marker.status)) &&
                    (date === "all" || checkDate(date, marker.date)) && (
                      <Marker
                        key={marker.index}
                        position={[marker.lat, marker.lng]}
                        icon={customIcon}
                      >
                        <Popup>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              overflowY: "scroll",
                              height: "15vh",
                              gap: "0px",
                            }}
                          >
                            <div>
                              <span style={bold}>Status:</span>
                              <p>{marker.status}</p>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "0px",
                                justifyContent: "start",
                                justifyItems: "start",
                              }}
                            >
                              <span style={bold}>Localisation :</span>
                              <p>
                                <span style={bold}>Ville:</span>
                                {" " + marker.location.city}
                              </p>
                              <p>
                                <span style={bold}>Commune:</span>
                                {" " + marker.location.district}
                              </p>
                              <p>
                                <span style={bold}>Rue:</span>
                                {" " + marker.location.street}
                              </p>
                              <p>
                                <span style={bold}>Longitude:</span>
                                {" " + marker.lng}
                              </p>
                              <p>
                                <span style={bold}>Latitude:</span>
                                {" " + marker.lat}
                              </p>
                            </div>
                            <div>
                              <p>
                                <span style={bold}>Date:</span>
                                {" " + marker.date}
                              </p>
                            </div>
                            <div>
                              <span style={bold}>Image:</span>
                              <img
                                src={
                                  "https://www.ordure.re/uploads/" +
                                  marker.name
                                }
                                alt="marker"
                                style={{ width: "100%" }}
                              />
                              </div>
                          </div>
                        </Popup>
                      </Marker>
                    )
                )}
              </MarkerClusterGroup>
            )}
          </MapContainer>
      )}
    </div>
  );
}
