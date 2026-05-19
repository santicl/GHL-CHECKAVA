const axios = require("axios");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getSubmissionsV2 = async (formId, locationId, accessToken, limit = 100) => {
    let page = 1;
    let allSubmissions = [];
    let hasMore = true;

    while (hasMore) {
        // CORRECCIÓN: Nuevo endpoint oficial de la API v2
        const url = `https://services.leadconnectorhq.com/forms/submissions?page=${page}&limit=${limit}&formId=${formId}&locationId=${locationId}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    // CORRECCIÓN: La API v2 exige la versión en los headers (usualmente '2021-07-28')
                    'Version': '2021-07-28', 
                    'Authorization': `Bearer ${accessToken}`, // Tu token v2
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            // En la v2, la estructura de respuesta puede variar ligeramente o incluir meta.total
            const submissions = response.data.submissions || [];
            allSubmissions = allSubmissions.concat(submissions);

            // GHL v2 suele devolver un objeto 'meta' con la paginación. 
            // Si no viene, usamos la validación por límite.
            const meta = response.data.meta || {};
            if (submissions.length < limit || (meta.nextPage === null || !meta.nextPage)) {
                hasMore = false;
            } else {
                page++;
                await delay(250); // Un pequeño delay preventivo estándar
            }

        } catch (error) {
            console.error(`❌ Error real en GHL v2 - FormId: ${formId} | Página: ${page}`);
            console.error(`Status: ${error.response?.status} | Mensaje: ${error.response?.data?.message || error.message}`);
            throw error;
        }
    }

    return allSubmissions;
};

const getFormAllByIdSubmissions = async (req, res, next) => {
    const formPAUESKY = process.env.FORM_PAUE;
    const accessTokenSKYGroup = process.env.ACCESS_TOKEN_SKY_GROUP;
    const locationId = process.env.LOCATION_ID_SKY_GROUP; // REQUISITO API V2: ID de la subcuenta
    const limit = 100;

    if (!formPAUESKY || !accessTokenSKYGroup || !locationId) {
        return res.status(400).json({ 
            error: 'FORM_ID, FORM_SECOND_ID y GHL_LOCATION_ID son requeridos en las variables de entorno' 
        });
    }

    try {
        let combinedSubmissions = [];

        // Ejecución en serie para máxima seguridad en producción
        const form1Data = await getSubmissionsV2(formPAUESKY, locationId, accessTokenSKYGroup, limit);
        combinedSubmissions = combinedSubmissions.concat(form1Data);

        {/*

        await delay(500); 

        const form2Data = await getSubmissionsV2(formPremium, locationId, limit);
        combinedSubmissions = combinedSubmissions.concat(form2Data);

        */}
        console.log("ALL SUBMITIONS: ", combinedSubmissions)

        req.body.submissions = combinedSubmissions;
        next();

    } catch (error) {
        console.error('Error crítico en el middleware v2:', error.message);
        res.status(error.response?.status || 500).json({
            error: 'Error al obtener datos desde GHL v2',
            details: error.response?.data || error.message
        });
    }
};

module.exports = getFormAllByIdSubmissions;