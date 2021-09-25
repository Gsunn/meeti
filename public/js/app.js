import { OpenStreetMapProvider } from "leaflet-geosearch"


// Obtener valores del BBDD
let lat// = document.querySelector('#lat').value // 42.34106
let long// = document.querySelector('#lng').value // -3.70184
let direccion

//const lat = 42.34106
//const long = -3.70184
let markers, marker, map


document.addEventListener('DOMContentLoaded', () => {
    

    if (document.querySelector('.mapa')) {

        lat = document.querySelector('#lat').value || 42.34106 // 42.34106
        long = document.querySelector('#lng').value || -3.70184 // -3.70184
        direccion = document.querySelector('#direccion').value || '' 

        console.log(lat + " " + long);


        //console.log(document.querySelector('.mapa'));
       
        //console.log(geocodeService);

        map = L.map('mapa').setView([lat, long], 15)

        markers = new L.FeatureGroup().addTo(map)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map)

        //Buscar direccion
        const buscador = document.querySelector('#formbuscador')
        buscador.addEventListener('input', buscarDireccion)


        if(lat && long){
            //Agregar pin
            marker = new L.marker([lat, long], {
            draggable: true,
            autoPan: true,
            }).addTo(map).bindPopup(`Tu Meeti.<br> ${direccion}`).openPopup()


              //Detctar movimiento del marker
              marker.on('moveend', (e) => {
                //console.log(e);
                marker = e.target
                //console.log('MARKER ', marker);
                const posicion = marker.getLatLng()
                //console.log('POSICION', posicion);
                geocodeService.reverse().latlng(posicion, 15).run(function (error, result) {
                    //console.log('RESULT', result);
                    //console.log(result.address.Match_addr)
                    map.panTo(new L.LatLng(posicion.lat, posicion.lng))
                    marker.bindPopup(`Tu Meeti. <br> ${result.address.Match_addr}`).openPopup();
                    // L.marker(posicion).addTo(map).bindPopup(result.address.Match_addr).openPopup();
                    llenarInputs(result)
                })
            })

        }

    }

})

function buscarDireccion(e) {
    if (e.target.value.length > 8) {

        // Limpiar pines
        markers.clearLayers()

        //Geocode
        // const geocodeService = L.esri.Geocoding.geocodeService({
        //     apikey: 'AAPKee5e3ca5108b467e8f5a303b0d226e0aRE7NUoNfTwIUvUM4npC72c_xJIeGP7An4C5YLsk4s9dAOvcjQU0gRSxQofwdE_sD' // replace with your api key - https://developers.arcgis.com
        //   })

        const provider = new OpenStreetMapProvider()

        provider.search({
            query: e.target.value
        }).then((resultado) => {
            //console.log('RESULTADO', resultado);
             if (!resultado) return
             geocodeService.reverse().latlng(resultado[0].bounds[0], 15).run(function (error, result) {
                llenarInputs(result)
             });


            //Mostrar Mapa
            map.setView(resultado[0].bounds[0], 15)

            //Agregar pin
            marker = new L.marker(resultado[0].bounds[0], {
                draggable: true,
                autoPan: true,
            }).addTo(map).bindPopup(`Tu Meeti.<br> ${resultado[0].label}`).openPopup()

            markers.addLayer(marker)

            //Detctar moviemiento del marker
            marker.on('moveend', (e) => {
                //console.log(e);
                marker = e.target
                //console.log('MARKER ', marker);
                const posicion = marker.getLatLng()
                //console.log('POSICION', posicion);
                geocodeService.reverse().latlng(posicion, 15).run(function (error, result) {
                    //console.log('RESULT', result);
                    //console.log(result.address.Match_addr)
                    map.panTo(new L.LatLng(posicion.lat, posicion.lng))
                    marker.bindPopup(`Tu Meeti. <br> ${result.address.Match_addr}`).openPopup();
                    // L.marker(posicion).addTo(map).bindPopup(result.address.Match_addr).openPopup();
                    llenarInputs(result)
                })
            })
        })
    }
}

function llenarInputs(data){
    console.log("DATA", data);
    document.querySelector('#direccion').value = data.address.Address || '';
    document.querySelector('#ciudad').value = data.address.City || '';
    document.querySelector('#estado').value = data.address.Region || '';
    document.querySelector('#pais').value = data.address.CountryCode || '';
    document.querySelector('#lat').value = data.latlng.lat || '';
    document.querySelector('#lng').value = data.latlng.lng || '';
}

