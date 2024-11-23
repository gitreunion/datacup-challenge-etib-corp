export const getData = async () => {
    let offset: string = "100";
    let apiUrl = 'https://data.tco.re/api/explore/v2.1/catalog/datasets/signalements_depots_sauvages_citoyennes_10_2024/records?limit=100&offset=' + offset;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        while (data.results.length != (data.total_count - 100)) {
            offset = (parseInt(offset) + 100).toString();
            apiUrl = 'https://data.tco.re/api/explore/v2.1/catalog/datasets/signalements_depots_sauvages_citoyennes_10_2024/records?limit=100&offset=' + offset;
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const newData = await response.json();
            data.results = data.results.concat(newData.results);
        };
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
};

export const convertToGeoJSON = (data: any) => {
    return {
        type: "FeatureCollection",
        features: data.results.map((item: any) => {
            return {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [item.geom.lon, item.geom.lat],
                },
                image_name: item.image_name,
                location: {
                    city: item.ville,
                    district: item.commune,
                    street: item.rue
                },
                date: item.date,
                status: item.status
            };
        })
    };
};
