const axios = require("axios");

function getDateCustomValues(obj) {
  // Aseguramos que obj y obj.name existan antes de hacer el replace para evitar caídas
  return obj && obj.name ? obj.name.replace('disponible-', '') : '';
}

const getCustomFields = async (req, res, next) => {
    const { fecha } = req.body;
    const locationId = process.env.LOCATION_ID_PAUE; // Requisito de la API v2

    //console.log("locationID: ", locationId)
    
    // CORRECCIÓN: Nuevo endpoint oficial de Custom Values en la v2
    const API_CUSTOM_VALUES = `https://services.leadconnectorhq.com/locations/${locationId}/customValues`;

    if (!locationId) {
        return res.status(400).json({ error: 'GHL_LOCATION_ID es requerido en las variables de entorno' });
    }

    try {
        const response = await axios.get(API_CUSTOM_VALUES, {
            headers: {
                'Version': '2021-07-28', // Requisito obligatorio en la v2
                'Authorization': `Bearer ${process.env.ACCESS_TOKEN_PAUE}`, // Tu token v2 (pit-...)
                'Accept': 'application/json'
            },
        });

        //console.log("RESPONSE: ", response)

        if (!response.data || !response.data.customValues) {
            return res.status(500).json({ error: 'No se recibieron Custom Values de GHL' });
        }

        const customValues = response.data.customValues;
        
        // Inicializamos la variable en req.body para que no quede undefined si no encuentra coincidencias
        req.body.placesAvailable = 0; 

        customValues.forEach(custom => {
            const dateCustom = getDateCustomValues(custom);
            //console.log("custom: ", custom)
            if (fecha === dateCustom) {
                
                req.body.placesAvailable = parseInt(custom.value) || 0;
            } else if (custom.name === 'cupos-diarios') {
                // Si ya se asignó la fecha específica, no la sobrescribimos con el genérico
                if (!req.body.placesAvailable || req.body.placesAvailable === 0) {
                    req.body.placesAvailable = parseInt(custom.value) || 0;
                }
            }
        });

        // Éxito: Pasamos al siguiente middleware/controlador
        next();

    } catch (error) {
        // DETALLE CRÍTICO: Log detallado para saber exactamente qué falló (401, 404, Timeout...)
        console.error('❌ Error real al obtener los CUSTOM VALUES en v2:');
        console.error(`Status: ${error.response?.status} | Mensaje: ${error.response?.data?.message || error.message}`);
        
        // SOLUCIÓN AL CUELGUE: Si falla la API, respondemos con error o llamamos a next() 
        // dependiendo de tu regla de negocio. Aquí devolvemos un 500 para alertar a tu cliente.
        return res.status(error.response?.status || 500).json({ 
            error: 'Error interno al consultar Custom Values en GHL',
            details: error.response?.data || error.message 
        });
    }
}

module.exports = getCustomFields;